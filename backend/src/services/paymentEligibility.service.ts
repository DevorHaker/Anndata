import { ProcurementRecord } from '../types/procurement';
import { EligibilityResult, PaymentRecord } from '../types/payment';

export class PaymentEligibilityService {
  /**
   * Evaluates strict backend payment eligibility rules for a procurement record.
   */
  static evaluateEligibility(
    procurement: ProcurementRecord | null,
    existingPayment: PaymentRecord | null
  ): EligibilityResult {
    const reasons: Array<{ code: string; message: string }> = [];
    const warnings: string[] = [];

    if (!procurement) {
      return {
        eligible: false,
        reasons: [{ code: 'PROCUREMENT_NOT_FOUND', message: 'Associated procurement record does not exist.' }],
        warnings: []
      };
    }

    // 1. Procurement Status Check
    if (procurement.status !== 'COMPLETED') {
      reasons.push({
        code: 'PROCUREMENT_NOT_COMPLETED',
        message: `Procurement session is currently in state '${procurement.status}'. Payment requires COMPLETED state.`
      });
    }

    // 2. Accepted Quantity Check
    if (!procurement.finalAcceptedWeightKg || procurement.finalAcceptedWeightKg <= 0) {
      reasons.push({
        code: 'INVALID_ACCEPTED_QUANTITY',
        message: `Final accepted produce quantity (${procurement.finalAcceptedWeightKg || 0} KG) must be greater than 0.`
      });
    }

    // 3. Rejected Procurement Check
    if (procurement.status === 'REJECTED') {
      reasons.push({
        code: 'PROCUREMENT_REJECTED',
        message: 'Procurement was rejected due to quality or administrative policy violation.'
      });
    }

    // 4. Duplicate Payment Check
    if (existingPayment) {
      if (existingPayment.status === 'PAYMENT_SUCCESS' || existingPayment.status === 'PAYMENT_PROCESSING' || existingPayment.status === 'PAYMENT_VALIDATED') {
        reasons.push({
          code: 'DUPLICATE_PAYMENT_EXISTS',
          message: `An active or completed payment record ('${existingPayment.paymentReferenceId}' in state '${existingPayment.status}') already exists for this procurement.`
        });
      } else if (existingPayment.status === 'PAYMENT_CANCELLED' || existingPayment.status === 'PAYMENT_FAILED') {
        warnings.push(`A previous payment record '${existingPayment.paymentReferenceId}' was ${existingPayment.status}. Re-issuance permitted.`);
      }
    }

    // 5. Positive Payable Amount Check
    if (procurement.netPayableAmount < 0) {
      reasons.push({
        code: 'INVALID_PAYABLE_AMOUNT',
        message: 'Calculated net payable amount cannot be negative.'
      });
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      warnings
    };
  }
}
