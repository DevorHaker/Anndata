import { IntelligenceFeatureVector } from '../../types/intelligence';

export class StatisticalEngineService {
  /**
   * Statistical prediction using weighted moving average and service percentiles
   */
  calculateWaitTimeMinutes(features: IntelligenceFeatureVector): number {
    const avgServiceMinutes = features.averageServiceTimeMs / 60000;
    const medianServiceMinutes = features.medianServiceTimeMs / 60000;
    const effectiveServiceMinutes = avgServiceMinutes * 0.6 + medianServiceMinutes * 0.4;

    const activeAhead = features.queueLength;
    const effectiveCapacity = Math.max(1, features.equipmentAvailable * (features.staffAvailable / 6));

    const estimatedWait = (activeAhead * effectiveServiceMinutes) / effectiveCapacity;
    const congestionFactor = 1 + (features.currentCentreUtilizationPct / 100) * 0.3;

    return Math.round(estimatedWait * congestionFactor);
  }

  /**
   * Statistical quantity-aware service time
   */
  calculateServiceTimeMinutes(features: IntelligenceFeatureVector, quantityKg = 1000): number {
    const medianMinutes = features.medianServiceTimeMs / 60000;
    const quantityRatio = quantityKg / 1000;
    const scaledDuration = medianMinutes * (0.6 + 0.4 * quantityRatio);

    return Math.round(scaledDuration);
  }
}

export const statisticalEngineService = new StatisticalEngineService();
