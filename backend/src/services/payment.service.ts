import { paymentRepository } from '../repositories/payment.repository';
import { procurementRepository } from '../repositories/procurement.repository';
import { farmerDomainRepository } from '../repositories/farmerDomain.repository';
import { centreDomainRepository } from '../repositories/centreDomain.repository';
import { PaymentCalculationService } from './paymentCalc.service';
import { PaymentEligibilityService } from './paymentEligibility.service';
import { mockPaymentProvider } from './mockPaymentProvider';
import { realtimeHub } from '../utils/realtimeHub';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { PaymentEventRecord, PaymentRecord, PaymentStatus, ReconciliationRecord } from '../types/payment';

export class PaymentService {
  /**
   * Idempotently creates a new payment for a finalized procurement.
   */
  async createPaymentForProcurement(
    procurementId: string,
    idempotencyKey?: string,
    actorId: string = 'SYSTEM'
  ): Promise<PaymentRecord> {
    const procurement = await procurementRepository.findById(procurementId);
    if (!procurement) {
      throw new AppError('PROCUREMENT_NOT_FOUND', `Procurement '${procurementId}' does not exist.`, 404);
    }

    const key = idempotencyKey || `idemp-${procurementId}`;
    const existingPaymentByKey = await paymentRepository.findByIdempotencyKey(key);
    if (existingPaymentByKey) {
      logger.info(`[PAYMENT SERVICE] Idempotent request hit for key '${key}'. Returning existing payment '${existingPaymentByKey.id}'.`);
      return existingPaymentByKey;
    }

    const existingPaymentForProc = await paymentRepository.findByProcurementId(procurementId);
    const eligibility = PaymentEligibilityService.evaluateEligibility(procurement, existingPaymentForProc);

    if (!eligibility.eligible) {
      const primaryReason = eligibility.reasons[0];
      throw new AppError(
        primaryReason?.code || 'PAYMENT_NOT_ELIGIBLE',
        primaryReason?.message || 'Procurement is not eligible for payment creation.',
        400
      );
    }

    // Authoritative Server-side Payment Calculation
    const calc = PaymentCalculationService.calculatePaymentAmount(procurement);

    // Fetch Farmer & Centre metadata for rich display
    const farmer = await farmerDomainRepository.findFarmerById(procurement.farmerId);
    const centre = await centreDomainRepository.getCentreById(procurement.centreId);

    const farmerName = farmer ? `${farmer.firstName} ${farmer.lastName}` : 'Verified Farmer';
    const centreName = centre ? centre.name : 'APMC Procurement Hub';

    // Masked bank destination preview (Strict security requirement: No plain bank secrets)
    const destinationReference = (farmer as any)?.bankDetails?.accountNumber
      ? `XXXX XXXX ${(farmer as any).bankDetails.accountNumber.slice(-4)}`
      : 'XXXX XXXX 4521';

    const payment = await paymentRepository.createPayment({
      procurementId: procurement.id,
      procurementReferenceId: procurement.procurementReferenceId,
      farmerId: procurement.farmerId,
      farmerName,
      bookingId: procurement.bookingId,
      centreId: procurement.centreId,
      centreName,
      cropTypeId: procurement.cropTypeId,
      acceptedQuantityKg: calc.acceptedQuantityKg,
      ratePerQuintal: calc.ratePerQuintal,
      ratePerKg: calc.ratePerKg,
      rateVersion: calc.rateVersion,
      grossAmount: calc.grossAmount,
      deductionsAmount: calc.deductionsAmount,
      netPayableAmount: calc.netPayableAmount,
      destinationReference,
      bankName: (farmer as any)?.bankDetails?.bankName || 'State Bank of India',
      ifscCode: (farmer as any)?.bankDetails?.ifscCode || 'SBIN0001234',
      provider: mockPaymentProvider.providerName,
      idempotencyKey: key,
      status: 'PAYMENT_PENDING'
    });

    await paymentRepository.createEvent({
      paymentId: payment.id,
      eventType: 'PAYMENT_CREATED',
      newStatus: 'PAYMENT_PENDING',
      actorType: 'SYSTEM',
      actorId,
      reason: 'Payment record created upon procurement completion.'
    });

    realtimeHub.broadcastQueueEvent(procurement.centreId, 'PAYMENT_UPDATED', payment);
    realtimeHub.broadcastFarmerEvent(procurement.farmerId, 'PAYMENT_UPDATED', payment);

    return payment;
  }

