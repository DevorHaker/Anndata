import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validateRequest } from '../middleware/validation';
import { centreDomainService } from '../services/centreDomain.service';
import {
  createCentreSchema,
  updateCentreStatusSchema,
  updateCapacitySchema,
  createDisruptionSchema,
  updateDisruptionStatusSchema,
  assignStaffSchema
} from '../validators/farmer.validator';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/centres
 * Search & filter procurement centres with pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const result = await centreDomainService.listCentres({
      page,
      pageSize,
      district: req.query.district as string,
      state: req.query.state as string,
      status: req.query.status as string,
      search: req.query.search as string
    });
    return res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/centres
 * Register a new procurement centre (Admin only)
 */
router.post(
  '/',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN']),
  validateRequest(createCentreSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const centre = await centreDomainService.createCentre(req.body, {
        userId: user.sub,
        role: user.role,
        ipAddress: req.ip
      });
      return res.status(201).json({
        success: true,
        message: 'Procurement centre registered successfully',
        data: centre
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/centres/:id
 * Get procurement centre details
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const centre = await centreDomainService.getCentreDetails(req.params.id);
    return res.status(200).json({
      success: true,
      data: centre
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/centres/:id/status
 * Update centre operational status (NORMAL, BUSY, CONGESTED, CRITICAL, CLOSED, etc.)
 */
router.patch(
  '/:id/status',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN', 'CENTRE_MANAGER']),
  validateRequest(updateCentreStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const updated = await centreDomainService.updateCentreStatus(req.params.id, req.body.status, req.body.reason, {
        userId: user.sub,
        role: user.role,
        ipAddress: req.ip
      });
      return res.status(200).json({
        success: true,
        message: `Centre operational status updated to ${req.body.status}`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/centres/:id/capacity
 * Retrieve capacity configuration
 */
router.get('/:id/capacity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const capacity = await centreDomainService.getCapacity(req.params.id);
    return res.status(200).json({
      success: true,
      data: capacity
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/centres/:id/capacity
 * Update capacity configuration (Admin or Centre Manager)
 */
router.patch(
  '/:id/capacity',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN', 'CENTRE_MANAGER']),
  validateRequest(updateCapacitySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const updated = await centreDomainService.updateCapacity(req.params.id, req.body, {
        userId: user.sub,
        role: user.role,
        ipAddress: req.ip
      });
      return res.status(200).json({
        success: true,
        message: 'Centre capacity configuration updated',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/centres/:id/disruptions
 * List operational disruptions
 */
router.get('/:id/disruptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const disruptions = await centreDomainService.listDisruptions(req.params.id);
    return res.status(200).json({
      success: true,
      data: disruptions
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/centres/:id/disruptions
 * Report a new operational disruption
 */
router.post(
  '/:id/disruptions',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN', 'CENTRE_MANAGER', 'PROCUREMENT_OFFICER']),
  validateRequest(createDisruptionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const disruption = await centreDomainService.createDisruption(
        req.params.id,
        {
          ...req.body,
          expectedEndTime: req.body.expectedEndTime ? new Date(req.body.expectedEndTime) : undefined
        },
        {
          userId: user.sub,
          role: user.role,
          ipAddress: req.ip
        }
      );
      return res.status(201).json({
        success: true,
        message: 'Operational disruption reported',
        data: disruption
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/centres/:id/disruptions/:disruptionId
 * Update disruption status (Acknowledged, Mitigating, Resolved, Cancelled)
 */
router.patch(
  '/:id/disruptions/:disruptionId',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN', 'CENTRE_MANAGER', 'PROCUREMENT_OFFICER']),
  validateRequest(updateDisruptionStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const updated = await centreDomainService.updateDisruptionStatus(
        req.params.disruptionId,
        req.body.status,
        req.body.resolutionNotes,
        {
          userId: user.sub,
          role: user.role,
          ipAddress: req.ip
        }
      );
      return res.status(200).json({
        success: true,
        message: `Disruption status updated to ${req.body.status}`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/centres/:id/staff
 * List assigned staff for centre
 */
router.get('/:id/staff', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await centreDomainService.getStaff(req.params.id);
    return res.status(200).json({
      success: true,
      data: staff
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/centres/:id/staff
 * Assign staff member to centre
 */
router.post(
  '/:id/staff',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN', 'CENTRE_MANAGER']),
  validateRequest(assignStaffSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const assignment = await centreDomainService.assignStaff(req.params.id, req.body.userId, req.body.role, {
        userId: user.sub,
        role: user.role
      });
      return res.status(201).json({
        success: true,
        message: 'Staff assigned to procurement centre',
        data: assignment
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
