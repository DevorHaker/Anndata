import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { paymentService } from '../src/services/payment.service';
import { PaymentEligibilityService } from '../src/services/paymentEligibility.service';
import { PaymentCalculationService } from '../src/services/paymentCalc.service';
import { mockPaymentProvider } from '../src/services/mockPaymentProvider';
import { traceabilityService } from '../src/services/traceability.service';
import { procurementRepository } from '../src/repositories/procurement.repository';
import { bookingRepository } from '../src/repositories/booking.repository';
import { userRepository } from '../src/repositories/user.repository';
import { generateAccessToken } from '../src/utils/security';
import { pool } from '../src/database';
import { ProcurementRecord } from '../src/types/procurement';
import { BookingRecord } from '../src/types/scheduling';

const helperBooking = (id: string, slotId: string, scheduledDate: string, weight: number): BookingRecord => ({
  id,
  bookingReferenceId: `BK-TEST-${id}`,
  farmerId: 'farmer-001-ramesh',
  centreId: '33333333-3333-4000-8000-333333333333',
  slotId,
  cropTypeId: 'crop-001-wheat',
  scheduledDate,
  startTime: '10:00',
  endTime: '11:00',
  declaredWeightKg: weight,
  estimatedServiceMinutes: 15,
  status: 'CONFIRMED',
  rescheduledCount: 0,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

describe('Phase 10: Payment Management & End-to-End Traceability Engine', () => {
  let testProcurement: ProcurementRecord;
  let testOfficerToken: string;
  let testFarmerToken: string;

  beforeAll(async () => {
    // 1. Create Users & Generate Direct Access Tokens
    const officer = await userRepository.createUser(pool as any, {
      mobileNumber: '+919876543210',
      passwordHash: 'hash',
      roleId: '00000000-0000-4000-8000-000000000004'
    });
    testOfficerToken = generateAccessToken({
      sub: officer.id,
      mobileNumber: officer.mobileNumber,
      role: 'STAFF',
      centreId: '33333333-3333-4000-8000-333333333333',
      sessionId: 'sess-officer-01',
      permissions: ['ALL']
    });

    const farmerUser = await userRepository.createUser(pool as any, {
      mobileNumber: '+919123456789',
      passwordHash: 'hash',
      roleId: '00000000-0000-4000-8000-000000000002'
    });
    testFarmerToken = generateAccessToken({
      sub: farmerUser.id,
      farmerId: 'farmer-001-ramesh',
      mobileNumber: farmerUser.mobileNumber,
      role: 'FARMER',
      sessionId: 'sess-farmer-01',
      permissions: ['FARMER_READ']
    });

    // 2. Seed a completed procurement for Phase 10 payment testing
    const booking = await bookingRepository.createBooking(
      helperBooking('bk-p10-001', 'slot-p10-001', '2026-09-20', 2000),
      'farmer-001-ramesh',
      'FARMER'
    );

    testProcurement = await procurementRepository.createProcurement({
      bookingId: booking.id,
      farmerId: booking.farmerId,
      centreId: booking.centreId,
      cropTypeId: booking.cropTypeId,
      tokenCode: 'T-P10-999',
      procurementOfficerId: officer.id,
      declaredQuantityKg: 2000
    });

    // Mark intake, weighment, quality, valuation, and finalization
    testProcurement.status = 'COMPLETED';
    testProcurement.measuredGrossWeightKg = 2100;
    testProcurement.measuredTareWeightKg = 200;
    testProcurement.measuredNetWeightKg = 1900;
    testProcurement.qualityInspectionId = 'qual-p10-001';
    testProcurement.qualityGrade = 'GRADE_A';
    testProcurement.qualityStatus = 'PASSED';
    testProcurement.qualityDeductionKg = 0;
    testProcurement.finalAcceptedWeightKg = 1900;
    testProcurement.ratePerQuintal = 2425;
    testProcurement.ratePerKg = 24.25;
    testProcurement.rateVersion = '2026-KMS-MSP-01';
    testProcurement.grossPayableAmount = 46075;
    testProcurement.totalDeductionsAmount = 0;
    testProcurement.netPayableAmount = 46075;
    testProcurement.paymentReady = true;
    testProcurement.completedAt = new Date().toISOString();

    await procurementRepository.updateProcurement(testProcurement);
  });

  describe('1. Payment Eligibility & Authoritative Math Engine', () => {
    it('should reject payment creation for a non-completed procurement', () => {
      const pendingProc: any = { status: 'WEIGHING', finalAcceptedWeightKg: 1000, netPayableAmount: 24250 };
      const eligibility = PaymentEligibilityService.evaluateEligibility(pendingProc, null);

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reasons[0].code).toBe('PROCUREMENT_NOT_COMPLETED');
    });

    it('should calculate accurate server-side decimal amounts with rate snapshot', () => {
      const calc = PaymentCalculationService.calculatePaymentAmount(testProcurement);

      expect(calc.acceptedQuantityKg).toBe(1900);
      expect(calc.acceptedQuintals).toBe(19);
      expect(calc.ratePerQuintal).toBe(2425);
      expect(calc.grossAmount).toBe(46075);
      expect(calc.netPayableAmount).toBe(46075);
      expect(calc.rateVersion).toBe('2026-KMS-MSP-01');
    });
  });

  describe('2. Payment Lifecycle & Idempotency', () => {
    let createdPaymentId: string;

    it('POST /api/v1/payments - should idempotently create payment record for completed procurement', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${testOfficerToken}`)
        .send({ procurementId: testProcurement.id, idempotencyKey: 'idemp-p10-test-01' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.procurementId).toBe(testProcurement.id);
      expect(res.body.data.netPayableAmount).toBe(46075);
      expect(res.body.data.status).toBe('PAYMENT_PENDING');
      expect(res.body.data.destinationReference).toBe('XXXX XXXX 4521');

      createdPaymentId = res.body.data.id;

      // Duplicate idempotent request test
      const dupRes = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${testOfficerToken}`)
        .send({ procurementId: testProcurement.id, idempotencyKey: 'idemp-p10-test-01' });

      expect(dupRes.status).toBe(201);
      expect(dupRes.body.data.id).toBe(createdPaymentId);
    });

    it('POST /api/v1/payments/:id/validate - should validate destination and transition to PAYMENT_VALIDATED', async () => {
      const res = await request(app)
        .post(`/api/v1/payments/${createdPaymentId}/validate`)
        .set('Authorization', `Bearer ${testOfficerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PAYMENT_VALIDATED');
    });

    it('POST /api/v1/payments/:id/process - should execute provider disbursement and settle payment', async () => {
      mockPaymentProvider.setBehavior('SUCCESS');

      const res = await request(app)
        .post(`/api/v1/payments/${createdPaymentId}/process`)
        .set('Authorization', `Bearer ${testOfficerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PAYMENT_SUCCESS');
      expect(res.body.data.providerTransactionRef).toContain('UTR-2026-');
    });

    it('GET /api/v1/payments/:id - should return payment details and audit event timeline', async () => {
      const res = await request(app)
        .get(`/api/v1/payments/${createdPaymentId}`)
        .set('Authorization', `Bearer ${testOfficerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdPaymentId);
      expect(res.body.events.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('3. Sandbox Mock Provider Failures & Retry Mechanism', () => {
    let failedPaymentId: string;

    beforeEach(async () => {
      // Create fresh procurement for failure tests
      const b = await bookingRepository.createBooking(
        helperBooking('bk-p10-002', 'slot-p10-002', '2026-09-21', 1000),
        'farmer-001-ramesh',
        'FARMER'
      );
      const p = await procurementRepository.createProcurement({
        bookingId: b.id,
        farmerId: b.farmerId,
        centreId: b.centreId,
        cropTypeId: b.cropTypeId,
        tokenCode: 'T-P10-888',
        procurementOfficerId: 'user-officer-karnal-001',
        declaredQuantityKg: 1000
      });
      p.status = 'COMPLETED';
      p.finalAcceptedWeightKg = 1000;
      p.ratePerQuintal = 2425;
      p.ratePerKg = 24.25;
      p.netPayableAmount = 24250;
      p.paymentReady = true;
      await procurementRepository.updateProcurement(p);

      const pay = await paymentService.createPaymentForProcurement(p.id, `idemp-fail-${p.id}`);
      failedPaymentId = pay.id;
    });

    it('should handle provider TIMEOUT and permit safe retry', async () => {
      mockPaymentProvider.setBehavior('TIMEOUT');

      const procRes = await request(app)
        .post(`/api/v1/payments/${failedPaymentId}/process`)
        .set('Authorization', `Bearer ${testOfficerToken}`);

      expect(procRes.body.data.status).toBe('PAYMENT_RETRY');
      expect(procRes.body.data.failureCode).toBe('PROVIDER_TIMEOUT');

      // Now reset mock provider to SUCCESS and retry
      mockPaymentProvider.setBehavior('SUCCESS');

      const retryRes = await request(app)
        .post(`/api/v1/payments/${failedPaymentId}/retry`)
        .set('Authorization', `Bearer ${testOfficerToken}`);

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.status).toBe('PAYMENT_SUCCESS');
      expect(retryRes.body.data.retryCount).toBe(1);
    });
  });

  describe('4. Provider Webhook Callbacks & Reconciliation Foundation', () => {
    it('POST /api/v1/payments/webhooks/callback - should update status asynchronously', async () => {
      const b = await bookingRepository.createBooking(
        helperBooking('bk-p10-003', 'slot-p10-003', '2026-09-22', 500),
        'farmer-001-ramesh',
        'FARMER'
      );
      const p = await procurementRepository.createProcurement({
        bookingId: b.id,
        farmerId: b.farmerId,
        centreId: b.centreId,
        cropTypeId: b.cropTypeId,
        procurementOfficerId: 'user-officer-karnal-001',
        declaredQuantityKg: 500
      });
      p.status = 'COMPLETED';
      p.finalAcceptedWeightKg = 500;
      p.ratePerQuintal = 2425;
      p.netPayableAmount = 12125;
      p.paymentReady = true;
      await procurementRepository.updateProcurement(p);

      const pay = await paymentService.createPaymentForProcurement(p.id, `idemp-web-${p.id}`);

      const res = await request(app)
        .post('/api/v1/payments/webhooks/callback')
        .send({
          paymentReferenceId: pay.paymentReferenceId,
          providerTransactionRef: 'UTR-BANK-ASYNC-776655',
          status: 'PAYMENT_SUCCESS'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PAYMENT_SUCCESS');
      expect(res.body.data.providerTransactionRef).toBe('UTR-BANK-ASYNC-776655');
    });

    it('should record audit reconciliation mismatch when post-payment correction occurs', async () => {
      const result = await paymentService.handleProcurementCorrectionImpact(
        testProcurement.id,
        1800, // Reduced accepted weight post disbursement
        0,
        'user-officer-karnal-001'
      );

      expect(result.adjustmentRecord).toBeDefined();
      expect(result.adjustmentRecord?.reconciliationState).toBe('MISMATCH');
    });
  });

  describe('5. Complete Unified Traceability Timeline Engine', () => {
    it('GET /api/v1/traceability/:identifier - should aggregate 14-step farm-gate to payment timeline', async () => {
      const res = await request(app)
        .get(`/api/v1/traceability/${testProcurement.id}`)
        .set('Authorization', `Bearer ${testFarmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.procurementId).toBe(testProcurement.id);
      expect(res.body.data.steps.length).toBe(14);

      const stepKeys = res.body.data.steps.map((s: any) => s.stepKey);
      expect(stepKeys).toContain('FARMER_REGISTRATION');
      expect(stepKeys).toContain('PRODUCE_DECLARATION');
      expect(stepKeys).toContain('SLOT_BOOKING');
      expect(stepKeys).toContain('TOKEN_GENERATION');
      expect(stepKeys).toContain('WEIGHBRIDGE_MEASUREMENT');
      expect(stepKeys).toContain('QUALITY_INSPECTION');
      expect(stepKeys).toContain('PAYMENT_CREATION');
      expect(stepKeys).toContain('PAYMENT_SETTLEMENT');
      expect(stepKeys).toContain('AUDITABLE_COMPLETION');
    });
  });
});
