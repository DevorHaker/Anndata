import { IntelligenceFeatureVector } from '../../types/intelligence';

export class RuleEngineService {
  /**
   * Deterministic operational formula estimate for service duration (minutes)
   */
  calculateServiceDurationMinutes(features: IntelligenceFeatureVector, quantityKg = 1000): number {
    const baseMinutes = 8;
    const quantityComponentMinutes = (quantityKg / 1000) * 3; // 3 min per ton
    const equipmentFactor = features.equipmentAvailable > 0 ? 1 / features.equipmentAvailable : 1.5;
    const disruptionPenalty = features.disruptionCount * 10;

    return Math.round(baseMinutes + quantityComponentMinutes + equipmentFactor * 2 + disruptionPenalty);
  }

  /**
   * Deterministic operational wait time estimate
   */
  calculateWaitTimeMinutes(features: IntelligenceFeatureVector): number {
    const activeAhead = features.queueLength;
    const activeCounters = Math.max(1, features.equipmentAvailable);
    const serviceRatePerCounter = 12; // 12 mins per farmer average

    const rawWait = (activeAhead * serviceRatePerCounter) / activeCounters;
    const stateMultiplier = features.centreState === 'CRITICAL' ? 1.5 : features.centreState === 'CONGESTED' ? 1.25 : 1.0;

    return Math.round(rawWait * stateMultiplier);
  }
}

export const ruleEngineService = new RuleEngineService();
