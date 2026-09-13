import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Auth API Integration Tests (Phase 5)', () => {
  const testMobile = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testPassword = 'SecurePassword123!';
  let accessToken = '';
  let refreshToken = '';

  it('should reject registration with invalid mobile format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        mobileNumber: '123',
        password: testPassword
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should successfully register a new Farmer account', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        mobileNumber: testMobile,
        password: testPassword,
        roleCode: 'FARMER',
        firstName: 'Test',
        lastName: 'Farmer'
      });

    if (res.status !== 201) console.log('REGISTER ERROR LOG:', res.body);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.role).toBe('FARMER');
    expect(res.body.data.user.farmerId).toBeDefined();
    expect(res.body.data.tokens.accessToken).toBeDefined();

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('should reject registration with duplicate mobile number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        mobileNumber: testMobile,
        password: testPassword
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_MOBILE');
  });

  it('should authenticate user with valid credentials via POST /api/v1/auth/login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        mobileNumber: testMobile,
        password: testPassword
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        mobileNumber: testMobile,
        password: 'WrongPassword999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should request and verify OTP successfully', async () => {
    const otpReq = await request(app)
      .post('/api/v1/auth/otp/request')
      .send({ mobileNumber: testMobile });

    expect(otpReq.status).toBe(200);
    expect(otpReq.body.success).toBe(true);

    const otpVerify = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({
        mobileNumber: testMobile,
        otp: '123456' // Dev test static OTP
      });

    expect(otpVerify.status).toBe(200);
    expect(otpVerify.body.data.tokens.accessToken).toBeDefined();
  });

  it('should fetch current authenticated user profile via GET /api/v1/auth/me', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.mobileNumber).toBe(testMobile);
    expect(res.body.data.role).toBe('FARMER');
  });

  it('should reject GET /api/v1/auth/me without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should support token refresh via POST /api/v1/auth/refresh', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should successfully logout via POST /api/v1/auth/logout', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
