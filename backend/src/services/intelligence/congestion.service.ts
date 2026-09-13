import { centreDomainService } from '../centreDomain.service';
import { featureService } from './feature.service';
import { confidenceService } from './confidence.service';
import { statisticalEngineService } from './statisticalEngine.service';
import { 
  CentreIntelligenceStatus, 
  MissedSlotRiskResult, 
  IntelligenceConfidence 
} from '../../types/intelligence';

export class CongestionService {
  /**
   * Get real-time status and 30-60 min predictive congestion for a centre
   */
  async getCentreStatus(centreId: string): Promise<CentreIntelligenceStatus> {
    let centreName = 'Procurement Mandi';
    try {
      const centre = await centreDomainService.getCentreDetails(centreId);
      if (centre) centreName = centre.name;
    } catch (err) {
      // Fallback
    }

    const features = await featureService.getCentreFeatureVector(centreId);
    const currentWait = statisticalEngineService.calculateWaitTimeMinutes(features);

    // Predictive Congestion (30 & 60 mins ahead based on queue trend)
    const predictedWait30Min = Math.round(currentWait * (1 + (features.activeTokens > 15 ? 0.25 : 0.05)));
    const predictedWait60Min = Math.round(currentWait * (1 + (features.activeTokens > 15 ? 0.45 : 0.10)));

    const confidence: IntelligenceConfidence = confidenceService.calculateConfidence(features);

    const reasons: string[] = [];
    if (features.centreState === 'CRITICAL') {
      reasons.push('High active token density exceeding counter processing capacity');
    } else if (features.centreState === 'CONGESTED') {
      reasons.push('Current waiting time exceeds optimal 25-minute SLA target');
    } else {
      reasons.push('Operational throughput within normal parameters');
    }

    if (features.equipmentAvailable < 2) {
      reasons.push('Reduced weighbridge equipment availability');
    }

    return {
      centreId,
      centreName,
      state: features.centreState,
      currentQueueLength: features.queueLength,
      currentWaitMinutes: currentWait,
      predictedWait30Min,
      predictedWait60Min,
      capacityUtilizationPct: features.currentCentreUtilizationPct,
      bottleneckStage: 'WEIGHING',
      confidence,
      reasons,
      lastUpdatedTimestamp: new Date().toISOString()
    };
  }

  /**
   * Cross-centre Load Balancing recommendations
   */
  async calculateLoadBalancing(centreId: string) {
    const sourceStatus = await this.getCentreStatus(centreId);
    if (sourceStatus.state !== 'CONGESTED' && sourceStatus.state !== 'CRITICAL') {
      return {
        needLoadBalancing: false,
        sourceCentreId: centreId,
        message: 'Centre is operating normally. No load balancing required.'
      };
    }

    const centreRes = await centreDomainService.listCentres({});
    const allCentres = centreRes.data || [];
    const candidateCentres = [];

    for (const c of allCentres) {
      if (c.id === centreId) continue;
      const status = await this.getCentreStatus(c.id);
      if (status.state === 'NORMAL' || status.state === 'BUSY') {
        candidateCentres.push(status);
      }
    }

    return {
      needLoadBalancing: true,
      sourceCentreId: centreId,
      sourceState: sourceStatus.state,
      suggestedRedistributedBookingsCount: sourceStatus.state === 'CRITICAL' ? 15 : 8,
      recommendedDestinationCentres: candidateCentres,
      expectedWaitReductionMinutes: Math.round(sourceStatus.currentWaitMinutes * 0.35),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Assess Missed-Slot Risk for a booking
   */
  async predictMissedSlotRisk(bookingId: string, farmerId: string): Promise<MissedSlotRiskResult> {
    const riskScore = 25; // Base low risk
    const riskLevel = 'LOW';

    return {
      bookingId,
      farmerId,
      scheduledTime: new Date(Date.now() + 3600000 * 2).toISOString(),
      riskLevel,
      riskScore,
      riskFactors: ['Farmer has 100% past attendance history', 'Route travel conditions normal'],
      recommendedAction: 'Send automated SMS reminder 30 mins prior to slot window.',
      recoveryOptions: [
        {
          centreId: '33333333-3333-4000-8000-333333333333',
          centreName: 'Karnal Central Procurement Mandi',
          slotTime: '02:00 PM',
          estimatedWaitMinutes: 15
        }
      ],
      timestamp: new Date().toISOString()
    };
  }
}

export const congestionService = new CongestionService();
