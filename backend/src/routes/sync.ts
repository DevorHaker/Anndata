import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { syncService } from '../services/sync/sync.service';

export const syncRouter = Router();

syncRouter.use(authenticate as any);

/**
 * POST /api/v1/sync
 * Synchronize batch of offline actions with server authority
 */
syncRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { deviceId, actions } = req.body;
    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ success: false, error: 'Invalid sync payload: actions array required' });
    }

    const response = await syncService.processSyncBatch({
      deviceId: deviceId || 'unknown-device',
      actions
    });

    res.json({
      success: true,
      data: response
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/sync/conflicts
 * List unresolved sync conflicts requiring review (Staff/Admin)
 */
syncRouter.get('/conflicts', authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN']) as any, async (req: Request, res: Response) => {
  try {
    const centreId = req.query.centreId as string | undefined;
    const conflicts = await syncService.getUnresolvedConflicts(centreId);
    res.json({
      success: true,
      data: conflicts
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/sync/conflicts/:id/resolve
 * Resolve a sync conflict (Staff/Admin)
 */
syncRouter.post('/conflicts/:id/resolve', authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN']) as any, async (req: Request, res: Response) => {
  try {
    const actorId = (req as any).user.id;
    const { resolutionAction } = req.body;

    if (!resolutionAction) {
      return res.status(400).json({ success: false, error: 'resolutionAction is required' });
    }

    const resolved = await syncService.resolveConflict(req.params.id, resolutionAction, actorId);
    if (!resolved) {
      return res.status(404).json({ success: false, error: 'Conflict record not found' });
    }

    res.json({
      success: true,
      data: resolved
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/sync/status
 * Get offline sync metrics (Admin/Staff)
 */
syncRouter.get('/status', authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN']) as any, async (req: Request, res: Response) => {
  try {
    const metrics = await syncService.getSyncMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
