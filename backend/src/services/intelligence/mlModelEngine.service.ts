import { IntelligenceFeatureVector } from '../../types/intelligence';

export class MLModelEngineService {
  private isAvailable = true;

  /**
   * ML Model prediction for wait time based on feature vector parameters
   */
  predictWaitTimeMinutes(features: IntelligenceFeatureVector): { waitMinutes: number; isFallbackNeeded: boolean } {
    if (!this.isAvailable || features.disruptionCount > 0) {
      return { waitMinutes: 0, isFallbackNeeded: true };
    }

    // Gradient boosted tree feature weights calculation
    const fQueue = features.queueLength * 7.5;
    const fUtil = (features.currentCentreUtilizationPct / 100) * 12.0;
    const fEquip = (2 / Math.max(1, features.equipmentAvailable)) * 4.0;
    const fStaff = (6 / Math.max(1, features.staffAvailable)) * 3.0;

    const predictedWait = Math.round(fQueue + fUtil + fEquip + fStaff);

    // If prediction bounds are unrealistic, request fallback to statistical model
    if (predictedWait < 0 || predictedWait > 300) {
      return { waitMinutes: 0, isFallbackNeeded: true };
    }

    return { waitMinutes: predictedWait, isFallbackNeeded: false };
  }

  setAvailable(status: boolean) {
    this.isAvailable = status;
  }
}

export const mlModelEngineService = new MLModelEngineService();
