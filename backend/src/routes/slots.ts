import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { slotService } from '../services/slot.service';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';
import { SlotStatus } from '../types/scheduling';

export const slotsRouter = Router();

/**
 * GET /api/v1/slots/availability
 * Query slot windows and remaining capacity for a centre on a date
 */
slotsRouter.get(
  '/availability',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const centreId = req.query.centreId as string;
      const slotDate = (req.query.slotDate as string) || new Date().toISOString().split('T')[0];
      const cropTypeId = req.query.cropTypeId as string | undefined;

      if (!centreId) {
        throw new ValidationError('centreId query parameter is required');
      }

      const slots = await slotService.getSlotAvailability(centreId, slotDate, cropTypeId);

      res.status(200).json({
        success: true,
        data: slots,
        count: slots.length
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/slots/:id
 * Slot details
 */
slotsRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slot = await slotService.getSlotById(req.params.id);
      res.status(200).json({
        success: true,
        data: slot
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/slots/generate
 * Generate slot windows for a centre (Admin / Manager role)
 */
slotsRouter.post(
  '/generate',
  authenticate,
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN', 'CENTRE_MANAGER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const schema = z.object({
        centreId: z.string().min(1, 'centreId is required'),
        slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'slotDate must be YYYY-MM-DD'),
        cropTypeId: z.string().min(1, 'cropTypeId is required')
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid slot generation request', 'VALIDATION_ERROR', parsed.error.issues);
      }

      const slots = await slotService.generateSlotsForCentre(
        parsed.data.centreId,
        parsed.data.slotDate,
        parsed.data.cropTypeId,
        user.sub,
        user.role
      );

      res.status(201).json({
        success: true,
        data: slots,
        count: slots.length
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/slots/:id
 * Update slot status (e.g. BLOCK, CLOSE, ACTIVE)
 */
slotsRouter.patch(
  '/:id',
  authenticate,
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN', 'CENTRE_MANAGER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const schema = z.object({
        status: z.enum(['ACTIVE', 'FULL', 'CANCELLED', 'CLOSED'])
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid slot status update', 'VALIDATION_ERROR', parsed.error.issues);
      }

      const updated = await slotService.updateSlotStatus(
        req.params.id,
        parsed.data.status as SlotStatus,
        user.sub,
        user.role
      );

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);
