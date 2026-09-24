import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { distanceCalculator } from '../src/services/recommendation/DistanceCalculator';
import { quantityWorkloadModel } from '../src/services/recommendation/QuantityWorkloadModel';
import { eligibilityFilter } from '../src/services/recommendation/EligibilityFilter';
import { workloadEvaluator } from '../src/services/recommendation/WorkloadEvaluator';
import { centreScoringService } from '../src/services/recommendation/CentreScoringService';
import { recommendationExplanationService } from '../src/services/recommendation/RecommendationExplanationService';
import { recommendationEngine } from '../src/services/recommendation/RecommendationEngine';
import { slotRepository } from '../src/repositories/slot.repository';
import { bookingRepository } from '../src/repositories/booking.repository';
import { farmerDomainRepository } from '../src/repositories/farmerDomain.repository';
import { centreDomainRepository } from '../src/repositories/centreDomain.repository';
import { v4 as uuidv4 } from 'uuid';

describe('Phase 7: Dynamic Procurement Slot & Recommendation Engine Test Suite', () => {
  const farmerMobile = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
  const adminMobile = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testPassword = 'SecurePassword123!';

  let farmerToken: string = '';
  let farmerId: string = '';
  let adminToken: string = '';
  let centreId: string = '';
  let cropTypeId: string = 'crop-001-wheat';

  beforeAll(async () => {
    // 1. Register Farmer User
    const resFarmer = await request(app).post('/api/v1/auth/register').send({
      mobileNumber: farmerMobile,
      password: testPassword,
      roleCode: 'FARMER',
      firstName: 'Ramesh',
      lastName: 'Kumar'
    });
    farmerToken = resFarmer.body.data.tokens.accessToken;
    farmerId = resFarmer.body.data.user.farmerId;

    // 2. Register Admin User
    const resAdmin = await request(app).post('/api/v1/auth/register').send({
      mobileNumber: adminMobile,
      password: testPassword,
      roleCode: 'SYSTEM_ADMIN',
      firstName: 'Admin',
      lastName: 'User'
    });
    adminToken = resAdmin.body.data.tokens.accessToken;

    // 3. Get candidate centre ID (ensure normal operating status with no active disruptions)
    const centresRes = await centreDomainRepository.listCentres();
    for (const c of centresRes.data) {
      const disruptions = await centreDomainRepository.listDisruptions(c.id);
      const active = disruptions.filter((d: any) => d.status !== 'RESOLVED' && (d.severity === 'CRITICAL' || d.severity === 'HIGH'));
      if (active.length === 0) {
        centreId = c.id;
        break;
      }
    }
    if (!centreId && centresRes.data.length > 0) centreId = centresRes.data[0].id;
  });

  // -------------------------------------------------------------
  // SECTION 1: UNIT TESTS FOR RECOMMENDATION ENGINE SUB-SERVICES
  // -------------------------------------------------------------

  describe('DistanceCalculator', () => {
    it('should correctly calculate Haversine distance between Karnal and Nilokheri (~18.5 km)', () => {
      const res = distanceCalculator.calculateDistance(29.6857, 76.9905, 29.8333, 76.9167);
      expect(res.isDistanceAvailable).toBe(true);
      expect(res.distanceKm).toBeGreaterThan(15);
      expect(res.distanceKm).toBeLessThan(25);
      expect(res.estimatedTravelTimeMinutes).toBeGreaterThan(30);
    });

    it('should gracefully handle missing latitude/longitude coordinates', () => {
      const res = distanceCalculator.calculateDistance(null, null, 29.6857, 76.9905);
      expect(res.isDistanceAvailable).toBe(false);
      expect(res.distanceKm).toBeNull();
      expect(res.estimatedTravelTimeMinutes).toBeNull();
    });
  });

  describe('QuantityWorkloadModel', () => {
    it('should calculate workload-aware service duration based on produce weight', () => {
      const smallLoad = quantityWorkloadModel.calculateEstimatedServiceMinutes(500);
      const mediumLoad = quantityWorkloadModel.calculateEstimatedServiceMinutes(5000);
      const heavyLoad = quantityWorkloadModel.calculateEstimatedServiceMinutes(15000);

      expect(smallLoad).toBe(22); // 10 base + 1.5 + 5 + 5
      expect(mediumLoad).toBe(35); // 10 base + 15 + 5 + 5
      expect(heavyLoad).toBe(60); // Clamped to max 60 mins
    });
  });

  describe('EligibilityFilter', () => {
    it('should filter out CLOSED procurement centres', () => {
      const mockCentre: any = { status: 'CLOSED' };
      const res = eligibilityFilter.evaluateCentreEligibility(mockCentre, [], [], cropTypeId, 1000, 10);
      expect(res.isEligible).toBe(false);
      expect(res.ineligibilityReasons[0]).toContain('CLOSED');
    });

    it('should filter out centres affected by CRITICAL incidents', () => {
      const mockCentre: any = { status: 'NORMAL' };
      const disruptions: any = [{ title: 'Weighbridge Failure', status: 'ACTIVE', severity: 'CRITICAL' }];
      const res = eligibilityFilter.evaluateCentreEligibility(mockCentre, disruptions, [], cropTypeId, 1000, 10);
      expect(res.isEligible).toBe(false);
      expect(res.ineligibilityReasons[0]).toContain('critical incident');
    });
  });

  describe('RecommendationExplanationService', () => {
    it('should generate human-readable explanations', () => {
      const mockCentre: any = { status: 'NORMAL' };
      const mockWorkload: any = { estimatedWaitMinutes: 15, activeCapacityRatio: 0.8, workloadRatio: 0.2 };
      const exp = recommendationExplanationService.generateExplanations(
        mockCentre,
        'Wheat',
        8.2,
        mockWorkload,
        [],
        true
      );

      expect(exp.reasons.some((r) => r.includes('8.2 km'))).toBe(true);
      expect(exp.reasons.some((r) => r.includes('Wheat'))).toBe(true);
      expect(exp.reasons.some((r) => r.includes('Low expected waiting time'))).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // SECTION 2: RECOMMENDATION ENGINE API TESTS
  // -------------------------------------------------------------

  describe('Recommendation API Endpoints', () => {
    it('POST /api/v1/recommendations should return ranked recommendations with reasons', async () => {
      const res = await request(app)
        .post('/api/v1/recommendations')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          cropTypeId: 'crop-001-wheat',
          quantityKg: 2500,
          preferredDate: new Date().toISOString().split('T')[0],
          latitude: 29.6857,
          longitude: 76.9905
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const topRec = res.body.data[0];
      expect(topRec).toHaveProperty('score');
      expect(topRec).toHaveProperty('estimatedWaitMinutes');
      expect(topRec).toHaveProperty('estimatedServiceMinutes');
      expect(topRec).toHaveProperty('reasons');
      expect(topRec.reasons.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------
  // SECTION 3: SLOT & SCHEDULING API TESTS
  // -------------------------------------------------------------

  describe('Slot API Endpoints', () => {
    it('GET /api/v1/slots/availability should return slot windows for a centre', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/v1/slots/availability?centreId=${centreId}&slotDate=${today}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('POST /api/v1/slots/generate should generate slots for admin', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const res = await request(app)
        .post('/api/v1/slots/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          centreId,
          slotDate: tomorrow,
          cropTypeId: 'crop-001-wheat'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(8);
    });
  });

  // -------------------------------------------------------------
  // SECTION 4: BOOKING LIFECYCLE & RESCHEDULING TESTS
  // -------------------------------------------------------------

  describe('Booking Lifecycle', () => {
    let createdBookingId: string;
    let slotId: string;

    it('POST /api/v1/bookings should create a new slot booking', async () => {
      const today = new Date().toISOString().split('T')[0];
      const slots = await slotRepository.findSlotsByCentreAndDate(centreId, today);
      slotId = slots[0].id;

      const idempotencyKey = `idemp-${uuidv4()}`;

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .set('idempotency-key', idempotencyKey)
        .send({
          farmerId,
          centreId,
          slotId,
          cropTypeId: 'crop-001-wheat',
          declaredWeightKg: 1500
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingReferenceId).toMatch(/^BK-/);
      expect(res.body.data.status).toBe('CONFIRMED');
      createdBookingId = res.body.data.id;

      // Retry with same idempotency key
      const retryRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .set('idempotency-key', idempotencyKey)
        .send({
          farmerId,
          centreId,
          slotId,
          cropTypeId: 'crop-001-wheat',
          declaredWeightKg: 1500
        });

      expect(retryRes.status).toBe(201);
      expect(retryRes.body.data.id).toBe(createdBookingId);
    });

    it('POST /api/v1/bookings/:id/reschedule should reschedule booking to a new slot', async () => {
      const today = new Date().toISOString().split('T')[0];
      const slots = await slotRepository.findSlotsByCentreAndDate(centreId, today);
      const newSlotId = slots[1].id;

      const res = await request(app)
        .post(`/api/v1/bookings/${createdBookingId}/reschedule`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ newSlotId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slotId).toBe(newSlotId);
      expect(res.body.data.rescheduledCount).toBe(1);
    });

    it('POST /api/v1/bookings/:id/cancel should cancel booking and restore slot capacity', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${createdBookingId}/cancel`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ reason: 'Vehicle breakdown' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CANCELLED');
    });
  });

  // -------------------------------------------------------------
  // SECTION 5: MANDATORY CONCURRENCY & RACE CONDITION TESTS
  // -------------------------------------------------------------

  describe('Concurrency & Overbooking Protection Tests (Section 53)', () => {
    it('should prevent overbooking when 2 simultaneous requests compete for 1 remaining farmer slot', async () => {
      const customSlotId = `slot-concurrency-${uuidv4()}`;
      await slotRepository.saveSlot({
        id: customSlotId,
        centreId,
        cropTypeId: 'crop-001-wheat',
        slotDate: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        totalCapacity: 1,
        confirmedCount: 0,
        availableCapacity: 1, // Only 1 slot capacity left!
        maxQuantityKg: 50000,
        bookedQuantityKg: 0,
        availableQuantityKg: 50000,
        maxServiceMinutes: 300,
        bookedServiceMinutes: 0,
        availableServiceMinutes: 300,
        status: 'ACTIVE',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Send 2 simultaneous requests
      const reqA = slotRepository.atomicReserveCapacity(customSlotId, 1000, 20);
      const reqB = slotRepository.atomicReserveCapacity(customSlotId, 1000, 20);

      const [resA, resB] = await Promise.all([reqA, reqB]);

      // Exactly ONE request must succeed, and ONE must fail!
      const successes = [resA, resB].filter((r) => r.success);
      const failures = [resA, resB].filter((r) => !r.success);

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);

      // Verify slot available capacity is 0 and status is FULL
      const finalSlot = await slotRepository.findSlotById(customSlotId);
      expect(finalSlot?.availableCapacity).toBe(0);
      expect(finalSlot?.status).toBe('FULL');
    });

    it('should enforce quantity-based capacity limits during concurrent high-tonnage bookings', async () => {
      const customSlotId = `slot-tonnage-${uuidv4()}`;
      await slotRepository.saveSlot({
        id: customSlotId,
        centreId,
        cropTypeId: 'crop-001-wheat',
        slotDate: new Date().toISOString().split('T')[0],
        startTime: '11:00',
        endTime: '12:00',
        totalCapacity: 10,
        confirmedCount: 0,
        availableCapacity: 10,
        maxQuantityKg: 10000, // Max 10,000 KG capacity
        bookedQuantityKg: 0,
        availableQuantityKg: 10000,
        maxServiceMinutes: 300,
        bookedServiceMinutes: 0,
        availableServiceMinutes: 300,
        status: 'ACTIVE',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Send 2 simultaneous requests: Request A = 7,000 KG, Request B = 5,000 KG (Total 12,000 KG > 10,000 KG limit)
      const reqA = slotRepository.atomicReserveCapacity(customSlotId, 7000, 30);
      const reqB = slotRepository.atomicReserveCapacity(customSlotId, 5000, 25);

      const [resA, resB] = await Promise.all([reqA, reqB]);

      const successes = [resA, resB].filter((r) => r.success);
      const failures = [resA, resB].filter((r) => !r.success);

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);
    });
  });
});
