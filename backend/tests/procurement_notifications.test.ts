import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { notificationService } from '../src/services/notification/notification.service';
import { notificationRepository } from '../src/repositories/notification.repository';
import { bookingRepository } from '../src/repositories/booking.repository';
import { slotRepository } from '../src/repositories/slot.repository';
import { v4 as uuidv4 } from 'uuid';

describe('Procurement Request & Approval Notifications Test Suite', () => {
  const farmerMobile = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;
  const managerMobile = `+9196${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testPassword = 'SecurePassword123!';

  let farmerToken: string = '';
  let farmerId: string = '';
  let farmerUserId: string = '';
  let managerToken: string = '';
  let managerUserId: string = '';

  const centreId = '33333333-3333-4000-8000-333333333333';
  let slotId: string = '';

  beforeAll(async () => {
    // 1. Register Farmer
    const resFarmer = await request(app).post('/api/v1/auth/register').send({
      mobileNumber: farmerMobile,
      password: testPassword,
      roleCode: 'FARMER',
      firstName: 'Ramesh',
      lastName: 'Kumar'
    });
    farmerToken = resFarmer.body.data.tokens.accessToken;
    farmerUserId = resFarmer.body.data.user.id;
    farmerId = resFarmer.body.data.user.farmerId || 'frm-demo-001';

    // 2. Register Centre Manager
    const resManager = await request(app).post('/api/v1/auth/register').send({
      mobileNumber: managerMobile,
      password: testPassword,
      roleCode: 'CENTRE_MANAGER',
      firstName: 'Suresh',
      lastName: 'Verma'
    });
    managerToken = resManager.body.data.tokens.accessToken;
    managerUserId = resManager.body.data.user.id;

    // 3. Create active slot for centre
    slotId = `slot-notif-${uuidv4()}`;
    await slotRepository.saveSlot({
      id: slotId,
      centreId,
      cropTypeId: 'crop-paddy-a',
      slotDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '11:00',
      totalCapacity: 10,
      confirmedCount: 0,
      availableCapacity: 10,
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
  });

  it('1. Should notify Centre Manager when farmer submits a procurement request', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        farmerId,
        centreId,
        slotId,
        cropTypeId: 'Paddy (Grade A)',
        declaredWeightKg: 8000
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const bookingRef = res.body.data.bookingReferenceId;

    // Retrieve Centre Manager's notification inbox
    const managerNotifs = await notificationService.getUserNotifications('10000000-0000-4000-8000-000000000003');
    expect(managerNotifs.length).toBeGreaterThan(0);

    const procurementNotif = managerNotifs.find((n) => n.title.includes('Procurement Request') || n.message.includes(bookingRef));
    expect(procurementNotif).toBeDefined();
    expect(procurementNotif?.message).toContain(bookingRef);
  }, 20000);

  it('2. Should notify Farmer when Centre Manager approves the procurement request', async () => {
    const bookingId = `bk-test-approve-${uuidv4()}`;
    const bookingRef = `BK-20260924-APPR`;

    await bookingRepository.createBooking(
      {
        id: bookingId,
        bookingReferenceId: bookingRef,
        farmerId,
        centreId,
        slotId,
        cropTypeId: 'Paddy (Grade A)',
        declaredWeightKg: 8000,
        estimatedServiceMinutes: 35,
        scheduledDate: new Date().toISOString().split('T')[0],
        startTime: '09:00 AM',
        endTime: '11:00 AM',
        status: 'PENDING',
        idempotencyKey: null,
        cancellationReason: null,
        rescheduledFromId: null,
        rescheduledCount: 0,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      farmerUserId,
      'FARMER'
    );

    // Centre Manager approves request
    const approveRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.status).toBe('CONFIRMED');

    // Retrieve Farmer's notification inbox
    const farmerNotifs = await notificationService.getUserNotifications(farmerUserId);
    const approvalNotif = farmerNotifs.find((n) => n.title.includes('Approved') || n.message.includes(bookingRef));
    expect(approvalNotif).toBeDefined();
    expect(approvalNotif?.message).toContain(bookingRef);
  }, 20000);
});
