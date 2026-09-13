export type ProcurementStatus =
  | 'INITIATED'
  | 'RECEIVED'
  | 'WEIGHING'
  | 'QUALITY_CHECK'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'PARTIALLY_ACCEPTED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type WeighmentStatus = 'PENDING' | 'VERIFIED' | 'CORRECTED' | 'REJECTED';

export type QualityGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECTED';

export type QualityStatus = 'PASSED' | 'PASSED_WITH_DEDUCTION' | 'REJECTED';

export type WeightUnit = 'KG' | 'QUINTAL' | 'TONNE';

export interface ProcurementRecord {
  id: string;
  procurementReferenceId: string; // e.g. 'PR-2026-00012984'
  bookingId: string;
  farmerId: string;
  centreId: string;
  cropTypeId: string;
  cropTypeName?: string;
  tokenCode?: string;
  queueEntryId?: string;
  procurementOfficerId: string;
  status: ProcurementStatus;
  
  // Quantities
  declaredQuantityKg: number;
  measuredGrossWeightKg?: number;
  measuredTareWeightKg?: number;
  measuredNetWeightKg?: number;
  qualityDeductionKg: number;
  finalAcceptedWeightKg: number;
  rejectedWeightKg: number;
  rejectionReasonCode?: string | null;
  rejectionReasonDetails?: string | null;

  // Weighment reference
  weighmentId?: string;

  // Quality reference
  qualityInspectionId?: string;
  qualityGrade?: QualityGrade;
  qualityStatus?: QualityStatus;
  qualityRuleVersion?: string;

  // Financial Rate & Payable Calculations
  ratePerKg: number;
  ratePerQuintal: number;
  rateVersion: string;
  grossPayableAmount: number;
  totalDeductionsAmount: number;
  netPayableAmount: number;

  // Audit timestamps & version
  startedAt: string;
  weighedAt?: string;
  qualityInspectedAt?: string;
  completedAt?: string;
  paymentReady: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeighmentRecord {
  id: string;
  procurementId: string;
  bookingId: string;
  centreId: string;
  equipmentId: string;
  equipmentName?: string;
  weighbridgeOperatorId: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  unit: WeightUnit;
  status: WeighmentStatus;
  version: number;
  weighedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeighmentCorrectionRecord {
  id: string;
  weighmentRecordId: string;
  procurementId: string;
  originalGrossWeightKg: number;
  originalTareWeightKg: number;
  correctedGrossWeightKg: number;
  correctedTareWeightKg: number;
  correctionReason: string;
  authorizedBy: string;
  createdAt: string;
}

export interface QualityParameterResult {
  parameterCode: string; // e.g. 'MOISTURE', 'FOREIGN_MATTER', 'DAMAGED_GRAINS'
  parameterName: string;
  unit: string; // e.g. '%'
  observedValue: number;
  maxAcceptableThreshold: number;
  passed: boolean;
  notes?: string;
}

export interface QualityInspectionRecord {
  id: string;
  procurementId: string;
  bookingId: string;
  inspectorId: string;
  cropTypeId: string;
  ruleVersion: string; // e.g. '2026-KMS-01'
  moisturePercentage: number;
  foreignMatterPercentage: number;
  damagedGrainsPercentage: number;
  brokenGrainsPercentage: number;
  impuritiesPercentage: number;
  parameters: QualityParameterResult[];
  qualityGrade: QualityGrade;
  status: QualityStatus;
  deductionPercentage: number;
  deductionKg: number;
  rejectionReason?: string | null;
  overridden: boolean;
  overrideReason?: string | null;
  overriddenBy?: string | null;
  inspectedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityRuleConfig {
  cropTypeId: string;
  cropName: string;
  ruleVersion: string;
  maxMoisturePercentage: number;
  maxForeignMatterPercentage: number;
  maxDamagedGrainsPercentage: number;
  maxBrokenGrainsPercentage: number;
  deductionThresholdMoisturePercentage: number;
  deductionRatePerPercentAboveThreshold: number; // e.g. 1% deduction per 1% moisture over 12%
}

export interface ProcurementRateConfig {
  cropTypeId: string;
  cropName: string;
  grade: QualityGrade;
  ratePerQuintal: number;
  ratePerKg: number;
  currency: string;
  rateVersion: string;
  effectiveFrom: string;
  effectiveTo: string;
  isDevelopmentData: boolean; // Clearly labeled as development seed data per requirements!
}
