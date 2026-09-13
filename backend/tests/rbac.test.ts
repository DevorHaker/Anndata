import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('RBAC & Authorization Integration Tests (Phase 5)', () => {
  let farmerToken = '';
  let adminToken = '';

  beforeAll(async () => {
    // Register Farmer account
    const farmerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        mobileNumber: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'FarmerPassword123!',
        roleCode: 'FARMER'
      });
    farmerToken = farmerRes.body.data.tokens.accessToken;

    // Register Admin account
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        mobileNumber: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'AdminPassword123!',
        roleCode: 'SYSTEM_ADMIN'
      });
    adminToken = adminRes.body.data.tokens.accessToken;
  });

  it('should deny Farmer from accessing Admin User Management list', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${farmerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('should allow System Admin to access Admin User Management list', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
