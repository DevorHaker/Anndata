import { recommendationService } from './recommendation.service';
import { predictionService } from './prediction.service';
import { congestionService } from './congestion.service';
import { bottleneckService } from './bottleneck.service';
import { simulationService } from './simulation.service';
import { anomalyService } from './anomaly.service';
import { intelligenceRepository } from '../../repositories/intelligence.repository';
import { 
  CentreRecommendationResult, 
  SlotRecommendationResult, 
  ETAPredictionResult, 
  CentreIntelligenceStatus, 
  BottleneckAnalysis, 
  SimulationScenarioRequest, 
  SimulationResult,
  HumanOverrideRequest,
  IntelligenceDecisionRecord,
  ModelRegistryEntry
} from '../../types/intelligence';

export class IntelligenceService {
  /**
   * Get dynamic recommendations for centres with audit logging
   */
  async getCentreRecommendations(
    farmerId: string, 
    cropTypeId: string, 
    quantityKg: number,
    actor = 'SYSTEM'
  ): Promise<CentreRecommendationResult> {
    const res = await recommendationService.recommendCentres(farmerId, cropTypeId, quantityKg);

    const decision: IntelligenceDecisionRecord = {
      id: `dec-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      decisionType: 'CENTRE_RECOMMENDATION',
      farmerId,
      inputSnapshot: { farmerId, cropTypeId, quantityKg },
      outputData: res,
      modelEngine: 'STATISTICAL_ENGINE',
      modelVersion: res.scoringVersion,
      confidence: res.recommendedCentres[0]?.confidence || 'HIGH',
      explanation: res.explanation,
      actor,
      overrideStatus: 'NONE',
      createdTimestamp: new Date().toISOString()
    };

    await intelligenceRepository.recordDecision(decision);
    return res;
  }

  /**
   * Get dynamic slot recommendations for a centre
   */
  async getSlotRecommendations(
    centreId: string, 
    cropTypeId: string, 
    quantityKg: number
  ): Promise<SlotRecommendationResult> {
    return recommendationService.recommendSlots(centreId, cropTypeId, quantityKg);
  }

  /**
   * Get live ETA prediction for a digital queue token
   */
  async getTokenETA(tokenId: string, actor = 'SYSTEM'): Promise<ETAPredictionResult> {
    const res = await predictionService.predictTokenETA(tokenId);

    const decision: IntelligenceDecisionRecord = {
      id: `dec-eta-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      decisionType: 'ETA_PREDICTION',
      inputSnapshot: { tokenId },
      outputData: res,
      modelEngine: res.calculationMethod,
      modelVersion: '1.2.0',
      confidence: res.confidence,
      explanation: `Estimated wait: ${res.estimatedWaitMinutes} minutes. ${res.contributingFactors.join('; ')}`,
      actor,
      overrideStatus: 'NONE',
      createdTimestamp: new Date().toISOString()
    };

    await intelligenceRepository.recordDecision(decision);
    return res;
  }

  /**
   * Get real-time status and predictive congestion
   */
  async getCentreStatus(centreId: string): Promise<CentreIntelligenceStatus> {
    return congestionService.getCentreStatus(centreId);
  }

  /**
   * Get stage-level bottlenecks
   */
  async getBottlenecks(centreId: string): Promise<BottleneckAnalysis[]> {
    return bottleneckService.analyzeBottlenecks(centreId);
  }

  /**
   * Run what-if operational simulation
   */
  async runSimulation(req: SimulationScenarioRequest, actor = 'ADMIN'): Promise<SimulationResult> {
    const res = await simulationService.runSimulation(req);

    const decision: IntelligenceDecisionRecord = {
      id: `dec-sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      decisionType: 'SIMULATION_RUN',
      centreId: req.centreId,
      inputSnapshot: req,
      outputData: res,
      modelEngine: 'OPERATIONAL_FORMULA',
      modelVersion: '1.0.0',
      confidence: 'HIGH',
      explanation: `Scenario impact: ${res.impactSeverity}. Simulated wait shift from ${res.baselineWaitMinutes} to ${res.simulatedWaitMinutes} mins.`,
      actor,
      overrideStatus: 'NONE',
      createdTimestamp: new Date().toISOString()
    };

    await intelligenceRepository.recordDecision(decision);
    return res;
  }

  /**
   * Record human manager operational override
   */
  async recordHumanOverride(req: HumanOverrideRequest): Promise<IntelligenceDecisionRecord | null> {
    return intelligenceRepository.recordOverride(req.decisionId, req.reason, req.actorId);
  }

  /**
   * Get decision audit trail
   */
  async getDecisionById(decisionId: string): Promise<IntelligenceDecisionRecord | null> {
    return intelligenceRepository.getDecisionById(decisionId);
  }

  /**
   * Get model registry & drift metrics
   */
  async getModelRegistry(): Promise<ModelRegistryEntry[]> {
    return intelligenceRepository.getModelRegistry();
  }

  /**
   * Get cross-centre load balancing
   */
  async getLoadBalancing(centreId: string) {
    return congestionService.calculateLoadBalancing(centreId);
  }

  /**
   * Assess Missed-Slot Risk
   */
  async predictMissedSlotRisk(bookingId: string, farmerId: string) {
    return congestionService.predictMissedSlotRisk(bookingId, farmerId);
  }
}

export const intelligenceService = new IntelligenceService();
