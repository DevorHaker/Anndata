import {
  WeightUnit,
  QualityRuleConfig,
  ProcurementRateConfig,
  QualityInspectionRecord,
  QualityParameterResult,
  QualityGrade,
  QualityStatus
} from '../types/procurement';

/**
 * Centralized Unit Conversion Utility
 */
export const UnitConverter = {
  toKg(quantity: number, unit: WeightUnit): number {
    switch (unit) {
      case 'QUINTAL':
        return quantity * 100;
      case 'TONNE':
        return quantity * 1000;
      case 'KG':
      default:
        return quantity;
    }
  },

  fromKg(kg: number, targetUnit: WeightUnit): number {
    switch (targetUnit) {
      case 'QUINTAL':
        return kg / 100;
      case 'TONNE':
        return kg / 1000;
      case 'KG':
      default:
        return kg;
    }
  }
};

/**
 * Precise Financial & Weight Decimal Calculator
 */
export const ProcurementMath = {
  roundCurrency(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  },

  roundWeight(kg: number): number {
    return Math.round((kg + Number.EPSILON) * 1000) / 1000;
  },

  calculateNetWeight(grossKg: number, tareKg: number): number {
    if (grossKg <= 0) throw new Error('Gross weight must be greater than zero');
    if (tareKg < 0) throw new Error('Tare weight cannot be negative');
    if (tareKg >= grossKg) throw new Error('Tare weight cannot be greater than or equal to gross weight');
    return this.roundWeight(grossKg - tareKg);
  },

  calculatePayableAmount(acceptedWeightKg: number, ratePerQuintal: number): number {
    if (acceptedWeightKg < 0) throw new Error('Accepted weight cannot be negative');
    if (ratePerQuintal <= 0) throw new Error('Rate per quintal must be positive');
    
    const ratePerKg = ratePerQuintal / 100;
    return this.roundCurrency(acceptedWeightKg * ratePerKg);
  }
};

/**
 * Commodity-Aware Quality Evaluation Engine
 */
export const QUALITY_RULE_CONFIGS: Record<string, QualityRuleConfig> = {
  'crop-001-wheat': {
    cropTypeId: 'crop-001-wheat',
    cropName: 'Wheat (KMS 2025-26)',
    ruleVersion: '2026-KMS-01',
    maxMoisturePercentage: 14.0,
    maxForeignMatterPercentage: 2.0,
    maxDamagedGrainsPercentage: 3.0,
    maxBrokenGrainsPercentage: 4.0,
    deductionThresholdMoisturePercentage: 12.0,
    deductionRatePerPercentAboveThreshold: 1.0 // 1% deduction per 1% moisture over 12%
  },
  'crop-002-paddy': {
    cropTypeId: 'crop-002-paddy',
    cropName: 'Paddy (Common)',
    ruleVersion: '2026-KMS-01',
    maxMoisturePercentage: 17.0,
    maxForeignMatterPercentage: 2.0,
    maxDamagedGrainsPercentage: 5.0,
    maxBrokenGrainsPercentage: 5.0,
    deductionThresholdMoisturePercentage: 14.0,
    deductionRatePerPercentAboveThreshold: 1.0
  },
  'crop-003-mustard': {
    cropTypeId: 'crop-003-mustard',
    cropName: 'Mustard Seed',
    ruleVersion: '2026-KMS-01',
    maxMoisturePercentage: 8.0,
    maxForeignMatterPercentage: 2.0,
    maxDamagedGrainsPercentage: 2.0,
    maxBrokenGrainsPercentage: 2.0,
    deductionThresholdMoisturePercentage: 6.0,
    deductionRatePerPercentAboveThreshold: 1.5
  }
};

/**
 * Official Procurement Rate Configuration (MSP Reference Engine)
 * Labeled clearly as DEVELOPMENT DATA per requirements!
 */
