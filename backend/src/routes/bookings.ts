import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { bookingService } from '../services/booking.service';
import { landRecordsService } from '../services/landRecords.service';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';
import { BookingStatus } from '../types/scheduling';

export const bookingsRouter = Router();

const createBookingSchema = z.object({
  farmerId: z.string().min(1, 'farmerId is required'),
  centreId: z.string().min(1, 'centreId is required'),
  slotId: z.string().min(1, 'slotId is required'),
  cropTypeId: z.string().min(1, 'cropTypeId is required'),
  declaredWeightKg: z.number().positive('declaredWeightKg must be greater than zero'),
  vehicleNumber: z.string().optional(),
  vehicleType: z.string().optional(),
  idempotencyKey: z.string().optional().nullable()
});

/**
 * GET /api/v1/bookings/land-record-quota
 * Verify Bhulekh Land Record and fetch Anti-Hoarding Quota Cap
 */
bookingsRouter.get(
  '/land-record-quota',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const farmerId = (req.query.farmerId as string) || (req as any).user.sub;
      const cropTypeId = (req.query.cropTypeId as string) || 'crop-paddy-a';

      const landRecord = await landRecordsService.verifyFarmerLandRecords(farmerId, cropTypeId);

      res.status(200).json({
        success: true,
        data: landRecord,
        message: 'Bhulekh Land Records verified and Anti-Hoarding Quota Cap computed.'
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/bookings
 * Concurrency-safe slot reservation
 */
bookingsRouter.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const idempotencyHeader = req.headers['idempotency-key'] as string | undefined;
      const parsed = createBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid booking request parameters', 'VALIDATION_ERROR', parsed.error.issues);
      }

      const idempotencyKey = parsed.data.idempotencyKey || idempotencyHeader || null;

      const booking = await bookingService.createBooking(
        {
          ...parsed.data,
          idempotencyKey
        },
        user.sub,
        user.role
      );

      res.status(201).json({
        success: true,
        data: booking
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/bookings
 * Query bookings by farmer or centre
 */
bookingsRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const farmerId = req.query.farmerId as string | undefined;
      const centreId = req.query.centreId as string | undefined;
      const status = req.query.status as BookingStatus | undefined;

      let bookings = [];
      if (farmerId) {
        bookings = await bookingService.getFarmerBookings(farmerId);
      } else if (centreId) {
        bookings = await bookingService.getCentreBookings(centreId, status);
      } else if (user?.role === 'FARMER') {
        bookings = await bookingService.getFarmerBookings(user.farmerId || user.sub);
      } else {
        throw new ValidationError('Please specify farmerId or centreId query parameter.');
      }

      res.status(200).json({
        success: true,
        data: bookings,
        count: bookings.length
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/bookings/:id
 * Get single booking details
 */
bookingsRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await bookingService.getBookingById(req.params.id);
      res.status(200).json({
        success: true,
        data: booking
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/bookings/:id/cancel
 * Cancel booking and release capacity
 */
bookingsRouter.post(
  '/:id/cancel',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const reason = req.body?.reason || 'Cancelled by user';
      const cancelled = await bookingService.cancelBooking(
        req.params.id,
        user.sub,
        user.role,
        reason
      );

      res.status(200).json({
        success: true,
        data: cancelled,
        message: 'Booking cancelled successfully and capacity restored.'
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/bookings/:id/reschedule
 * Reschedule booking to a new slot window
 */
bookingsRouter.post(
  '/:id/reschedule',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const schema = z.object({
        newSlotId: z.string().min(1, 'newSlotId is required')
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid reschedule request', 'VALIDATION_ERROR', parsed.error.issues);
      }

      const rescheduled = await bookingService.rescheduleBooking(
        req.params.id,
        parsed.data.newSlotId,
        user.sub,
        user.role
      );

      res.status(200).json({
        success: true,
        data: rescheduled,
        message: 'Booking rescheduled successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/bookings/:id/approve
 * Approve booking / procurement slot request by Centre Manager
 */
bookingsRouter.post(
  '/:id/approve',
  authenticate,
  authorizeRole(['CENTRE_MANAGER', 'PROCUREMENT_OFFICER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const approved = await bookingService.approveBooking(
        req.params.id,
        user.sub || user.id,
        user.role
      );

      res.status(200).json({
        success: true,
        data: approved,
        message: 'Procurement slot request approved successfully and notification sent to farmer.'
      });
    } catch (err) {
      next(err);
    }
  }
);
