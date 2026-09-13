import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { procurementService } from '../services/procurement.service';

export const procurementsRouter = Router();

// Protect all procurement endpoints with authentication
procurementsRouter.use(authenticate);

/**
 * POST /api/v1/procurements/start
 * Initiate procurement session from queue / booking
 */
procurementsRouter.post(
  '/start',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user || {};
      const { bookingId } = req.body;
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: 'bookingId is required.' }
        });
      }

      const officerId = user.sub || user.id || 'officer-001';
      const officerCentreId = user.assignedCentreId || req.body.centreId || '33333333-3333-4000-8000-333333333333';

      const procurement = await procurementService.startSession({
        bookingId,
        officerId,
        officerCentreId
      });

      return res.status(201).json({
        success: true,
        message: 'Procurement session initiated successfully.',
        data: procurement
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/procurements
 * Staff procurement workspace & search listing
 */
procurementsRouter.get(
  '/',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user || {};
      const centreId = (req.query.centreId as string) || user.assignedCentreId || undefined;
      const farmerId = (req.query.farmerId as string) || undefined;
      const status = (req.query.status as any) || undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const result = await procurementService.listProcurements({
        centreId,
        farmerId,
        status,
        limit,
        offset
      });

      return res.status(200).json({
        success: true,
        message: 'Procurement records retrieved.',
        data: result.data,
        meta: { total: result.total, limit, offset }
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/procurements/farmer
 * Farmer procurement status & history
 */
procurementsRouter.get('/farmer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user || {};
    const farmerId = user.farmerProfileId || user.sub || user.id || 'farmer-001';
    const result = await procurementService.listProcurements({
      farmerId,
      limit: 20
    });

    return res.status(200).json({
      success: true,
      message: 'Farmer procurement history retrieved.',
      data: result.data
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/procurements/:id
 * Fetch detailed procurement session with weighment & quality details
 */
procurementsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const details = await procurementService.getProcurementById(id);
    return res.status(200).json({
      success: true,
      data: details
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/procurements/:id/intake
 * Record produce intake receipt
 */
procurementsRouter.post(
  '/:id/intake',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user || {};
      const { id } = req.params;
      const officerCentreId = user.assignedCentreId || req.body.centreId || '33333333-3333-4000-8000-333333333333';

      const record = await procurementService.confirmIntake(id, officerCentreId);
      return res.status(200).json({
        success: true,
        message: 'Produce intake confirmed successfully.',
        data: record
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/procurements/:id/calculate-value
 * Calculate authoritative rate and payable value
 */
procurementsRouter.post(
  '/:id/calculate-value',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user || {};
      const { id } = req.params;
      const officerCentreId = user.assignedCentreId || req.body.centreId || '33333333-3333-4000-8000-333333333333';

      const record = await procurementService.calculateValue(id, officerCentreId);
      return res.status(200).json({
        success: true,
        message: 'Procurement value calculated successfully.',
        data: record
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/procurements/:id/finalize
 * Finalize procurement transaction (COMPLETED, payment-ready)
 */
procurementsRouter.post(
  '/:id/finalize',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user || {};
      const { id } = req.params;
      const officerId = user.sub || user.id || 'officer-001';
      const officerCentreId = user.assignedCentreId || req.body.centreId || '33333333-3333-4000-8000-333333333333';

      const record = await procurementService.finalizeProcurement(id, officerId, officerCentreId);
      return res.status(200).json({
        success: true,
        message: 'Procurement finalized successfully and marked payment-ready.',
        data: record
      });
    } catch (err) {
      next(err);
    }
  }
);
