import { Router, Request, Response, NextFunction } from 'express';
import { traceabilityService } from '../services/traceability.service';
import { authenticate } from '../middleware/authenticate';

export const traceabilityRouter = Router();

/**
 * GET /api/v1/traceability/:identifier - Unified End-to-End Traceability Timeline
 */
traceabilityRouter.get(
  '/:identifier',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeline = await traceabilityService.getEndToEndTimeline(req.params.identifier);
      res.json({
        success: true,
        data: timeline
      });
    } catch (err) {
      next(err);
    }
  }
);
