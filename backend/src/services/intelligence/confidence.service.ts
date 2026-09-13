import { IntelligenceFeatureVector, IntelligenceConfidence } from '../../types/intelligence';

export class ConfidenceService {
  /**
   * Determine prediction confidence score based on operational features
   */
  calculateConfidence(features: IntelligenceFeatureVector, sampleCount = 10): IntelligenceConfidence {
    let score = 100;

    // 1. Data Freshness penalty
    if (features.dataFreshnessAgeSec > 300) {
      score -= 30;
    } else if (features.dataFreshnessAgeSec > 60) {
      score -= 10;
    }

    // 2. Active Disruptions penalty
    if (features.disruptionCount > 0) {
      score -= 35;
    }

    // 3. Low sample count penalty
    if (sampleCount < 3) {
      score -= 30;
    } else if (sampleCount < 8) {
      score -= 15;
    }

    // 4. Extreme congestion/variance penalty
    if (features.centreState === 'CRITICAL' || features.centreState === 'EMERGENCY') {
      score -= 20;
    }

    if (score >= 80) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  }
}

export const confidenceService = new ConfidenceService();