export const PROCUREMENT_RATES: Record<string, ProcurementRateConfig> = {
  'crop-001-wheat': {
    cropTypeId: 'crop-001-wheat',
    cropName: 'Wheat',
    grade: 'GRADE_A',
    ratePerQuintal: 2275.0, // ₹2,275 per quintal (₹22.75/kg)
    ratePerKg: 22.75,
    currency: 'INR',
    rateVersion: 'MSP-2025-26-WHEAT [DEVELOPMENT SEED DATA]',
    effectiveFrom: '2025-10-01T00:00:00Z',
    effectiveTo: '2026-09-30T23:59:59Z',
    isDevelopmentData: true
  },
  'crop-002-paddy': {
    cropTypeId: 'crop-002-paddy',
    cropName: 'Paddy',
    grade: 'GRADE_A',
    ratePerQuintal: 2300.0, // ₹2,300 per quintal (₹23.00/kg)
    ratePerKg: 23.0,
    currency: 'INR',
    rateVersion: 'MSP-2025-26-PADDY [DEVELOPMENT SEED DATA]',
    effectiveFrom: '2025-10-01T00:00:00Z',
    effectiveTo: '2026-09-30T23:59:59Z',
    isDevelopmentData: true
  },
  'crop-003-mustard': {
    cropTypeId: 'crop-003-mustard',
    cropName: 'Mustard Seed',
    grade: 'GRADE_A',
    ratePerQuintal: 5650.0, // ₹5,650 per quintal (₹56.50/kg)
    ratePerKg: 56.5,
    currency: 'INR',
    rateVersion: 'MSP-2025-26-MUSTARD [DEVELOPMENT SEED DATA]',
    effectiveFrom: '2025-10-01T00:00:00Z',
    effectiveTo: '2026-09-30T23:59:59Z',
    isDevelopmentData: true
  }
};

export class QualityEvaluationService {
  public static evaluateQuality(
    cropTypeId: string,
    observedMoisture: number,
    observedForeignMatter: number,
    observedDamagedGrains: number,
    observedBrokenGrains: number = 0,
    netWeightKg: number
  ): {
    status: QualityStatus;
    qualityGrade: QualityGrade;
    parameters: QualityParameterResult[];
    deductionPercentage: number;
    deductionKg: number;
    rejectionReason?: string;
  } {
    const config = QUALITY_RULE_CONFIGS[cropTypeId] || QUALITY_RULE_CONFIGS['crop-001-wheat'];

    const parameters: QualityParameterResult[] = [
      {
        parameterCode: 'MOISTURE',
        parameterName: 'Moisture Content',
        unit: '%',
        observedValue: observedMoisture,
        maxAcceptableThreshold: config.maxMoisturePercentage,
        passed: observedMoisture <= config.maxMoisturePercentage
      },
      {
        parameterCode: 'FOREIGN_MATTER',
        parameterName: 'Foreign Matter / Impurities',
        unit: '%',
        observedValue: observedForeignMatter,
        maxAcceptableThreshold: config.maxForeignMatterPercentage,
        passed: observedForeignMatter <= config.maxForeignMatterPercentage
      },
      {
        parameterCode: 'DAMAGED_GRAINS',
        parameterName: 'Damaged & Discolored Grains',
        unit: '%',
        observedValue: observedDamagedGrains,
        maxAcceptableThreshold: config.maxDamagedGrainsPercentage,
        passed: observedDamagedGrains <= config.maxDamagedGrainsPercentage
      }
    ];

    const failedParameters = parameters.filter((p) => !p.passed);

    if (failedParameters.length > 0) {
      const reasonStr = failedParameters
        .map((fp) => `${fp.parameterName} (${fp.observedValue}%) exceeds threshold of ${fp.maxAcceptableThreshold}%`)
        .join('; ');

      return {
        status: 'REJECTED',
        qualityGrade: 'REJECTED',
        parameters,
        deductionPercentage: 0,
        deductionKg: 0,
        rejectionReason: `QUALITY_REJECTED: ${reasonStr}`
      };
    }

    // Calculate quality weight deduction if moisture exceeds deduction threshold
    let deductionPercentage = 0;
    if (observedMoisture > config.deductionThresholdMoisturePercentage) {
      const excessMoisture = observedMoisture - config.deductionThresholdMoisturePercentage;
      deductionPercentage = excessMoisture * config.deductionRatePerPercentAboveThreshold;
    }

    const deductionKg = ProcurementMath.roundWeight((netWeightKg * deductionPercentage) / 100);
    const status: QualityStatus = deductionPercentage > 0 ? 'PASSED_WITH_DEDUCTION' : 'PASSED';
    const qualityGrade: QualityGrade = deductionPercentage > 0 ? 'GRADE_B' : 'GRADE_A';

    return {
      status,
      qualityGrade,
      parameters,
      deductionPercentage: Math.round(deductionPercentage * 100) / 100,
      deductionKg,
    };
  }
}
