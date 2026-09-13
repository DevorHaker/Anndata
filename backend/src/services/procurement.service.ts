import { procurementRepository } from '../repositories/procurement.repository';
import { weighmentRepository } from '../repositories/weighment.repository';
import { qualityRepository } from '../repositories/quality.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { queueRepository } from '../repositories/queue.repository';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { realtimeHub } from '../utils/realtimeHub';
import {
  ProcurementRecord,
  WeighmentRecord,
  QualityInspectionRecord,
  WeightUnit
} from '../types/procurement';
import {
  ProcurementMath,
  QualityEvaluationService,
  PROCUREMENT_RATES,
  UnitConverter
} from '../utils/procurementCalc';

export class ProcurementService {
  /**
   * 1. Start Procurement Session from Queue
   */
  async startSession(params: {
    bookingId: string;
    officerId: string;
    officerCentreId: string;
  }): Promise<ProcurementRecord> {
    // Check if procurement already exists for this booking
    const existing = await procurementRepository.findByBookingId(params.bookingId);
    if (existing) {
      if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
        throw new AppError(
          'PROCUREMENT_ALREADY_FINALIZED',
          `Procurement session for booking '${params.bookingId}' is already ${existing.status}.`,
          409
        );
      }
      return existing; // Idempotent return of active session
    }

    // Verify booking
    const booking = await bookingRepository.findBookingById(params.bookingId);
    if (!booking) {
      throw new AppError('BOOKING_NOT_FOUND', `Booking '${params.bookingId}' not found.`, 404);
    }

    if (booking.centreId !== params.officerCentreId) {
      throw new AppError(
        'SCOPE_ACCESS_DENIED',
        `Procurement officer is assigned to centre '${params.officerCentreId}' but booking is at centre '${booking.centreId}'.`,
        403
      );
    }

    // Check queue entry
    const queueEntry = await queueRepository.findQueueEntryByBookingId(params.bookingId);

    const record = await procurementRepository.createProcurement({
      bookingId: booking.id,
      farmerId: booking.farmerId,
      centreId: booking.centreId,
      cropTypeId: booking.cropTypeId,
      tokenCode: queueEntry?.tokenCode,
      queueEntryId: queueEntry?.id,
      procurementOfficerId: params.officerId,
      declaredQuantityKg: booking.declaredWeightKg
    });

    // Update queue entry state to PROCESSING if present
    if (queueEntry) {
      await queueRepository.atomicServeToken(queueEntry.id, 'COUNTER_1', params.officerId);
    }

    realtimeHub.broadcastQueueEvent(record.centreId, 'PROCUREMENT_STARTED', {
      procurementId: record.id,
      bookingId: record.bookingId,
      centreId: record.centreId
    });

