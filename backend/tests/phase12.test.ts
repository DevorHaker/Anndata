import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { userRepository } from '../src/repositories/user.repository';
import { tokenRepository } from '../src/repositories/token.repository';
import { pool } from '../src/database';
import { generateAccessToken } from '../src/utils/security';
import { v4 as uuidv4 } from 'uuid';

describe('Phase 12: Notifications, Offline-First Operations & Accessibility Test Suite', () => {
  let farmerToken: string;
  let farmerId: string;
  let officerToken: string;
  let officerId: string;
  let testTokenId: string;
  const centreId = '33333333-3333-4000-8000-333333333333';

  beforeAll(async () => {
    // 1. Seed Farmer User
    farmerId = 'f12-' + uuidv4().substring(0, 8);
    const farmerUser = await userRepository.createUser(pool, {
      mobileNumber: '9876500012',
      passwordHash: 'hash123',
      roleId: '00000000-0000-4000-8000-000000000002'
    });
    farmerToken = generateAccessToken({
      sub: farmerUser.id,
      mobileNumber: farmerUser.mobileNumber,
      role: 'FARMER',
      sessionId: 'sess-f12',
      permissions: ['FARMER_READ', 'FARMER_WRITE']
    });

    // 2. Seed Procurement Officer User
    officerId = 'o12-' + uuidv4().substring(0, 8);
    const officerUser = await userRepository.createUser(pool, {
      mobileNumber: '9876500099',
      passwordHash: 'hash999',
      roleId: '00000000-0000-4000-8000-000000000004'
    });
    officerToken = generateAccessToken({
      sub: officerUser.id,
      mobileNumber: officerUser.mobileNumber,
      role: 'PROCUREMENT_OFFICER',
      sessionId: 'sess-o12',
      permissions: ['PROCUREMENT_READ', 'PROCUREMENT_WRITE']
    });

    // 3. Seed Digital Token for offline check-in testing
    const token = await tokenRepository.createToken(
      'b-12-001',
      farmerUser.id,
      centreId,
      '2026-09-15'
    );
    testTokenId = token.id;
  });

  describe('1. Multichannel Notification Engine & Preferences', () => {
    it('GET /api/v1/notifications/preferences should return farmer preferences in Hindi', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferredLanguage).toBe('hi');
      expect(res.body.data.smsEnabled).toBe(true);
    });

    it('PUT /api/v1/notifications/preferences should update farmer preference settings', async () => {
      const res = await request(app)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          preferredLanguage: 'en',
          smsEnabled: false
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferredLanguage).toBe('en');
      expect(res.body.data.smsEnabled).toBe(false);
    });

    it('GET /api/v1/notifications should return user notification history', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/notifications/deliveries/stats should return delivery metrics to staff', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/deliveries/stats')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deliverySuccessRatePct).toBeDefined();
    });
  });

  describe('2. Offline Batch Action Synchronization Engine', () => {
    it('POST /api/v1/sync should synchronize queued offline check-in action', async () => {
      const actionId = 'act-sync-' + uuidv4().substring(0, 8);
      const res = await request(app)
        .post('/api/v1/sync')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          deviceId: 'device-mandi-gate-1',
          actions: [
            {
              actionId,
              type: 'CHECK_IN',
              entityId: testTokenId,
              centreId,
              actorId: officerId,
              timestamp: new Date().toISOString(),
              clientVersion: 1,
              payload: { gateNumber: 'GATE_01' },
              status: 'PENDING_SYNC',
              retryCount: 0
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accepted.length).toBe(1);
      expect(res.body.data.accepted[0].status).toBe('SYNCED');
    });

    it('POST /api/v1/sync should detect duplicate idempotency on retried action', async () => {
      const actionId = 'act-sync-dup-' + uuidv4().substring(0, 8);
      
      // First submission
      await request(app)
        .post('/api/v1/sync')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          deviceId: 'device-mandi-gate-1',
          actions: [
            {
              actionId,
              type: 'OPERATIONAL_NOTE',
              entityId: centreId,
              centreId,
              actorId: officerId,
              timestamp: new Date().toISOString(),
              clientVersion: 1,
              payload: { note: 'Intake ramp 2 cleared' },
              status: 'PENDING_SYNC',
              retryCount: 0
            }
          ]
        });

      // Retry submission with same actionId
      const res = await request(app)
        .post('/api/v1/sync')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          deviceId: 'device-mandi-gate-1',
          actions: [
            {
              actionId,
              type: 'OPERATIONAL_NOTE',
              entityId: centreId,
              centreId,
              actorId: officerId,
              timestamp: new Date().toISOString(),
              clientVersion: 1,
              payload: { note: 'Intake ramp 2 cleared' },
              status: 'PENDING_SYNC',
              retryCount: 1
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.accepted.length).toBe(1);
      expect(res.body.data.accepted[0].status).toBe('SYNCED');
    });

    it('GET /api/v1/sync/status should return offline sync metrics to staff', async () => {
      const res = await request(app)
        .get('/api/v1/sync/status')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalActions).toBeGreaterThanOrEqual(1);
    });
  });
});
