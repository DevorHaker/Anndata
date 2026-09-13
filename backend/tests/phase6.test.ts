import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Phase 6: Farmer & Procurement Centre Management Integration Tests', () => {
  const farmerMobile = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
  const adminMobile = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testPassword = 'SecurePassword123!';

  let farmerToken = '';
  let farmerId = '';
  let adminToken = '';
  let centreId = '';
  let cropTypeId = '';
  let disruptionId = '';

  beforeAll(async () => {
    // 1. Register Farmer
    const farmerReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        mobileNumber: farmerMobile,
        password: testPassword,
        roleCode: 'FARMER',
        firstName: 'Gurdeep',
        lastName: 'Singh'
      });
    farmerToken = farmerReg.body.data.tokens.accessToken;
    farmerId = farmerReg.body.data.user.farmerId;

    // 2. Register Admin
    const adminReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        mobileNumber: adminMobile,
        password: testPassword,
        roleCode: 'SYSTEM_ADMIN',
        firstName: 'Admin',
        lastName: 'User'
      });
    adminToken = adminReg.body.data.tokens.accessToken;
  });

  describe('Farmer Profile & Produce Operations', () => {
    it('should fetch own farmer profile via GET /api/v1/farmers/me', async () => {
      const res = await request(app)
        .get('/api/v1/farmers/me')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(farmerId);
      expect(res.body.data.firstName).toBe('Gurdeep');
    });

    it('should update own farmer profile via PATCH /api/v1/farmers/me', async () => {
      const res = await request(app)
        .patch('/api/v1/farmers/me')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          profile: {
            villageName: 'Kachhwa',
            subDistrict: 'Karnal Tehsil',
            district: 'Karnal',
            state: 'Haryana',
            pincode: '132001',
            landHoldingAcres: 12.5
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.district).toBe('Karnal');
      expect(res.body.data.profile.landHoldingAcres).toBe(12.5);
    });

    it('should fetch crop master data via GET /api/v1/produce/crops', async () => {
      const res = await request(app)
        .get('/api/v1/produce/crops')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      cropTypeId = res.body.data[0].id;
    });

    it('should declare farmer produce via POST /api/v1/farmers/me/produce', async () => {
      const res = await request(app)
        .post('/api/v1/farmers/me/produce')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          cropTypeId,
          harvestSeason: 'RABI_2026',
          estimatedYieldKg: 15000,
          declaredQuantityKg: 10000
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.declaredQuantityKg).toBe(10000);
    });

    it('should list declared produce via GET /api/v1/farmers/me/produce', async () => {
      const res = await request(app)
        .get('/api/v1/farmers/me/produce')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('Procurement Centre Operations', () => {
    const centreCode = `PC-TEST-${Math.floor(1000 + Math.random() * 9000)}`;

    it('should register a new procurement centre as Admin', async () => {
      const res = await request(app)
        .post('/api/v1/centres')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          centreCode,
          name: 'Nilokheri Grain Procurement Centre',
          district: 'Karnal',
          subDistrict: 'Nilokheri',
          state: 'Haryana',
          pincode: '132117',
          addressText: 'Mandi Area, Nilokheri, Karnal',
          latitude: 29.8333,
          longitude: 76.9167
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      centreId = res.body.data.id;
    });

    it('should prevent registering centre with duplicate code', async () => {
      const res = await request(app)
        .post('/api/v1/centres')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          centreCode,
          name: 'Duplicate Centre Test',
          district: 'Karnal',
          subDistrict: 'Nilokheri',
          state: 'Haryana',
          pincode: '132117',
          addressText: 'Mandi Area, Nilokheri, Karnal',
          latitude: 29.8333,
          longitude: 76.9167
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_CENTRE_CODE');
    });

    it('should list centres with district filter', async () => {
      const res = await request(app)
        .get('/api/v1/centres?district=Karnal')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should update centre operational status', async () => {
      const res = await request(app)
        .patch(`/api/v1/centres/${centreId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'BUSY',
          reason: 'High morning token influx'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('BUSY');
    });

    it('should configure centre capacity', async () => {
      const res = await request(app)
        .patch(`/api/v1/centres/${centreId}/capacity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dailyFarmerCapacity: 150,
          dailyQuantityCapacityKg: 75000,
          hourlyThroughputKg: 8000,
          weighingStationCount: 3
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dailyFarmerCapacity).toBe(150);
    });

    it('should report an operational disruption', async () => {
      const res = await request(app)
        .post(`/api/v1/centres/${centreId}/disruptions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          disruptionType: 'EQUIPMENT_FAILURE',
          severity: 'HIGH',
          title: 'Weighbridge Sensor Fault',
          description: 'Electronic sensor malfunction on Station 2'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('OPEN');
      disruptionId = res.body.data.id;
    });

    it('should resolve the disruption', async () => {
      const res = await request(app)
        .patch(`/api/v1/centres/${centreId}/disruptions/${disruptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESOLVED',
          resolutionNotes: 'Sensor recalibrated by technician'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RESOLVED');
    });
  });

  describe('RBAC & Security Scopes', () => {
    it('should reject farmer attempting to update another farmer profile', async () => {
      const res = await request(app)
        .patch('/api/v1/farmers/11111111-1111-4000-8000-111111111111')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          firstName: 'Hacked'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_SCOPE');
    });

    it('should reject non-admin registering procurement centre', async () => {
      const res = await request(app)
        .post('/api/v1/centres')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          centreCode: 'PC-UNAUTH-01',
          name: 'Unauthorized Centre',
          district: 'Karnal',
          subDistrict: 'Karnal',
          state: 'Haryana',
          pincode: '132001',
          addressText: 'Somewhere',
          latitude: 29.1,
          longitude: 76.1
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });
  });
});
