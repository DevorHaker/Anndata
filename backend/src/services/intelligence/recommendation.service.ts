import { centreDomainService } from '../centreDomain.service';
import { featureService } from './feature.service';
import { confidenceService } from './confidence.service';
import { statisticalEngineService } from './statisticalEngine.service';
import { 
  CentreRecommendationResult, 
  CentreRecommendationOption, 
  SlotRecommendationResult, 
  SlotRecommendationOption,
  IntelligenceConfidence 
} from '../../types/intelligence';

export class RecommendationService {
  private configVersion = 'RecommendationConfig v1.3';
  private weights = {
    waitingTime: 0.40,
    distance: 0.20,
    capacity: 0.15,
    utilization: 0.15,
    reliability: 0.10
  };

  /**
   * Recommend optimal procurement centres for a farmer
   */
  async recommendCentres(
    farmerId: string, 
    cropTypeId: string, 
    quantityKg: number
  ): Promise<CentreRecommendationResult> {
    const centreRes = await centreDomainService.listCentres({});
    const allCentres = centreRes.data || [];
    const options: CentreRecommendationOption[] = [];

    for (const centre of allCentres) {
      const features = await featureService.getCentreFeatureVector(centre.id, quantityKg, cropTypeId);
      const estWaitMinutes = statisticalEngineService.calculateWaitTimeMinutes(features);

      // Distance estimation (simulated based on centre location)
      const distanceKm = Math.round((Math.abs(centre.id.charCodeAt(0) % 15) + 1) * 10) / 10;

      // Calculate transparent weighted score (0 to 100)
      const waitScore = Math.max(0, 100 - estWaitMinutes * 2);
      const distScore = Math.max(0, 100 - distanceKm * 5);
      const capScore = Math.min(100, Math.round((features.remainingCapacityKg / 50000) * 100));
      const utilScore = 100 - features.currentCentreUtilizationPct;
      const relScore = features.centreState === 'NORMAL' ? 100 : features.centreState === 'BUSY' ? 80 : 40;

      const overallScore = Math.round(
        waitScore * this.weights.waitingTime +
        distScore * this.weights.distance +
        capScore * this.weights.capacity +
        utilScore * this.weights.utilization +
        relScore * this.weights.reliability
      );

      const pros: string[] = [];
      const cons: string[] = [];

      if (estWaitMinutes < 30) pros.push(`Low estimated waiting time (~${estWaitMinutes} mins)`);
      else cons.push(`Higher waiting time (~${estWaitMinutes} mins)`);

      if (distanceKm < 5) pros.push(`Close proximity (${distanceKm} km)`);
      else cons.push(`Distance is ${distanceKm} km`);

      if (features.currentCentreUtilizationPct < 70) pros.push(`Ample capacity (${100 - features.currentCentreUtilizationPct}% available)`);
      else cons.push(`High capacity utilization (${features.currentCentreUtilizationPct}%)`);

      if (features.centreState === 'NORMAL') pros.push('Normal queue operating condition');
      if (features.equipmentAvailable > 1) pros.push(`${features.equipmentAvailable} active weighbridges operational`);

      const confidence: IntelligenceConfidence = confidenceService.calculateConfidence(features);

      options.push({
        centreId: centre.id,
        centreName: centre.name,
        overallScore,
        estimatedWaitMinutes: estWaitMinutes,
        distanceKm,
        capacityUtilizationPct: features.currentCentreUtilizationPct,
        state: features.centreState,
        confidence,
        pros,
        cons,
        suggestedSlotWindow: '10:00 - 11:00 AM'
      });
    }

    // Rank options by overall score descending
    options.sort((a, b) => b.overallScore - a.overallScore);

    const top = options[0];
    const explanation = top 
      ? `Recommended ${top.centreName} as primary choice because it offers the optimal balance of low waiting time (${top.estimatedWaitMinutes} min) and high available capacity (${100 - top.capacityUtilizationPct}%).`
      : 'No suitable centres currently available.';

    return {
      farmerId,
      cropTypeId,
      quantityKg,
      scoringVersion: this.configVersion,
      weightsUsed: this.weights,
      recommendedCentres: options,
      explanation,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Recommend optimal slot windows for a specific centre
   */
  async recommendSlots(
    centreId: string, 
    cropTypeId: string, 
    quantityKg: number
  ): Promise<SlotRecommendationResult> {
    const features = await featureService.getCentreFeatureVector(centreId, quantityKg, cropTypeId);

    const windows = [
      { slotId: 'slot-0900', timeWindow: '09:00 - 10:00 AM', util: 45, wait: 12 },
      { slotId: 'slot-1000', timeWindow: '10:00 - 11:00 AM', util: 70, wait: 22 },
      { slotId: 'slot-1100', timeWindow: '11:00 - 12:00 PM', util: 88, wait: 38 },
      { slotId: 'slot-1400', timeWindow: '02:00 - 03:00 PM', util: 50, wait: 15 }
    ];

    const slots: SlotRecommendationOption[] = windows.map(w => {
      const now = new Date();
      const serviceStartMs = now.getTime() + w.wait * 60000;
      const serviceDurationMs = 12 * 60000;

      return {
        slotId: w.slotId,
        timeWindow: w.timeWindow,
        capacityUtilizationPct: w.util,
        estimatedWaitMinutes: w.wait,
        expectedServiceStart: new Date(serviceStartMs).toISOString(),
        expectedCompletion: new Date(serviceStartMs + serviceDurationMs).toISOString(),
        confidence: w.util < 80 ? 'HIGH' : 'MEDIUM',
        pros: [
          `Estimated waiting time: ${w.wait} minutes`,
          `Capacity utilization: ${w.util}%`
        ],
        cons: w.util > 85 ? ['Peak hour congestion risk'] : []
      };
    });

    // Rank by lowest estimated wait
    slots.sort((a, b) => a.estimatedWaitMinutes - b.estimatedWaitMinutes);

    return {
      centreId,
      cropTypeId,
      quantityKg,
      recommendedSlots: slots,
      explanation: `Slot window '${slots[0].timeWindow}' is recommended with lowest expected wait time of ${slots[0].estimatedWaitMinutes} minutes.`,
      timestamp: new Date().toISOString()
    };
  }
}

export const recommendationService = new RecommendationService();
