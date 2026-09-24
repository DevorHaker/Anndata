import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { mandiTelemetrySettlementService } from '../services/mandiTelemetrySettlement.service';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

export const mandiTelemetryRouter = Router();

const checkInSchema = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
  bookingRef: z.string().min(1, 'bookingRef is required'),
  scannedQrToken: z.string().min(1, 'scannedQrToken is required'),
  anprLicensePlate: z.string().min(1, 'anprLicensePlate is required'),
  registeredVehicleNumber: z.string().min(1, 'registeredVehicleNumber is required')
});

const grossWeightSchema = z.object({
  telemetrySessionId: z.string().min(1, 'telemetrySessionId is required'),
  modbusSerialPort: z.string().optional().default('RS-232-COM1 (Modbus Anti-Tamper)'),
  grossWeightKg: z.number().positive('grossWeightKg must be positive')
});

const faqQualitySchema = z.object({
  telemetrySessionId: z.string().min(1, 'telemetrySessionId is required'),
  moistureContentPct: z.number().nonnegative(),
  foreignMatterPct: z.number().nonnegative(),
  damagedGrainsPct: z.number().nonnegative()
});

const tareWeightSchema = z.object({
  telemetrySessionId: z.string().min(1, 'telemetrySessionId is required'),
  modbusSerialPort: z.string().optional().default('RS-232-COM1 (Modbus Anti-Tamper)'),
  tareWeightKg: z.number().nonnegative()
});

/**
 * POST /api/v1/mandi-telemetry/gate-checkin
 * Step 1-4: Gate Security Scanning & ANPR Camera Cross-Match
 */
mandiTelemetryRouter.post(
  '/gate-checkin',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = checkInSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid gate check-in parameters', 'VALIDATION_ERROR', parsed.error.issues);
      }
      const session = await mandiTelemetrySettlementService.processGateCheckIn(parsed.data);
      res.status(200).json({
        success: true,
        data: session,
        message: session.gateCheckInStatus === 'PASSED'
          ? 'Gate Check-In & ANPR License Plate matched! Proceed to Gross Weighbridge.'
          : 'ANPR / Token verification failed. Vehicle rerouted to Helpdesk.'
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/mandi-telemetry/gross-weighing
 * Step 5: RS-232 Modbus Telemetry Gross Weight Capture
 */
mandiTelemetryRouter.post(
  '/gross-weighing',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = grossWeightSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid gross weight parameters', 'VALIDATION_ERROR', parsed.error.issues);
      }
      const session = await mandiTelemetrySettlementService.captureGrossWeight(parsed.data);
      res.status(200).json({
        success: true,
        data: session,
        message: `Gross weight ${session.grossWeightKg} kg ingested via ${session.telemetryBusAddress}. Proceed to FAQ Quality Grading.`
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/mandi-telemetry/faq-grading
 * Step 6-7: FAQ Quality Assessment & Redirection check
 */
mandiTelemetryRouter.post(
  '/faq-grading',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = faqQualitySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid FAQ quality parameters', 'VALIDATION_ERROR', parsed.error.issues);
      }
      const session = await mandiTelemetrySettlementService.assessFaqQuality(parsed.data);
      res.status(200).json({
        success: true,
        data: session,
        message: session.faqStatus === 'PASSED'
          ? `FAQ Passed! Holding Bay: ${session.holdingBayNumber}, Staging Area: ${session.gunnyStagingArea}`
          : `FAQ Failed! Vehicle redirected to Secondary Drying Bay.`
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/mandi-telemetry/tare-weighing
 * Step 8-10: Tare Weight Ingestion, Net Weight Calculation & Auto J-Form / PFMS DBT Trigger
 */
mandiTelemetryRouter.post(
  '/tare-weighing',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = tareWeightSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid tare weight parameters', 'VALIDATION_ERROR', parsed.error.issues);
      }
      const session = await mandiTelemetrySettlementService.captureTareWeight(parsed.data);
      res.status(200).json({
        success: true,
        data: session,
        message: `Tare weight ${session.tareWeightKg} kg logged. Net weight: ${session.netWeightKg} kg. Digital J-Form & PFMS DBT triggered!`
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/mandi-telemetry/session/:id
 * Retrieve Telemetry & Settlement Pipeline session
 */
mandiTelemetryRouter.get(
  '/session/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = mandiTelemetrySettlementService.getSession(req.params.id);
      if (!session) {
        res.status(404).json({ success: false, message: 'Telemetry session not found.' });
        return;
      }
      res.status(200).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }
);
