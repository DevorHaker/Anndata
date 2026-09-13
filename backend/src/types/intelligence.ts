/**
 * Phase 11 — Real-Time Intelligence, Prediction & Decision Engine Types
 * SmartProcure (SIH26032)
 */

export type CentreCongestionState = 
  | 'NORMAL' 
  | 'BUSY' 
  | 'CONGESTED' 
  | 'CRITICAL' 
  | 'CLOSED' 
  | 'PARTIAL' 
  | 'EMERGENCY';

export type IntelligenceConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type CalculationEngineType = 
  | 'ML_MODEL' 
  | 'STATISTICAL_ENGINE' 
  | 'OPERATIONAL_FORMULA' 
  | 'RULE_BASED_FALLBACK';

export type OperationalStage = 
  | 'CHECK-IN' 
  | 'QUEUE' 
  | 'WEIGHING' 
  | 'QUALITY' 
  | 'PROCUREMENT' 
  | 'PAYMENT';

export interface IntelligenceFeatureVector {
  centreId: string;
  timestamp: string;
  queueLength: number;
  activeTokens: number;
  completedTokensLastHour: number;
  averageServiceTimeMs: number;
  medianServiceTimeMs: number;
  p95ServiceTimeMs: number;
  currentCentreUtilizationPct: number;
  slotUtilizationPct: number;
  remainingCapacityKg: number;
  staffAvailable: number;
  equipmentAvailable: number;
  declaredQuantityKg?: number;
  cropTypeId?: string;
  centreState: CentreCongestionState;
  disruptionCount: number;
  recentFailureRate: number;
  dataFreshnessAgeSec: number;
}

export interface CentreIntelligenceStatus {
  centreId: string;
  centreName: string;
  state: CentreCongestionState;
  currentQueueLength: number;
  currentWaitMinutes: number;
  predictedWait30Min: number;
  predictedWait60Min: number;
  capacityUtilizationPct: number;
  bottleneckStage: OperationalStage;
  confidence: IntelligenceConfidence;
  reasons: string[];
  lastUpdatedTimestamp: string;
}

export interface BottleneckAnalysis {
  stage: OperationalStage;
  averageDurationSec: number;
  p95DurationSec: number;
  baselineDurationSec: number;
  percentageIncrease: number;
  isCurrentBottleneck: boolean;
  primaryContributor: string;
  secondaryContributor?: string;
  confidence: IntelligenceConfidence;
}

export interface CentreRecommendationOption {
  centreId: string;
  centreName: string;
  overallScore: number;
  estimatedWaitMinutes: number;
  distanceKm: number;
  capacityUtilizationPct: number;
  state: CentreCongestionState;
  confidence: IntelligenceConfidence;
  pros: string[];
  cons: string[];
  suggestedSlotWindow: string;
}

export interface CentreRecommendationResult {
  farmerId: string;
  cropTypeId: string;
  quantityKg: number;
  scoringVersion: string;
  weightsUsed: {
    waitingTime: number;
    distance: number;
    capacity: number;
    utilization: number;
    reliability: number;
  };
  recommendedCentres: CentreRecommendationOption[];
  explanation: string;
  timestamp: string;
}

export interface SlotRecommendationOption {
  slotId: string;
  timeWindow: string;
  capacityUtilizationPct: number;
  estimatedWaitMinutes: number;
  expectedServiceStart: string;
  expectedCompletion: string;
  confidence: IntelligenceConfidence;
  pros: string[];
  cons: string[];
}

export interface SlotRecommendationResult {
  centreId: string;
  cropTypeId: string;
  quantityKg: number;
  recommendedSlots: SlotRecommendationOption[];
  explanation: string;
  timestamp: string;
}

export interface ETAPredictionResult {
  tokenId: string;
  tokenCode: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  estimatedWaitRangeMinutes: { min: number; max: number };
  expectedServiceStartTime: string;
  expectedProcurementCompletionTime: string;
  expectedPaymentInitiationTime: string;
  confidence: IntelligenceConfidence;
  calculationMethod: CalculationEngineType;
  contributingFactors: string[];
  timestamp: string;
}

export interface MissedSlotRiskResult {
  bookingId: string;
  farmerId: string;
  scheduledTime: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  riskFactors: string[];
  recommendedAction: string;
  recoveryOptions: {
    centreId: string;
    centreName: string;
    slotTime: string;
    estimatedWaitMinutes: number;
  }[];
  timestamp: string;
}

export interface SimulationScenarioRequest {
  centreId: string;
  additionalArrivals: number;
  staffDelta: number;
  equipmentDelta: number;
  redistributedBookingsCount: number;
  timeWindowHours: number;
}

export interface SimulationResult {
  scenarioId: string;
  centreId: string;
  baselineWaitMinutes: number;
  simulatedWaitMinutes: number;
  baselineQueueLength: number;
  simulatedQueueLength: number;
  baselineUtilizationPct: number;
  simulatedUtilizationPct: number;
  predictedBottleneck: OperationalStage;
  impactSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedMitigations: string[];
  executionTimeMs: number;
  timestamp: string;
}

export interface OperationalAnomalyEvent {
  id: string;
  centreId: string;
  anomalyType: 'SERVICE_TIME_SPIKE' | 'QUEUE_GROWTH_SURGE' | 'REJECTION_SURGE' | 'WEIGHMENT_CORRECTION_SPIKE' | 'PAYMENT_FAILURE_SPIKE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedMetricValue: number;
  baselineMetricValue: number;
  detectedTimestamp: string;
  status: 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';
}

export interface ModelRegistryEntry {
  modelId: string;
  modelName: string;
  modelType: 'STATISTICAL' | 'GRADIENT_BOOSTED_TREE' | 'RULE_ENGINE';
  version: string;
  featureVersion: string;
  maeMinutes: number;
  rmseMinutes: number;
  p95ErrorMinutes: number;
  trainingTimestamp: string;
  status: 'ACTIVE' | 'DEGRADED' | 'STAGING';
  createdTimestamp: string;
}

export interface IntelligenceDecisionRecord {
  id: string;
  decisionType: 'CENTRE_RECOMMENDATION' | 'SLOT_RECOMMENDATION' | 'ETA_PREDICTION' | 'CONGESTION_ALERT' | 'LOAD_BALANCING_SUGGESTION' | 'SIMULATION_RUN';
  centreId?: string;
  farmerId?: string;
  inputSnapshot: Record<string, any>;
  outputData: Record<string, any>;
  modelEngine: CalculationEngineType;
  modelVersion: string;
  confidence: IntelligenceConfidence;
  explanation: string;
  actor: string;
  overrideStatus: 'NONE' | 'OVERRIDDEN';
  overrideReason?: string;
  overrideActor?: string;
  createdTimestamp: string;
}

export interface HumanOverrideRequest {
  decisionId: string;
  reason: string;
  actorId: string;
  actorRole: string;
  newAction: string;
}
