import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { userRepository } from '../src/repositories/user.repository';
import { pool } from '../src/database';
import { generateAccessToken } from '../src/utils/security';
import { v4 as uuidv4 } from 'uuid';

describe('Phase 13: System Hardening, Security, IDOR & Analytics Test Suite', () => {
  let adminToken: string;
  let farmerToken: string;
  let otherFarmerToken: string;
  let farmerId: string;
  let otherFarmerId: string;

  beforeAll(async () => {
    // 1. Seed System Admin User
    const adminUser = await userRepository.createUser(pool, {
      mobileNumber: '9900112233',
      passwordHash: 'adminhash123',
      roleId: '00000000-0000-4000-8000-000000000001'
    });
    adminToken = generateAccessToken({
      sub: adminUser.id,
      mobileNumber: adminUser.mobileNumber,
      role: 'SYSTEM_ADMIN',
      sessionId: 'sess-p13-admin',
      permissions: ['ALL']
    });

    // 2. Seed Primary Farmer User
    farmerId = 'f13-' + uuidv4().substring(0, 8);
    const farmerUser = await userRepository.createUser(pool, {
      mobileNumber: '9900112244',
      passwordHash: 'farmerhash123',
      roleId: '00000000-0000-4000-8000-000000000002'
    });
    farmerToken = generateAccessToken({
      sub: farmerUser.id,
      mobileNumber: farmerUser.mobileNumber,
      role: 'FARMER',
      sessionId: 'sess-p13-f1',
      permissions: ['FARMER_READ', 'FARMER_WRITE']
    });

    // 3. Seed Secondary Farmer User (IDOR Target)
    otherFarmerId = 'f13-' + uuidv4().substring(0, 8);
    const otherFarmerUser = await userRepository.createUser(pool, {
      mobileNumber: '9900112255',
      passwordHash: 'farmerhash456',
      roleId: '00000000-0000-4000-8000-000000000002'
    });
    otherFarmerToken = generateAccessToken({
      sub: otherFarmerUser.id,
      mobileNumber: otherFarmerUser.mobileNumber,
      role: 'FARMER',
      sessionId: 'sess-p13-f2',
      permissions: ['FARMER_READ', 'FARMER_WRITE']
    });
  });

  describe('1. Executive Analytics Engine & Centralized KPIs', () => {
    it('GET /api/v1/analytics/summary should return aggregated executive dashboard summary', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reportingTimezone).toBe('Asia/Kolkata');
      expect(res.body.data.farmer.verifiedFarmers).toBeGreaterThan(0);
      expect(res.body.data.centre.dailyThroughputQuintals).toBeGreaterThan(0);
      expect(res.body.data.payment.totalPaymentVolumeINR).toBeGreaterThan(0);
    });

    it('GET /api/v1/analytics/farmers should return farmer registration & completion metrics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/farmers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingCompletionRatePct).toBeDefined();
    });

    it('GET /api/v1/analytics/payments should return payment volume & reconciliation metrics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalPaymentVolumeINR).toBeDefined();
    });

    it('GET /api/v1/analytics/summary should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/analytics/summary');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Security Hardening & Privilege Escalation Checks', () => {
    it('Farmer token should be forbidden from accessing admin user management', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Request headers should include Helmet security protection headers', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['strict-transport-security']).toBeDefined();
    });

    it('All responses should include request correlation ID envelope', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.requestId).toBeDefined();
    });
  });
});
