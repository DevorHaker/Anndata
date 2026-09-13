import { featureService } from './feature.service';
import { confidenceService } from './confidence.service';
import { ruleEngineService } from './ruleEngine.service';
import { statisticalEngineService } from './statisticalEngine.service';
import { mlModelEngineService } from './mlModelEngine.service';
import { queueRepository } from '../../repositories/queue.repository';
import { tokenRepository } from '../../repositories/token.repository';
import { 
  ETAPredictionResult, 
  CalculationEngineType, 
  IntelligenceConfidence 
} from '../../types/intelligence';

export class PredictionService {
  /**
   * Compute live ETA prediction for a digital queue token
   */
  async predictTokenETA(tokenId: string): Promise<ETAPredictionResult> {
    const queueItem = await tokenRepository.findTokenById(tokenId);
    if (!queueItem) {
      throw new Error(`Token ${tokenId} not found`);
    }

    const centreId = queueItem.centreId;
    const features = await featureService.getCentreFeatureVector(centreId);

    // Compute queue position ahead of this token
    const centreQueue = await queueRepository.getQueueSnapshotForCentre(centreId);
    const waitingAhead = centreQueue.waitingCount;

    // Adjust feature vector for token position
    features.queueLength = waitingAhead;

    let estimatedWaitMinutes = 0;
    let calculationMethod: CalculationEngineType = 'ML_MODEL';
    const factors: string[] = [];

    // 1. Try ML Model Engine
    const mlResult = mlModelEngineService.predictWaitTimeMinutes(features);
    if (!mlResult.isFallbackNeeded) {
      estimatedWaitMinutes = mlResult.waitMinutes;
      calculationMethod = 'ML_MODEL';
      factors.push('Gradient Boosted Tree model prediction applied');
    } else {
      // 2. Try Statistical Engine
      estimatedWaitMinutes = statisticalEngineService.calculateWaitTimeMinutes(features);
      calculationMethod = 'STATISTICAL_ENGINE';
      factors.push('Statistical weighted moving average fallback applied');
    }

    // Safeguard fallback to deterministic rule engine
    if (estimatedWaitMinutes <= 0 && waitingAhead > 0) {
      estimatedWaitMinutes = ruleEngineService.calculateWaitTimeMinutes(features);
      calculationMethod = 'RULE_BASED_FALLBACK';
      factors.push('Rule-based operational formula fallback applied');
    }

    // Quantity-aware service duration
    const serviceDurationMinutes = statisticalEngineService.calculateServiceTimeMinutes(features, 1500);

    const confidence: IntelligenceConfidence = confidenceService.calculateConfidence(features, centreQueue.waitingCount);

    const now = new Date();
    const serviceStartMs = now.getTime() + estimatedWaitMinutes * 60000;
    const completionMs = serviceStartMs + serviceDurationMinutes * 60000;
    const paymentMs = completionMs + 2 * 60000; // 2 minutes post-procurement handoff

    // Compute uncertainty error range
    const margin = confidence === 'HIGH' ? 4 : confidence === 'MEDIUM' ? 8 : 15;

    factors.push(`${waitingAhead} tokens ahead in mandi queue`);
    factors.push(`${features.equipmentAvailable} weighbridge counters operational`);
    if (features.disruptionCount > 0) {
      factors.push(`Active operational disruption reported`);
    }

    return {
      tokenId: queueItem.id,
      tokenCode: queueItem.tokenCode,
      queuePosition: waitingAhead + 1,
      estimatedWaitMinutes,
      estimatedWaitRangeMinutes: {
        min: Math.max(0, estimatedWaitMinutes - margin),
        max: estimatedWaitMinutes + margin
      },
      expectedServiceStartTime: new Date(serviceStartMs).toISOString(),
      expectedProcurementCompletionTime: new Date(completionMs).toISOString(),
      expectedPaymentInitiationTime: new Date(paymentMs).toISOString(),
      confidence,
      calculationMethod,
      contributingFactors: factors,
      timestamp: now.toISOString()
    };
  }
}

export const predictionService = new PredictionService();