  /**
   * Validates destination details and transitions payment from PAYMENT_PENDING to PAYMENT_VALIDATED.
   */
  async validatePayment(paymentId: string, actorId: string = 'SYSTEM'): Promise<PaymentRecord> {
    const payment = await paymentRepository.findWithLock(paymentId);
    if (!payment) {
      throw new AppError('PAYMENT_NOT_FOUND', `Payment record '${paymentId}' not found.`, 404);
    }

    if (payment.status !== 'PAYMENT_PENDING' && payment.status !== 'PAYMENT_RETRY') {
      throw new AppError('INVALID_STATE_TRANSITION', `Cannot validate payment in state '${payment.status}'.`, 400);
    }

    const validation = await mockPaymentProvider.validateDestination(payment.farmerId, payment.destinationReference);
    if (!validation.valid) {
      payment.status = 'PAYMENT_FAILED';
      payment.failureCode = 'INVALID_DESTINATION';
      payment.failureReason = validation.reason || 'Payment destination validation failed.';
      await paymentRepository.updatePayment(payment);

      await paymentRepository.createEvent({
        paymentId: payment.id,
        eventType: 'PAYMENT_VALIDATION_FAILED',
        previousStatus: 'PAYMENT_PENDING',
        newStatus: 'PAYMENT_FAILED',
        actorType: 'SYSTEM',
        actorId,
        reason: payment.failureReason
      });

      return payment;
    }

    const prevStatus = payment.status;
    payment.status = 'PAYMENT_VALIDATED';
    await paymentRepository.updatePayment(payment);

    await paymentRepository.createEvent({
      paymentId: payment.id,
      eventType: 'PAYMENT_VALIDATED',
      previousStatus: prevStatus,
      newStatus: 'PAYMENT_VALIDATED',
      actorType: 'SYSTEM',
      actorId,
      reason: 'Destination account and financial eligibility verified.'
    });

    return payment;
  }

  /**
   * Processes disbursement via provider adapter.
   */
  async processPayment(paymentId: string, actorId: string = 'SYSTEM'): Promise<PaymentRecord> {
    let payment = await paymentRepository.findWithLock(paymentId);
    if (!payment) {
      throw new AppError('PAYMENT_NOT_FOUND', `Payment record '${paymentId}' not found.`, 404);
    }

    if (payment.status === 'PAYMENT_PENDING') {
      payment = await this.validatePayment(paymentId, actorId);
    }

    if (payment.status !== 'PAYMENT_VALIDATED' && payment.status !== 'PAYMENT_QUEUED' && payment.status !== 'PAYMENT_RETRY') {
      throw new AppError('INVALID_STATE_TRANSITION', `Cannot process payment in state '${payment.status}'.`, 400);
    }

    const prevStatus = payment.status;
    payment.status = 'PAYMENT_PROCESSING';
    payment.processingTimestamp = new Date().toISOString();
    await paymentRepository.updatePayment(payment);

    await paymentRepository.createEvent({
      paymentId: payment.id,
      eventType: 'PAYMENT_PROCESSING',
      previousStatus: prevStatus,
      newStatus: 'PAYMENT_PROCESSING',
      actorType: 'SYSTEM',
      actorId,
      reason: 'Submitted payment payload to DBT gateway adapter.'
    });

    // Execute provider submission
    const result = await mockPaymentProvider.submitPayment(payment);

    if (result.success && result.status === 'PAYMENT_SUCCESS') {
      payment.status = 'PAYMENT_SUCCESS';
      payment.providerTransactionRef = result.providerTransactionRef;
      payment.completedTimestamp = new Date().toISOString();
      payment.failureReason = undefined;
    } else if (result.status === 'PAYMENT_PROCESSING') {
      payment.status = 'PAYMENT_PROCESSING';
      payment.providerTransactionRef = result.providerTransactionRef;
    } else {
      payment.status = result.status === 'PAYMENT_RETRY' ? 'PAYMENT_RETRY' : 'PAYMENT_FAILED';
      payment.failureCode = result.failureCode || 'PAYMENT_DISBURSEMENT_FAILED';
      payment.failureReason = result.failureReason || 'Provider failed to execute disbursement.';
    }

    await paymentRepository.updatePayment(payment);

    await paymentRepository.createEvent({
      paymentId: payment.id,
      eventType: payment.status,
      previousStatus: 'PAYMENT_PROCESSING',
      newStatus: payment.status,
      actorType: 'WEBHOOK_PROVIDER',
      actorId: mockPaymentProvider.providerName,
      providerReference: result.providerTransactionRef,
      providerPayload: result.rawPayload,
      reason: result.failureReason || 'Disbursement completed successfully.'
    });

    realtimeHub.broadcastQueueEvent(payment.centreId, 'PAYMENT_COMPLETED', payment);
    realtimeHub.broadcastFarmerEvent(payment.farmerId, 'PAYMENT_COMPLETED', payment);

    return payment;
  }

