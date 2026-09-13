import { describe, it, expect, beforeAll } from 'vitest';
import { procurementService } from '../src/services/procurement.service';
import { weighmentRepository } from '../src/repositories/weighment.repository';
import { qualityRepository } from '../src/repositories/quality.repository';
import { bookingRepository } from '../src/repositories/booking.repository';
import { UnitConverter, ProcurementMath, QualityEvaluationService } from '../src/utils/procurementCalc';
import { BookingRecord } from '../src/types/scheduling';

describe('Phase 9: Procurement Operations & Financial Integrity Test Suite', () => {
  const testBookingId = 'bk-p9-test-001';
  const testCentreId = '33333333-3333-4000-8000-333333333333';
  const testOfficerId = 'user-officer-001';
  const testManagerId = 'user-manager-001';
  const testFarmerId = 'farmer-p9-001';
  let createdProcurementId: string;
  let recordedWeighmentId: string;
  let recordedQualityId: string;

  beforeAll(async () => {
    // Seed test booking for phase 9 integration testing
    const now = new Date().toISOString();
    const seedBooking: BookingRecord = {
      id: testBookingId,
      bookingReferenceId: 'BK-2026-P9TEST',
      farmerId: testFarmerId,
      centreId: testCentreId,
      slotId: 'slot-p9-001',
      cropTypeId: 'crop-001-wheat',
      declaredWeightKg: 2000,
      estimatedServiceMinutes: 30,
      scheduledDate: '2026-09-15',
      startTime: '09:00:00',
      endTime: '10:00:00',
      status: 'CHECKED_IN',
      rescheduledCount: 0,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    await bookingRepository.createBooking(seedBooking, testFarmerId, 'FARMER');
  });

  it('1. UnitConverter & ProcurementMath precision verification', () => {
    // 1 Quintal = 100 KG
    expect(UnitConverter.toKg(20, 'QUINTAL')).toBe(2000);
    expect(UnitConverter.fromKg(2000, 'QUINTAL')).toBe(20);

    // 1 Tonne = 1000 KG
    expect(UnitConverter.toKg(2.5, 'TONNE')).toBe(2500);

    // Net weight calculation: 2050 kg gross - 100 kg tare = 1950 kg net
    const net = ProcurementMath.calculateNetWeight(2050, 100);
    expect(net).toBe(1950);

    // Negative tare or tare >= gross rejection
    expect(() => ProcurementMath.calculateNetWeight(1000, 1050)).toThrow();
    expect(() => ProcurementMath.calculateNetWeight(-500, 100)).toThrow();

    // Financial payable calculation: 1850 kg accepted @ ₹2,275/quintal (₹22.75/kg)
    const payable = ProcurementMath.calculatePayableAmount(1850, 2275);
    expect(payable).toBe(42087.5);
  });

  it('2. QualityEvaluationService commodity-aware inspection test', () => {
    // Wheat KMS rules: max moisture 14%, deduction threshold 12%
    // 13% moisture on 2000 kg net weight => 1% excess = 1% deduction = 20 kg deduction
    const evalResult = QualityEvaluationService.evaluateQuality(
      'crop-001-wheat',
      13.0, // moisture
      1.0,  // foreign matter
      1.5,  // damaged grains
      0,
      2000
    );

    expect(evalResult.status).toBe('PASSED_WITH_DEDUCTION');
    expect(evalResult.qualityGrade).toBe('GRADE_B');
    expect(evalResult.deductionPercentage).toBe(1.0);
    expect(evalResult.deductionKg).toBe(20);

    // Rejection test: moisture 15.5% (exceeds 14% max)
    const failResult = QualityEvaluationService.evaluateQuality(
      'crop-001-wheat',
      15.5,
      1.0,
      1.5,
      0,
      2000
    );

    expect(failResult.status).toBe('REJECTED');
    expect(failResult.qualityGrade).toBe('REJECTED');
    expect(failResult.rejectionReason).toContain('Moisture');
  });

  it('3. Initiate Procurement Session from queue/booking', async () => {
    const procurement = await procurementService.startSession({
      bookingId: testBookingId,
      officerId: testOfficerId,
      officerCentreId: testCentreId
    });

    expect(procurement).toBeDefined();
    expect(procurement.id).toBeDefined();
    expect(procurement.procurementReferenceId).toMatch(/^PR-2026-/);
    expect(procurement.status).toBe('INITIATED');
    expect(procurement.paymentReady).toBe(false);

    createdProcurementId = procurement.id;
  });

  it('4. Confirm produce intake receipt', async () => {
    const procurement = await procurementService.confirmIntake(
      createdProcurementId,
      testCentreId
    );

    expect(procurement.status).toBe('RECEIVED');
  });

  it('5. Weighing Equipment status validation (Rejects unavailable equipment)', async () => {
    // Attempt weighment on maintenance equipment 'eq-wb-maint'
    await expect(
      procurementService.recordWeighment({
        procurementId: createdProcurementId,
        equipmentId: 'eq-wb-maint', // Status: MAINTENANCE
        operatorId: testOfficerId,
        officerCentreId: testCentreId,
        grossWeight: 2050,
        tareWeight: 100
      })
    ).rejects.toThrow();
  });

  it('6. Record official weighment on operational equipment', async () => {
    const result = await procurementService.recordWeighment({
      procurementId: createdProcurementId,
      equipmentId: 'eq-wb-001', // Status: OPERATIONAL
      operatorId: testOfficerId,
      officerCentreId: testCentreId,
      grossWeight: 2050,
      tareWeight: 100,
      unit: 'KG'
    });

    expect(result.procurement.status).toBe('WEIGHING');
    expect(result.procurement.measuredGrossWeightKg).toBe(2050);
    expect(result.procurement.measuredTareWeightKg).toBe(100);
    expect(result.procurement.measuredNetWeightKg).toBe(1950);
    expect(result.weighment.netWeightKg).toBe(1950);

    recordedWeighmentId = result.weighment.id;
  });

  it('7. Audit trail of weighment correction', async () => {
    // Scale recalibration adjustment: gross corrected to 2040 kg
    const result = await procurementService.correctWeighment({
      weighmentId: recordedWeighmentId,
      correctedGrossWeight: 2040,
      correctedTareWeight: 100,
      reason: 'Scale calibration fine-tuning adjustment',
      authorizedBy: testManagerId,
      officerCentreId: testCentreId
    });

    expect(result.weighment.netWeightKg).toBe(1940);
    expect(result.weighment.status).toBe('CORRECTED');
    expect(result.procurement.measuredNetWeightKg).toBe(1940);

    const history = await weighmentRepository.getCorrectionHistory(recordedWeighmentId);
    expect(history.length).toBe(1);
    expect(history[0].correctionReason).toContain('Scale calibration');
  });

  it('8. Perform quality inspection & deduction calculation', async () => {
    const result = await procurementService.performQualityInspection({
      procurementId: createdProcurementId,
      inspectorId: testOfficerId,
      officerCentreId: testCentreId,
      moisturePercentage: 13.0, // 1% excess moisture -> 1% deduction on 1940 kg = 19.4 kg deduction
      foreignMatterPercentage: 1.0,
      damagedGrainsPercentage: 1.5
    });

    expect(result.quality.status).toBe('PASSED_WITH_DEDUCTION');
    expect(result.procurement.qualityDeductionKg).toBe(19.4);
    expect(result.procurement.finalAcceptedWeightKg).toBe(1920.6); // 1940 - 19.4
    expect(result.procurement.rejectedWeightKg).toBe(19.4);
    expect(result.procurement.status).toBe('PARTIALLY_ACCEPTED');

    recordedQualityId = result.quality.id;
  });

  it('9. Authoritative MSP procurement value calculation', async () => {
    // Wheat MSP: ₹2,275 per quintal (₹22.75/kg)
    // 1920.6 kg accepted @ ₹22.75 = ₹43,693.65
    const procurement = await procurementService.calculateValue(
      createdProcurementId,
      testCentreId
    );

    expect(procurement.status).toBe('UNDER_REVIEW');
    expect(procurement.ratePerQuintal).toBe(2275);
    expect(procurement.ratePerKg).toBe(22.75);
    expect(procurement.grossPayableAmount).toBe(43693.65);
    expect(procurement.netPayableAmount).toBe(43693.65);
  });

  it('10. Transactional Finalization & Phase 10 Payment-Ready Handoff', async () => {
    const procurement = await procurementService.finalizeProcurement(
      createdProcurementId,
      testOfficerId,
      testCentreId
    );

    expect(procurement.status).toBe('COMPLETED');
    expect(procurement.paymentReady).toBe(true);
    expect(procurement.completedAt).toBeDefined();

    // Idempotency test: repeated finalization call returns completed record
    const refinalized = await procurementService.finalizeProcurement(
      createdProcurementId,
      testOfficerId,
      testCentreId
    );
    expect(refinalized.status).toBe('COMPLETED');
  });

  it('11. Manager Quality Override Auditing', async () => {
    const override = await qualityRepository.recordOverride(
      recordedQualityId,
      'Special administrative tolerance granted for regional rainfall anomaly',
      testManagerId,
      'PASSED',
      'GRADE_A'
    );

    expect(override.overridden).toBe(true);
    expect(override.overriddenBy).toBe(testManagerId);
    expect(override.status).toBe('PASSED');
  });
});
