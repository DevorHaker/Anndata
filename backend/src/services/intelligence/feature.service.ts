import { queueRepository } from '../../repositories/queue.repository';
import { procurementRepository } from '../../repositories/procurement.repository';
import { centreDomainService } from '../centreDomain.service';
import { IntelligenceFeatureVector, CentreCongestionState } from '../../types/intelligence';
import { logger } from '../../utils/logger';

export class FeatureService {
  /**
   * Extract feature vector for a specific procurement centre
   */
  async getCentreFeatureVector(
    centreId: string, 
    declaredQuantityKg?: number, 
    cropTypeId?: string
  ): Promise<IntelligenceFeatureVector> {
    const startTime = Date.now();

    // 1. Fetch queue state snapshot
    const queueSnapshot = await queueRepository.getQueueSnapshotForCentre(centreId);
    const activeTokens = queueSnapshot.waitingCount + queueSnapshot.currentlyServing.length;
    const completedTokens = 5; // default benchmark completed count

    // 2. Fetch centre details & capacity
    let centreCapacityKg = 50000;
    let centreState: CentreCongestionState = 'NORMAL';
    let staffAvailable = 6;
    let equipmentAvailable = queueSnapshot.activeCounters || 2;

    try {
      const centre = await centreDomainService.getCentreDetails(centreId);
      if (centre) {
        centreCapacityKg = 50000; // default benchmark
        staffAvailable = 6;
      }
    } catch (err: any) {
      logger.warn(`FeatureService: Could not fetch centre ${centreId}, using defaults`);
    }

    // 3. Compute recent service durations
    const procurementsResult = await procurementRepository.listProcurements({ centreId });
    const completedProcurements = procurementsResult.data || [];
    let avgServiceTimeMs = 600000; // default 10 minutes
    let medianServiceTimeMs = 540000;
    let p95ServiceTimeMs = 900000;

    if (completedProcurements.length > 0) {
      const durations = completedProcurements
        .map((p: any) => (p.completedAt ? new Date(p.completedAt).getTime() - new Date(p.createdAt).getTime() : 600000))
        .filter((d: number) => d > 0)
        .sort((a: number, b: number) => a - b);

      if (durations.length > 0) {
        const sum = durations.reduce((acc: number, curr: number) => acc + curr, 0);
        avgServiceTimeMs = sum / durations.length;
        medianServiceTimeMs = durations[Math.floor(durations.length / 2)];
        p95ServiceTimeMs = durations[Math.floor(durations.length * 0.95)] || avgServiceTimeMs * 1.5;
      }
    }

    // 4. Calculate Utilization Pct
    const currentWeightBookedKg = activeTokens * 1500; // estimated 1.5 tons per token
    const currentCentreUtilizationPct = Math.min(100, Math.round((currentWeightBookedKg / centreCapacityKg) * 100));

    // Determine basic operational congestion state from metrics
    if (queueSnapshot.isPaused) {
      centreState = 'CLOSED';
    } else if (activeTokens > 30 || currentCentreUtilizationPct > 90) {
      centreState = 'CRITICAL';
    } else if (activeTokens > 15 || currentCentreUtilizationPct > 75) {
      centreState = 'CONGESTED';
    } else if (activeTokens > 8 || currentCentreUtilizationPct > 50) {
      centreState = 'BUSY';
    } else {
      centreState = 'NORMAL';
    }

    const featureVector: IntelligenceFeatureVector = {
      centreId,
      timestamp: new Date().toISOString(),
      queueLength: queueSnapshot.waitingCount,
      activeTokens,
      completedTokensLastHour: completedTokens,
      averageServiceTimeMs: avgServiceTimeMs,
      medianServiceTimeMs,
      p95ServiceTimeMs,
      currentCentreUtilizationPct,
      slotUtilizationPct: Math.round(currentCentreUtilizationPct * 0.85),
      remainingCapacityKg: Math.max(0, centreCapacityKg - currentWeightBookedKg),
      staffAvailable,
      equipmentAvailable,
      declaredQuantityKg,
      cropTypeId,
      centreState,
      disruptionCount: queueSnapshot.isPaused ? 1 : 0,
      recentFailureRate: 0.02,
      dataFreshnessAgeSec: Math.round((Date.now() - startTime) / 1000)
    };

    return featureVector;
  }
}

export const featureService = new FeatureService();
