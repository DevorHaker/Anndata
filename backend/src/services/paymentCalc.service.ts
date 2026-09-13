import { ProcurementRecord } from '../types/procurement';
import { PROCUREMENT_RATES } from '../utils/procurementCalc';

export interface PaymentCalculationResult {
  acceptedQuantityKg: number;
  acceptedQuintals: number;
  ratePerQuintal: number;
  ratePerKg: number;
  rateVersion: string;
  grossAmount: number;
  deductionsAmount: number;
  netPayableAmount: number;
}

export class PaymentCalculationService {
  /**
   * Performs authoritative server-side decimal financial calculations for a procurement.
   * Preserves exact historical rate snapshot from the procurement record or rate config.
   */
  static calculatePaymentAmount(
    procurement: ProcurementRecord,
    customDeductionOverride?: number
  ): PaymentCalculationResult {
    const acceptedQuantityKg = procurement.finalAcceptedWeightKg || 0;
    
    // Convert KG to Quintals (1 Quintal = 100 KG)
    const acceptedQuintals = Math.round((acceptedQuantityKg / 100) * 100) / 100;

    // Use preserved rate on procurement or resolve from authoritative MSP table
    let ratePerQuintal = procurement.ratePerQuintal;
    let ratePerKg = procurement.ratePerKg;
    let rateVersion = procurement.rateVersion || '2026-MSP-01';

    if (!ratePerQuintal || ratePerQuintal <= 0) {
      const rateConfig = PROCUREMENT_RATES[procurement.cropTypeId] || PROCUREMENT_RATES['crop-001-wheat'];
      ratePerQuintal = rateConfig.ratePerQuintal;
      ratePerKg = rateConfig.ratePerKg;
      rateVersion = rateConfig.rateVersion;
    }

    // Authoritative gross amount: Accepted Quintals * Rate Per Quintal
    const rawGross = (acceptedQuantityKg * ratePerQuintal) / 100;
    const grossAmount = Math.round(rawGross * 100) / 100;

    const deductionsAmount = customDeductionOverride !== undefined
      ? Math.round(customDeductionOverride * 100) / 100
      : (procurement.totalDeductionsAmount || 0);

    const netPayableAmount = Math.max(0, Math.round((grossAmount - deductionsAmount) * 100) / 100);

    return {
      acceptedQuantityKg,
      acceptedQuintals,
      ratePerQuintal,
      ratePerKg,
      rateVersion,
      grossAmount,
      deductionsAmount,
      netPayableAmount
    };
  }
}
