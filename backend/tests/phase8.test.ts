import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { qrCrypto } from '../src/utils/qrCrypto';
import { tokenRepository } from '../src/repositories/token.repository';
import { checkinRepository } from '../src/repositories/checkin.repository';
import { queueRepository } from '../src/repositories/queue.repository';
import { centreDomainRepository } from '../src/repositories/centreDomain.repository';
import { slotRepository } from '../src/repositories/slot.repository';
import { v4 as uuidv4 } from 'uuid';

describe('Phase 8: Token Generation, Gate Check-In & Dynamic Queue Engine Test Suite', () => {
  const farmerMobile = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
  const officerMobile = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
  const managerMobile = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testPassword = 'SecurePassword123!';

  let farmerToken: string = '';
  let farmerId: string = '';
  let officerToken: string = '';
  let managerToken: string = '';
  let centreId: string = '';
  let slotId: string = '';
  let bookingId: string = '';
  let digitalTokenId: string = '';
  let tokenCode: string = '';
  let qrPayload: any = null;
  let queueEntryId: string = '';

  beforeAll(async () => {
    // 1. Register Farmer User
    const resFarmer = await request(app).post('/api/v1/auth/register').send({
      mobileNumber: farmerMobile,
      password: testPassword,
      roleCode: 'FARMER',
      firstName: 'Vikram',
      lastName: 'Singh'
    });
    farmerToken = resFarmer.body.data.tokens.accessToken;
    farmerId = resFarmer.body.data.user.farmerId;

    // 2. Register Procurement Officer User
    const resOfficer = await request(app).post('/api/v1/auth/register').send({
      mobileNumber: officerMobile,
      password: testPassword,
      roleCode: 'PROCUREMENT_OFFICER',
      firstName: 'Officer',
      lastName: 'Sharma'
    });
    officerToken = resOfficer.body.data.tokens.accessToken;

    // 3. Register Centre Manager User
    const resManager = await request(app).post('/api/v1/auth/register').send({
      mobileNumber: managerMobile,
      password: testPassword,
      roleCode: 'CENTRE_MANAGER',
      firstName: 'Manager',
      lastName: 'Verma'
    });
    managerToken = resManager.body.data.tokens.accessToken;

    // 4. Get candidate centre ID
    const centresRes = await centreDomainRepository.listCentres();
    centreId = centresRes.data[0].id;

    // 5. Create Confirmed Slot Booking for testing
    const today = new Date().toISOString().split('T')[0];
    const slots = await slotRepository.findSlotsByCentreAndDate(centreId, today);
    slotId = slots[0].id;

    const resBooking = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        farmerId,
        centreId,
        slotId,
        cropTypeId: 'crop-001-wheat',
        declaredWeightKg: 2000
      });

    bookingId = resBooking.body.data.id;
  });

  // -------------------------------------------------------------
  // SECTION 1: QR CRYPTO & SECURITY UNIT TESTS
  // -------------------------------------------------------------

  describe('QRCrypto & Payload Security', () => {
    it('should generate a valid HMAC signature and construct opaque QR payload without PII', () => {
      const payload = qrCrypto.createQRPayload('T-099', 'tok-123', 'bk-456', 'centre-789');
      expect(payload.type).toBe('PROCUREMENT_CHECKIN');
      expect(payload.tokenCode).toBe('T-099');
      expect(payload.signature).toBeDefined();

      // Verify no sensitive PII fields exist
      expect((payload as any).aadhaar).toBeUndefined();
      expect((payload as any).bankAccount).toBeUndefined();

      const verifyRes = qrCrypto.verifyQRPayload(payload);
      expect(verifyRes.isValid).toBe(true);
    });

    it('should reject tampered or forged QR payloads', () => {
      const payload = qrCrypto.createQRPayload('T-099', 'tok-123', 'bk-456', 'centre-789');
      payload.signature = '0000000000000000000000000000000000000000000000000000000000000000'; // Forged signature

      const verifyRes = qrCrypto.verifyQRPayload(payload);
      expect(verifyRes.isValid).toBe(false);
      expect(verifyRes.reason).toBe('INVALID_QR_SIGNATURE');
    });
  });

  // -------------------------------------------------------------
  // SECTION 2: DIGITAL TOKEN GENERATION TESTS
  // -------------------------------------------------------------

  describe('Digital Token API Endpoints', () => {
    it('POST /api/v1/tokens/generate should issue a unique digital token for confirmed booking', async () => {
      const res = await request(app)
        .post('/api/v1/tokens/generate')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ bookingId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokenCode).toMatch(/^T-\d{3}$/);
      expect(res.body.data.status).toBe('ACTIVE');

      digitalTokenId = res.body.data.id;
      tokenCode = res.body.data.tokenCode;
    });

    it('POST /api/v1/tokens/generate should be idempotent and return existing token', async () => {
      const res = await request(app)
        .post('/api/v1/tokens/generate')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ bookingId });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(digitalTokenId);
      expect(res.body.data.tokenCode).toBe(tokenCode);
    });

    it('GET /api/v1/tokens/:id/qr should return cryptographic QR payload', async () => {
      const res = await request(app)
        .get(`/api/v1/tokens/${digitalTokenId}/qr`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('PROCUREMENT_CHECKIN');
      expect(res.body.data.tokenCode).toBe(tokenCode);

      qrPayload = res.body.data;
    });
  });

  // -------------------------------------------------------------
  // SECTION 3: GATE CHECK-IN & WRONG CENTRE PROTECTION TESTS
  // -------------------------------------------------------------

  describe('Gate Check-In API Endpoints', () => {
    it('POST /api/v1/checkins/qr should reject check-in at WRONG procurement centre', async () => {
      const fakeCentreId = 'centre-wrong-999';

      const res = await request(app)
        .post('/api/v1/checkins/qr')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          qrPayload,
          centreId: fakeCentreId
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      const errMsg = res.body.error?.message || res.body.message;
      expect(errMsg).toContain('assigned to another procurement centre');
    });

    it('POST /api/v1/checkins/qr should successfully check in farmer at assigned centre and enter live queue', async () => {
      const res = await request(app)
        .post('/api/v1/checkins/qr')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          qrPayload,
          centreId
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationMethod).toBe('QR_SCAN');
    });

    it('POST /api/v1/checkins/qr should prevent duplicate check-in', async () => {
      const res = await request(app)
        .post('/api/v1/checkins/qr')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          qrPayload,
          centreId
        });

      expect(res.status).toBe(409);
      const errMsg = res.body.error?.message || res.body.message;
      expect(errMsg).toContain('already been checked in');
    });
  });

  // -------------------------------------------------------------
  // SECTION 4: LIVE QUEUE & POSITIONING TESTS
  // -------------------------------------------------------------

  describe('Queue Engine & Live Positioning API', () => {
    it('GET /api/v1/queue/farmer should return live queue position and ETA for farmer', async () => {
      const res = await request(app)
        .get(`/api/v1/queue/farmer?bookingId=${bookingId}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token.tokenCode).toBe(tokenCode);
      expect(res.body.data.queue.status).toBe('WAITING');
      expect(res.body.data.queue.position).toBeGreaterThanOrEqual(1);

      queueEntryId = res.body.data.queue.queueEntryId;
    });

    it('GET /api/v1/queue/snapshot should return centre queue snapshot for staff', async () => {
      const res = await request(app)
        .get(`/api/v1/queue/snapshot?centreId=${centreId}`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.waitingCount).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/v1/queue/call-next should call next WAITING token', async () => {
      const res = await request(app)
        .post('/api/v1/queue/call-next')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          centreId,
          stationId: 'COUNTER_1'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CALLED');
      expect(res.body.data.assignedStationId).toBe('COUNTER_1');
    });

    it('POST /api/v1/queue/:id/serve should start queue service for token', async () => {
      const res = await request(app)
        .post(`/api/v1/queue/${queueEntryId}/serve`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ stationId: 'COUNTER_1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PROCESSING');
    });

    it('POST /api/v1/queue/:id/complete should complete queue service for token', async () => {
      const res = await request(app)
        .post(`/api/v1/queue/${queueEntryId}/complete`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });
  });

  // -------------------------------------------------------------
  // SECTION 5: CONCURRENCY PROTECTION & PAUSE/RESUME TESTS
  // -------------------------------------------------------------

  describe('Concurrency & Queue Operational Controls', () => {
    it('should protect against concurrent call-next requests from multiple staff officers', async () => {
      // Create 2 checked-in queue tokens
      const bookingIdA = uuidv4();
      const bookingIdB = uuidv4();

      await queueRepository.createQueueEntry({
        centreId,
        bookingId: bookingIdA,
        farmerId: uuidv4(),
        tokenId: uuidv4(),
        tokenCode: 'T-101',
        actorId: 'system'
      });

      await queueRepository.createQueueEntry({
        centreId,
        bookingId: bookingIdB,
        farmerId: uuidv4(),
        tokenId: uuidv4(),
        tokenCode: 'T-102',
        actorId: 'system'
      });

      // Send 2 simultaneous call-next requests
      const req1 = queueRepository.atomicCallNextToken(centreId, 'COUNTER_1', 'officer-1');
      const req2 = queueRepository.atomicCallNextToken(centreId, 'COUNTER_2', 'officer-2');

      const [res1, res2] = await Promise.all([req1, req2]);

      expect(res1).not.toBeNull();
      expect(res2).not.toBeNull();

      // Ensure they got two DIFFERENT tokens!
      expect(res1?.id).not.toBe(res2?.id);
    });

    it('POST /api/v1/queue/pause and /resume should pause and resume queue operations', async () => {
      // Pause queue with CENTRE_MANAGER token
      const pauseRes = await request(app)
        .post('/api/v1/queue/pause')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ centreId, reason: 'Power grid disruption' });

      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.data.isPaused).toBe(true);

      // Attempt call-next while paused should fail
      const callRes = await request(app)
        .post('/api/v1/queue/call-next')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ centreId, stationId: 'COUNTER_1' });

      expect(callRes.status).toBe(500); // Handled queue paused exception

      // Resume queue with CENTRE_MANAGER token
      const resumeRes = await request(app)
        .post('/api/v1/queue/resume')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ centreId });

      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.data.isPaused).toBe(false);
    });
  });
});