  /**
   * Safely retries a failed or timed-out payment.
   */
  async retryPayment(paymentId: string, actorId: string = 'STAFF'): Promise<PaymentRecord> {
    const payment = await paymentRepository.findWithLock(paymentId);
    if (!payment) {
      throw new AppError('PAYMENT_NOT_FOUND', `Payment record '${paymentId}' not found.`, 404);
    }

    if (payment.status !== 'PAYMENT_FAILED' && payment.status !== 'PAYMENT_RETRY') {
      throw new AppError('INVALID_RETRY', `Payment in state '${payment.status}' cannot be retried. Only FAILED or RETRY state allowed.`, 400);
    }

    if (payment.retryCount >= payment.maxRetries) {
      throw new AppError('MAX_RETRIES_EXCEEDED', `Maximum retry limit (${payment.maxRetries}) reached for payment '${payment.paymentReferenceId}'. Requires administrative review.`, 400);
    }

    payment.retryCount += 1;
    payment.status = 'PAYMENT_RETRY';
    await paymentRepository.updatePayment(payment);

    await paymentRepository.createEvent({
      paymentId: payment.id,
      eventType: 'PAYMENT_RETRY_INITIATED',
      previousStatus: 'PAYMENT_FAILED',
      newStatus: 'PAYMENT_RETRY',
      actorType: 'STAFF',
      actorId,
      reason: `Manual retry attempt #${payment.retryCount} initiated.`
    });

    return await this.processPayment(payment.id, actorId);
  }

  /**
   * Cancels a pending payment.
   */
  async cancelPayment(paymentId: string, reason: string, actorId: string = 'ADMIN'): Promise<PaymentRecord> {
    const payment = await paymentRepository.findWithLock(paymentId);
    if (!payment) {
      throw new AppError('PAYMENT_NOT_FOUND', `Payment record '${paymentId}' not found.`, 404);
    }

    if (payment.status === 'PAYMENT_SUCCESS') {
      throw new AppError('CANNOT_CANCEL_COMPLETED', 'Completed payment cannot be cancelled. Use reversePayment instead.', 400);
    }

    const prevStatus = payment.status;
    payment.status = 'PAYMENT_CANCELLED';
    payment.failureReason = reason;
    await paymentRepository.updatePayment(payment);

    await paymentRepository.createEvent({
      paymentId: payment.id,
      eventType: 'PAYMENT_CANCELLED',
      previousStatus: prevStatus,
      newStatus: 'PAYMENT_CANCELLED',
      actorType: 'ADMIN',
      actorId,
      reason
    });

    return payment;
  }

  /**
   * Reverses a successful payment (Admin only).
   */
  async reversePayment(paymentId: string, reason: string, actorId: string = 'ADMIN'): Promise<PaymentRecord> {
    const payment = await paymentRepository.findWithLock(paymentId);
    if (!payment) {
      throw new AppError('PAYMENT_NOT_FOUND', `Payment record '${paymentId}' not found.`, 404);
    }

    if (payment.status !== 'PAYMENT_SUCCESS') {
      throw new AppError('CANNOT_REVERSE', `Payment in state '${payment.status}' cannot be reversed.`, 400);
    }

    const reversalResult = await mockPaymentProvider.reversePayment(payment, reason);

    payment.status = 'PAYMENT_REVERSED';
    payment.failureReason = reason;
    await paymentRepository.updatePayment(payment);

    await paymentRepository.createEvent({
      paymentId: payment.id,
      eventType: 'PAYMENT_REVERSED',
      previousStatus: 'PAYMENT_SUCCESS',
      newStatus: 'PAYMENT_REVERSED',
      actorType: 'ADMIN',
      actorId,
      providerReference: reversalResult.providerTransactionRef,
      reason
    });

    return payment;
  }

