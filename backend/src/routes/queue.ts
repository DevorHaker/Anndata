import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { queueService } from '../services/queue.service';

export const queueRouter = Router();

queueRouter.use(authenticate);

/**
 * GET /api/v1/queue/snapshot
 * Get current operational queue snapshot for a procurement centre
 */
queueRouter.get('/snapshot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const centreId = req.query.centreId as string;
    if (!centreId) {
      res.status(400).json({ success: false, message: 'Query parameter centreId is required.' });
      return;
    }

    const snapshot = await queueService.getQueueSnapshot(centreId);
    res.status(200).json({
      success: true,
      data: snapshot
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/queue/farmer
 * Get live queue status, position, and wait time for a farmer
 */
queueRouter.get('/farmer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const farmerId = user.sub;
    const bookingId = req.query.bookingId as string;

    if (!bookingId) {
      res.status(400).json({ success: false, message: 'Query parameter bookingId is required.' });
      return;
    }

    const status = await queueService.getFarmerQueueStatus(farmerId, bookingId);
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/queue/call-next
 * Staff action to call next WAITING token
 */
queueRouter.post(
  '/call-next',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { centreId, stationId } = req.body;
      const actorId = user.sub;
      const actorRole = user.role || user.roleCode || 'PROCUREMENT_OFFICER';

      const called = await queueService.callNextToken(
        centreId,
        stationId || 'COUNTER_1',
        actorId,
        actorRole
      );

      res.status(200).json({
        success: true,
        message: `Token '${called.tokenCode}' called successfully.`,
        data: called
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/queue/:id/serve
 * Staff action to start service for a token
 */
queueRouter.post(
  '/:id/serve',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const queueEntryId = req.params.id;
      const { stationId } = req.body;
      const actorId = user.sub;
      const actorRole = user.role || user.roleCode || 'PROCUREMENT_OFFICER';

      const updated = await queueService.startService(
        queueEntryId,
        stationId || 'COUNTER_1',
        actorId,
        actorRole
      );

      res.status(200).json({
        success: true,
        message: 'Service started for token.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/queue/:id/complete
 * Staff action to complete queue service step
 */
queueRouter.post(
  '/:id/complete',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const queueEntryId = req.params.id;
      const actorId = user.sub;
      const actorRole = user.role || user.roleCode || 'PROCUREMENT_OFFICER';

      const updated = await queueService.completeQueueService(queueEntryId, actorId, actorRole);

      res.status(200).json({
        success: true,
        message: 'Queue service completed for token.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/queue/:id/skip
 * Staff action to skip a token
 */
queueRouter.post(
  '/:id/skip',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const queueEntryId = req.params.id;
      const { reason } = req.body;
      const actorId = user.sub;
      const actorRole = user.role || user.roleCode || 'PROCUREMENT_OFFICER';

      const updated = await queueService.skipToken(queueEntryId, reason, actorId, actorRole);

      res.status(200).json({
        success: true,
        message: 'Token skipped.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/queue/:id/recall
 * Staff action to recall a skipped token
 */
queueRouter.post(
  '/:id/recall',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const queueEntryId = req.params.id;
      const actorId = user.sub;
      const actorRole = user.role || user.roleCode || 'PROCUREMENT_OFFICER';

      const updated = await queueService.recallToken(queueEntryId, actorId, actorRole);

      res.status(200).json({
        success: true,
        message: 'Token recalled to waiting queue.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/queue/pause
 * Staff action to pause queue operations
 */
queueRouter.post(
  '/pause',
  authorizeRole(['CENTRE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { centreId, reason } = req.body;
      const actorId = user.sub;
      const actorRole = user.role || user.roleCode || 'CENTRE_MANAGER';

      const result = await queueService.pauseQueue(centreId, reason, actorId, actorRole);

      res.status(200).json({
        success: true,
        message: 'Queue operations PAUSED.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/queue/resume
 * Staff action to resume queue operations
 */
queueRouter.post(
  '/resume',
  authorizeRole(['CENTRE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { centreId } = req.body;
      const actorId = user.sub;
      const actorRole = user.role || user.roleCode || 'CENTRE_MANAGER';

      const result = await queueService.resumeQueue(centreId, actorId, actorRole);

      res.status(200).json({
        success: true,
        message: 'Queue operations RESUMED.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
);
