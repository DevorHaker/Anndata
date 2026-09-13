import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { featureService } from '../src/services/intelligence/feature.service';
import { confidenceService } from '../src/services/intelligence/confidence.service';
import { predictionService } from '../src/services/intelligence/prediction.service';
import { recommendationService } from '../src/services/intelligence/recommendation.service';
import { congestionService } from '../src/services/intelligence/congestion.service';
import { simulationService } from '../src/services/intelligence/simulation.service';
import { intelligenceService } from '../src/services/intelligence/intelligence.service';
import { tokenRepository } from '../src/repositories/token.repository';
import { queueRepository } from '../src/repositories/queue.repository';
import { bookingRepository } from '../src/repositories/booking.repository';
import { userRepository } from '../src/repositories/user.repository';
import { pool } from '../src/database';
import { generateAccessToken } from '../src/utils/security';

describe('Phase 11: Real-Time Intelligence, Prediction & Decision Engine Test Suite', () => {
  let adminToken: string;
  let farmerToken: string;
  const testCentreId = '33333333-3333-4000-8000-333333333333';
  let testQueueTokenId: string;

  beforeAll(async () => {
    // 1. Create Users via UserRepository so authentication middleware resolves them
    const adminUser = await userRepository.createUser(pool as any, {
      mobileNumber: '+919876543210',
      passwordHash: 'hash',
      roleId: '00000000-0000-4000-8000-000000000005'
    });

    const farmerUser = await userRepository.createUser(pool as any, {
      mobileNumber: '+919123456789',
      passwordHash: 'hash',
      roleId: '00000000-0000-4000-8000-000000000002'
    });

    // 2. Generate auth tokens using security utility
    adminToken = generateAccessToken({
      sub: adminUser.id,
      mobileNumber: adminUser.mobileNumber,
      role: 'ADMIN',
      centreId: testCentreId,
      sessionId: 'sess-admin-1',
      permissions: ['*']
    });

    farmerToken = generateAccessToken({
      sub: farmerUser.id,
      mobileNumber: farmerUser.mobileNumber,
      role: 'FARMER',
      farmerId: farmerUser.id,
      sessionId: 'sess-farmer-1',
      permissions: ['FARMER_READ', 'FARMER_WRITE']
    });

    // Seed test booking & queue entry
    const booking = await bookingRepository.createBooking({
      farmerId: 'f1111111-1111-4000-8000-111111111111',
      centreId: testCentreId,
      commodityId: 'comm-wheat',
      slotId: 'slot-1000',
      bookingDate: '2026-09-15',
      estimatedQuantityQuintals: 20
    });

    const token = await tokenRepository.createToken(
      booking.id,
      'f1111111-1111-4000-8000-111111111111',
      testCentreId,
      '2026-09-15'
    );

    const queueEntry = await queueRepository.createQueueEntry({
      centreId: testCentreId,
      bookingId: booking.id,
      farmerId: 'f1111111-1111-4000-8000-111111111111',
      tokenId: token.id,
      tokenCode: token.tokenCode,
      actorId: 'admin-1'
    });

    testQueueTokenId = token.id;
  });

  describe('1. Feature Engineering & Confidence Engine', () => {
    it('should generate valid normalized feature vector for procurement centre', async () => {
      const features = await featureService.getCentreFeatureVector(testCentreId, 2500, 'crop-wheat');
      expect(features.centreId).toBe(testCentreId);
      expect(features.queueLength).toBeGreaterThanOrEqual(0);
      expect(features.currentCentreUtilizationPct).toBeGreaterThanOrEqual(0);
      expect(features.staffAvailable).toBeGreaterThan(0);
    });

    it('should calculate dynamic confidence score based on feature stability', async () => {
      const features = await featureService.getCentreFeatureVector(testCentreId);
      const confidence = confidenceService.calculateConfidence(features, 10);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(confidence);
    });
  });

  describe('2. Dynamic Centre & Slot Recommendation Engine', () => {
    it('POST /api/v1/intelligence/recommendations/centre should return ranked explainable recommendations', async () => {
      const res = await request(app)
        .post('/api/v1/intelligence/recommendations/centre')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          farmerId: 'f1111111-1111-4000-8000-111111111111',
          cropTypeId: 'crop-wheat',
          quantityKg: 3000
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendedCentres).toBeInstanceOf(Array);
      expect(res.body.data.explanation).toBeDefined();

      const topChoice = res.body.data.recommendedCentres[0];
      expect(topChoice.overallScore).toBeGreaterThan(0);
      expect(topChoice.pros).toBeInstanceOf(Array);
      expect(topChoice.cons).toBeInstanceOf(Array);
    });

    it('POST /api/v1/intelligence/recommendations/slot should return slot options with wait times', async () => {
      const res = await request(app)
        .post('/api/v1/intelligence/recommendations/slot')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          centreId: testCentreId,
          cropTypeId: 'crop-wheat',
          quantityKg: 2000
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendedSlots.length).toBeGreaterThan(0);
      expect(res.body.data.recommendedSlots[0].expectedServiceStart).toBeDefined();
    });
  });

  describe('3. Live Token ETA & Prediction Engine', () => {
    it('GET /api/v1/intelligence/eta/:tokenId should return live token ETA with confidence bounds', async () => {
      const res = await request(app)
        .get(`/api/v1/intelligence/eta/${testQueueTokenId}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokenId).toBe(testQueueTokenId);
      expect(res.body.data.estimatedWaitMinutes).toBeGreaterThanOrEqual(0);
      expect(res.body.data.estimatedWaitRangeMinutes.min).toBeDefined();
      expect(res.body.data.expectedServiceStartTime).toBeDefined();
      expect(['ML_MODEL', 'STATISTICAL_ENGINE', 'OPERATIONAL_FORMULA', 'RULE_BASED_FALLBACK']).toContain(res.body.data.calculationMethod);
    });
  });

  describe('4. Congestion & Stage-Level Bottleneck Analysis', () => {
    it('GET /api/v1/intelligence/centres/:centreId/status should return status & 30/60 min predictive wait', async () => {
      const res = await request(app)
        .get(`/api/v1/intelligence/centres/${testCentreId}/status`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.predictedWait30Min).toBeGreaterThanOrEqual(res.body.data.currentWaitMinutes);
      expect(res.body.data.reasons).toBeInstanceOf(Array);
    });

    it('GET /api/v1/intelligence/centres/:centreId/bottlenecks should return 6 operational stage bottleneck analysis', async () => {
      const res = await request(app)
        .get(`/api/v1/intelligence/centres/${testCentreId}/bottlenecks`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(6);
      
      const weighing = res.body.data.find((b: any) => b.stage === 'WEIGHING');
      expect(weighing).toBeDefined();
      expect(weighing.primaryContributor).toBeDefined();
    });
  });

  describe('5. What-If Discrete Event Scenario Simulation', () => {
    it('POST /api/v1/intelligence/simulations should execute simulation and output mitigations', async () => {
      const res = await request(app)
        .post('/api/v1/intelligence/simulations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          centreId: testCentreId,
          additionalArrivals: 25,
          staffDelta: -1,
          equipmentDelta: -1,
          redistributedBookingsCount: 5
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.simulatedWaitMinutes).toBeGreaterThan(res.body.data.baselineWaitMinutes);
      expect(res.body.data.recommendedMitigations.length).toBeGreaterThan(0);
      expect(res.body.data.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('6. Model Registry & Human Override Ledger', () => {
    it('GET /api/v1/intelligence/models should return model registry entries and MAE metrics', async () => {
      const res = await request(app)
        .get('/api/v1/intelligence/models')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].maeMinutes).toBeDefined();
    });

    it('POST /api/v1/intelligence/overrides should audit human operational decision overrides', async () => {
      // Record override on a test decision ID
      const overrideRes = await request(app)
        .post('/api/v1/intelligence/overrides')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decisionId: `dec-override-test-1`,
          reason: 'Mandi manager manual intervention due to local transport strike',
          newAction: 'Redirect 10 bookings to Karnal North Mandi'
        });

      expect([200, 404]).toContain(overrideRes.status);
    });
  });
});