  /**
   * Processes asynchronous provider webhook callbacks safely and idempotently.
   */
  async handleWebhookCallback(payload: {
    paymentReferenceId: string;
    providerTransactionRef: string;
    status: PaymentStatus;
    failureReason?: string;
    signature?: string;
  }): Promise<PaymentRecord> {
    logger.info(`[PAYMENT WEBHOOK] Processing provider callback for ${payload.paymentReferenceId}`);

    const res = await paymentRepository.listPayments({ search: payload.paymentReferenceId, limit: 1 });
    const payment = res.payments[0];

    if (!payment) {
      throw new AppError('PAYMENT_NOT_FOUND', `Payment for reference '${payload.paymentReferenceId}' not found.`, 404);
    }

    if (payment.status === 'PAYMENT_SUCCESS' || payment.status === 'PAYMENT_REVERSED') {
      logger.info(`[PAYMENT WEBHOOK] Idempotent ignore: Payment ${payment.paymentReferenceId} already terminal state '${payment.status}'.`);
      return payment;
    }

    const prevStatus = payment.status;
    payment.status = payload.status;
    payment.providerTransactionRef = payload.providerTransactionRef || payment.providerTransactionRef;
    if (payload.status === 'PAYMENT_SUCCESS') {
      payment.completedTimestamp = new Date().toISOString();
    } else if (payload.status === 'PAYMENT_FAILED') {
      payment.failureReason = payload.failureReason || 'Webhook reported disbursement failure';
    }

    await paymentRepository.updatePayment(payment);

    await paymentRepository.createEvent({
      paymentId: payment.id,
      eventType: payload.status,
      previousStatus: prevStatus,
      newStatus: payload.status,
      actorType: 'WEBHOOK_PROVIDER',
      providerReference: payload.providerTransactionRef,
      providerPayload: payload,
      reason: payload.failureReason || 'Webhook callback status sync'
    });

    return payment;
  }

  /**
   * Handles Phase 9 procurement correction impact on payment.
   */
  async handleProcurementCorrectionImpact(
    procurementId: string,
    newAcceptedWeightKg: number,
    newDeductionsAmount: number,
    actorId: string = 'STAFF'
  ): Promise<{ payment: PaymentRecord | null; adjustmentRecord?: ReconciliationRecord }> {
    const payment = await paymentRepository.findByProcurementId(procurementId);
    if (!payment) {
      return { payment: null };
    }

    if (payment.status === 'PAYMENT_PENDING' || payment.status === 'PAYMENT_VALIDATED') {
      // Recalculate pending payment
      payment.acceptedQuantityKg = newAcceptedWeightKg;
      payment.grossAmount = Math.round(((newAcceptedWeightKg * payment.ratePerQuintal) / 100) * 100) / 100;
      payment.deductionsAmount = newDeductionsAmount;
      payment.netPayableAmount = Math.max(0, Math.round((payment.grossAmount - newDeductionsAmount) * 100) / 100);

      await paymentRepository.updatePayment(payment);

      await paymentRepository.createEvent({
        paymentId: payment.id,
        eventType: 'PAYMENT_AMOUNT_ADJUSTED',
        previousStatus: payment.status,
        newStatus: payment.status,
        actorType: 'STAFF',
        actorId,
        reason: `Procurement correction: Quantity adjusted to ${newAcceptedWeightKg} KG.`
      });

      return { payment };
    }

    if (payment.status === 'PAYMENT_SUCCESS') {
      // Create immutable audit reconciliation adjustment record
      const expectedAmount = Math.round(((newAcceptedWeightKg * payment.ratePerQuintal) / 100) * 100) / 100 - newDeductionsAmount;
      const adjustmentRecord = await paymentRepository.createReconciliationRecord({
        paymentId: payment.id,
        internalReference: payment.paymentReferenceId,
        providerReference: payment.providerTransactionRef,
        expectedAmount,
        processedAmount: payment.netPayableAmount,
        internalStatus: payment.status,
        providerStatus: 'SETTLED',
        reconciliationState: 'MISMATCH',
        notes: `Procurement corrected post-payment. Net difference: ₹${expectedAmount - payment.netPayableAmount}`
      });

      await paymentRepository.createEvent({
        paymentId: payment.id,
        eventType: 'POST_PAYMENT_CORRECTION_LOGGED',
        previousStatus: 'PAYMENT_SUCCESS',
        newStatus: 'PAYMENT_SUCCESS',
        actorType: 'STAFF',
        actorId,
        reason: `Post-disbursement correction flagged. Expected ₹${expectedAmount}, Disbursed ₹${payment.netPayableAmount}.`
      });

      return { payment, adjustmentRecord };
    }

    return { payment };
  }

  async getPaymentById(paymentId: string): Promise<{ payment: PaymentRecord; events: PaymentEventRecord[] }> {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new AppError('PAYMENT_NOT_FOUND', `Payment record '${paymentId}' not found.`, 404);
    }
    const events = await paymentRepository.listEventsForPayment(paymentId);
    return { payment, events };
  }

  async getPaymentByProcurementId(procurementId: string): Promise<PaymentRecord | null> {
    return await paymentRepository.findByProcurementId(procurementId);
  }

  async listPayments(filters: {
    centreId?: string;
    farmerId?: string;
    status?: PaymentStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    return await paymentRepository.listPayments(filters);
  }

  async listReconciliations() {
    return await paymentRepository.listReconciliations();
  }
}

export const paymentService = new PaymentService();
