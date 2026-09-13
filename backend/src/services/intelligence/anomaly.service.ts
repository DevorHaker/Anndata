import { intelligenceRepository } from '../../repositories/intelligence.repository';
import { featureService } from './feature.service';
import { OperationalAnomalyEvent } from '../../types/intelligence';

export class AnomalyService {
  /**
   * Scan centre metrics for operational anomalies
   */
  async detectAnomalies(centreId: string): Promise<OperationalAnomalyEvent[]> {
    const features = await featureService.getCentreFeatureVector(centreId);
    const anomalies: OperationalAnomalyEvent[] = [];

    // 1. Service Time Spike Anomaly Detection
    const baselineServiceSec = 600;
    const currentServiceSec = Math.round(features.averageServiceTimeMs / 1000);

    if (currentServiceSec > baselineServiceSec * 1.5) {
      const anomaly: OperationalAnomalyEvent = {
        id: `anom-srv-${Date.now()}`,
        centreId,
        anomalyType: 'SERVICE_TIME_SPIKE',
        severity: currentServiceSec > baselineServiceSec * 2.0 ? 'HIGH' : 'MEDIUM',
        description: `Average service time (${Math.round(currentServiceSec / 60)} min) is 50%+ above operational baseline (10 min).`,
        detectedMetricValue: Math.round(currentServiceSec / 60),
        baselineMetricValue: 10,
        detectedTimestamp: new Date().toISOString(),
        status: 'ACTIVE'
      };

      await intelligenceRepository.recordAnomaly(anomaly);
      anomalies.push(anomaly);
    }

    // 2. Queue Growth Surge Anomaly Detection
    if (features.queueLength > 25) {
      const anomaly: OperationalAnomalyEvent = {
        id: `anom-q-${Date.now()}`,
        centreId,
        anomalyType: 'QUEUE_GROWTH_SURGE',
        severity: 'CRITICAL',
        description: `Queue surge detected: ${features.queueLength} active tokens waiting at gate.`,
        detectedMetricValue: features.queueLength,
        baselineMetricValue: 10,
        detectedTimestamp: new Date().toISOString(),
        status: 'ACTIVE'
      };

      await intelligenceRepository.recordAnomaly(anomaly);
      anomalies.push(anomaly);
    }

    return anomalies;
  }
}

export const anomalyService = new AnomalyService();