    logger.info(`Started procurement session '${record.procurementReferenceId}' for booking '${booking.id}'`);
    return record;
  }

  /**
   * 2. Confirm Produce Receipt Intake
   */
  async confirmIntake(procurementId: string, officerCentreId: string): Promise<ProcurementRecord> {
    const record = await procurementRepository.findWithLock(procurementId);
    if (!record) {
      throw new AppError('PROCUREMENT_NOT_FOUND', `Procurement session '${procurementId}' not found.`, 404);
    }

    if (record.centreId !== officerCentreId) {
      throw new AppError('SCOPE_ACCESS_DENIED', 'Cannot process procurement for unassigned centre.', 403);
    }

    if (record.status !== 'INITIATED') {
      throw new AppError('INVALID_STATE_TRANSITION', `Cannot record intake for state '${record.status}'.`, 409);
    }

    record.status = 'RECEIVED';
    return await procurementRepository.updateProcurement(record);
  }

  /**
   * 3. Record Official Weighment
   */
  async recordWeighment(params: {
    procurementId: string;
    equipmentId: string;
    operatorId: string;
    officerCentreId: string;
    grossWeight: number;
    tareWeight: number;
    unit?: WeightUnit;
  }): Promise<{ procurement: ProcurementRecord; weighment: WeighmentRecord }> {
    const record = await procurementRepository.findWithLock(params.procurementId);
    if (!record) {
      throw new AppError('PROCUREMENT_NOT_FOUND', `Procurement session '${params.procurementId}' not found.`, 404);
    }

    if (record.centreId !== params.officerCentreId) {
      throw new AppError('SCOPE_ACCESS_DENIED', 'Cannot process weighment for unassigned centre.', 403);
    }

    if (record.status !== 'RECEIVED' && record.status !== 'WEIGHING') {
      throw new AppError(
        'INVALID_STATE_TRANSITION',
        `Weighment can only be recorded after produce intake (current state: '${record.status}').`,
        409
      );
    }

    const unit = params.unit || 'KG';
    const grossKg = UnitConverter.toKg(params.grossWeight, unit);
    const tareKg = UnitConverter.toKg(params.tareWeight, unit);

    // Calculate net weight using authoritative calculator
    const netKg = ProcurementMath.calculateNetWeight(grossKg, tareKg);

    // Persist weighment in repository (validates equipment status internally!)
    const weighment = await weighmentRepository.createWeighment({
      procurementId: record.id,
      bookingId: record.bookingId,
      centreId: record.centreId,
      equipmentId: params.equipmentId,
      weighbridgeOperatorId: params.operatorId,
      grossWeightKg: grossKg,
      tareWeightKg: tareKg,
      netWeightKg: netKg,
      unit: 'KG'
    });

    // Update procurement record
    record.weighmentId = weighment.id;
    record.measuredGrossWeightKg = grossKg;
    record.measuredTareWeightKg = tareKg;
    record.measuredNetWeightKg = netKg;
    record.weighedAt = new Date().toISOString();
    record.status = 'WEIGHING';

    const updatedProcurement = await procurementRepository.updateProcurement(record);

    realtimeHub.broadcastQueueEvent(record.centreId, 'WEIGHMENT_RECORDED', {
      procurementId: record.id,
      netWeightKg: netKg
    });

    return { procurement: updatedProcurement, weighment };
  }

  /**
   * 4. Correct Weighment Audit Log
   */
  async correctWeighment(params: {
    weighmentId: string;
    correctedGrossWeight: number;
    correctedTareWeight: number;
    reason: string;
    authorizedBy: string;
    officerCentreId: string;
    unit?: WeightUnit;
  }): Promise<{ procurement: ProcurementRecord; weighment: WeighmentRecord }> {
    const unit = params.unit || 'KG';
    const grossKg = UnitConverter.toKg(params.correctedGrossWeight, unit);
    const tareKg = UnitConverter.toKg(params.correctedTareWeight, unit);
    const netKg = ProcurementMath.calculateNetWeight(grossKg, tareKg);

    const { weighment } = await weighmentRepository.recordCorrection(
      params.weighmentId,
      grossKg,
      tareKg,
      netKg,
      params.reason,
      params.authorizedBy
    );

    const record = await procurementRepository.findById(weighment.procurementId);
    if (!record) {
      throw new AppError('PROCUREMENT_NOT_FOUND', 'Associated procurement record not found.', 404);
    }

    record.measuredGrossWeightKg = grossKg;
    record.measuredTareWeightKg = tareKg;
    record.measuredNetWeightKg = netKg;

    const updatedProcurement = await procurementRepository.updateProcurement(record);

    realtimeHub.broadcastQueueEvent(record.centreId, 'WEIGHMENT_CORRECTED', {
      procurementId: record.id,
      correctedNetKg: netKg,
      reason: params.reason
    });

    return { procurement: updatedProcurement, weighment };
  }

  /**
   * 5. Perform Quality Inspection & Quality Decision Engine
   */
  async performQualityInspection(params: {
    procurementId: string;
    inspectorId: string;
    officerCentreId: string;
    moisturePercentage: number;
    foreignMatterPercentage: number;
    damagedGrainsPercentage: number;
    brokenGrainsPercentage?: number;
  }): Promise<{ procurement: ProcurementRecord; quality: QualityInspectionRecord }> {
    const record = await procurementRepository.findWithLock(params.procurementId);
    if (!record) {
      throw new AppError('PROCUREMENT_NOT_FOUND', `Procurement session '${params.procurementId}' not found.`, 404);
    }

    if (record.centreId !== params.officerCentreId) {
      throw new AppError('SCOPE_ACCESS_DENIED', 'Cannot perform quality inspection for unassigned centre.', 403);
    }

    if (!record.measuredNetWeightKg || record.measuredNetWeightKg <= 0) {
      throw new AppError('WEIGHMENT_REQUIRED', 'Official weighment must be recorded prior to quality inspection.', 409);
    }

    // Evaluate Quality using Centralized Decision Engine
    const evalResult = QualityEvaluationService.evaluateQuality(
      record.cropTypeId,
      params.moisturePercentage,
      params.foreignMatterPercentage,
      params.damagedGrainsPercentage,
      params.brokenGrainsPercentage || 0,
      record.measuredNetWeightKg
    );

    const ruleVersion = '2026-KMS-01';

    // Persist quality inspection record
    const quality = await qualityRepository.createInspection({
      procurementId: record.id,
      bookingId: record.bookingId,
      inspectorId: params.inspectorId,
      cropTypeId: record.cropTypeId,
      ruleVersion,
      moisturePercentage: params.moisturePercentage,
      foreignMatterPercentage: params.foreignMatterPercentage,
      damagedGrainsPercentage: params.damagedGrainsPercentage,
      brokenGrainsPercentage: params.brokenGrainsPercentage,
      parameters: evalResult.parameters,
      qualityGrade: evalResult.qualityGrade,
      status: evalResult.status,
      deductionPercentage: evalResult.deductionPercentage,
      deductionKg: evalResult.deductionKg,
      rejectionReason: evalResult.rejectionReason
    });

    // Update procurement metrics
    record.qualityInspectionId = quality.id;
    record.qualityGrade = evalResult.qualityGrade;
    record.qualityStatus = evalResult.status;
    record.qualityRuleVersion = ruleVersion;
    record.qualityDeductionKg = evalResult.deductionKg;
    record.qualityInspectedAt = new Date().toISOString();

    if (evalResult.status === 'REJECTED') {
      record.status = 'REJECTED';
      record.finalAcceptedWeightKg = 0;
      record.rejectedWeightKg = record.measuredNetWeightKg;
      record.rejectionReasonCode = 'QUALITY_REJECTED';
      record.rejectionReasonDetails = evalResult.rejectionReason;
    } else {
      record.finalAcceptedWeightKg = ProcurementMath.roundWeight(
        record.measuredNetWeightKg - evalResult.deductionKg
      );
      record.rejectedWeightKg = evalResult.deductionKg;
      record.status = evalResult.deductionKg > 0 ? 'PARTIALLY_ACCEPTED' : 'ACCEPTED';
    }

    const updatedProcurement = await procurementRepository.updateProcurement(record);

    realtimeHub.broadcastQueueEvent(record.centreId, 'QUALITY_INSPECTED', {
      procurementId: record.id,
      status: evalResult.status,
      qualityGrade: evalResult.qualityGrade
    });

    return { procurement: updatedProcurement, quality };
  }

  /**
   * 6. Calculate Procurement Value (Authoritative MSP Rate Resolution)
   */
  async calculateValue(procurementId: string, officerCentreId: string): Promise<ProcurementRecord> {
    const record = await procurementRepository.findWithLock(procurementId);
    if (!record) {
      throw new AppError('PROCUREMENT_NOT_FOUND', `Procurement session '${procurementId}' not found.`, 404);
    }

    if (record.status === 'REJECTED') {
      record.grossPayableAmount = 0;
      record.netPayableAmount = 0;
      record.status = 'UNDER_REVIEW';
      return await procurementRepository.updateProcurement(record);
    }

    if (record.status !== 'ACCEPTED' && record.status !== 'PARTIALLY_ACCEPTED' && record.status !== 'QUALITY_CHECK') {
      throw new AppError(
        'INVALID_STATE_TRANSITION',
        `Cannot calculate procurement value in state '${record.status}'.`,
        409
      );
    }

    // Resolve Authoritative Procurement Rate Config (MSP)
    const rateConfig = PROCUREMENT_RATES[record.cropTypeId] || PROCUREMENT_RATES['crop-001-wheat'];

    record.ratePerQuintal = rateConfig.ratePerQuintal;
    record.ratePerKg = rateConfig.ratePerKg;
    record.rateVersion = rateConfig.rateVersion;

    // Authoritative financial calculations
    record.grossPayableAmount = ProcurementMath.calculatePayableAmount(
      record.finalAcceptedWeightKg,
      rateConfig.ratePerQuintal
    );
    record.totalDeductionsAmount = 0;
    record.netPayableAmount = record.grossPayableAmount;
    record.status = 'UNDER_REVIEW';

    return await procurementRepository.updateProcurement(record);
  }

  /**
   * 7. Transactional Finalization & Phase 10 Handoff
   */
  async finalizeProcurement(procurementId: string, officerId: string, officerCentreId: string): Promise<ProcurementRecord> {
    const record = await procurementRepository.findWithLock(procurementId);
    if (!record) {
      throw new AppError('PROCUREMENT_NOT_FOUND', `Procurement session '${procurementId}' not found.`, 404);
    }

    if (record.centreId !== officerCentreId) {
      throw new AppError('SCOPE_ACCESS_DENIED', 'Cannot finalize procurement for unassigned centre.', 403);
    }

    if (record.status === 'COMPLETED') {
      return record; // Idempotent return
    }

    if (record.status !== 'UNDER_REVIEW' && record.status !== 'ACCEPTED' && record.status !== 'PARTIALLY_ACCEPTED' && record.status !== 'REJECTED') {
      throw new AppError('PROCUREMENT_NOT_READY', `Procurement in state '${record.status}' is not ready for finalization.`, 409);
    }

    // Perform final backend re-validations
    if (record.status !== 'REJECTED') {
      if (!record.weighmentId || !record.measuredNetWeightKg || record.measuredNetWeightKg <= 0) {
        throw new AppError('VALIDATION_FAILED', 'Valid weighment record is missing.', 422);
      }
      if (!record.qualityInspectionId) {
        throw new AppError('VALIDATION_FAILED', 'Valid quality inspection record is missing.', 422);
      }
      if (record.finalAcceptedWeightKg < 0) {
        throw new AppError('VALIDATION_FAILED', 'Final accepted weight cannot be negative.', 422);
      }
    }

    record.status = 'COMPLETED';
    record.completedAt = new Date().toISOString();
    record.procurementOfficerId = officerId;
    record.paymentReady = true; // Expose payment-ready status for Phase 10 handoff!

    const finalizedRecord = await procurementRepository.updateProcurement(record);

    // Automatically trigger Phase 10 Payment Record Creation (non-blocking for session finalization)
    try {
      const { paymentService } = await import('./payment.service');
      await paymentService.createPaymentForProcurement(finalizedRecord.id, `idemp-proc-${finalizedRecord.id}`, officerId);
    } catch (paymentErr: any) {
      logger.warn(`Automatic payment creation warning for procurement ${finalizedRecord.id}: ${paymentErr.message}`);
    }

    // Update queue entry state to COMPLETED if present
    if (record.queueEntryId) {
      await queueRepository.atomicCompleteToken(record.queueEntryId, officerId);
    }

    realtimeHub.broadcastQueueEvent(record.centreId, 'PROCUREMENT_COMPLETED', {
      procurementId: record.id,
      procurementReferenceId: record.procurementReferenceId,
      finalAcceptedWeightKg: record.finalAcceptedWeightKg,
      netPayableAmount: record.netPayableAmount,
      paymentReady: true
    });

    logger.info(
      `Procurement '${record.procurementReferenceId}' finalized successfully. Payment-ready handoff record created for Phase 10.`
    );

    return finalizedRecord;
  }

  /**
   * Fetch Procurement Record Details
   */
  async getProcurementById(id: string): Promise<{
    procurement: ProcurementRecord;
    weighment?: WeighmentRecord | null;
    quality?: QualityInspectionRecord | null;
  }> {
    const procurement = await procurementRepository.findById(id);
    if (!procurement) {
      throw new AppError('PROCUREMENT_NOT_FOUND', `Procurement record '${id}' not found.`, 404);
    }

    let weighment: WeighmentRecord | null = null;
    if (procurement.weighmentId) {
      weighment = await weighmentRepository.findById(procurement.weighmentId);
    }

    let quality: QualityInspectionRecord | null = null;
    if (procurement.qualityInspectionId) {
      quality = await qualityRepository.findById(procurement.qualityInspectionId);
    }

    return { procurement, weighment, quality };
  }

  /**
   * Staff Dashboard & Search Listing
   */
  async listProcurements(filters: {
    centreId?: string;
    farmerId?: string;
    status?: any;
    limit?: number;
    offset?: number;
  }) {
    return await procurementRepository.listProcurements(filters);
  }
}

export const procurementService = new ProcurementService();
