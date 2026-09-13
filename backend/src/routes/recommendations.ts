import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { recommendationEngine } from '../services/recommendation/RecommendationEngine';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

export const recommendationsRouter = Router();

const recommendationRequestSchema = z.object({
  farmerId: z.string().optional(),
  cropTypeId: z.string().min(1, 'cropTypeId is required'),
  quantityKg: z.number().positive('quantityKg must be greater than zero'),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'preferredDate must be YYYY-MM-DD format'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  district: z.string().optional().nullable(),
  maxDistanceKm: z.number().optional()
});

/**
 * POST /api/v1/recommendations
 * Calculate intelligent farmer-to-centre recommendations with explainable scoring
 */
recommendationsRouter.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const parsed = recommendationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid recommendation request parameters', 'VALIDATION_ERROR', parsed.error.issues);
      }

      let farmerId = parsed.data.farmerId;
      if (!farmerId && user?.role === 'FARMER') {
        farmerId = user.farmerId || user.sub;
      }

      const recommendations = await recommendationEngine.getRecommendations({
        ...parsed.data,
        farmerId
      });

      res.status(200).json({
        success: true,
        data: recommendations,
        count: recommendations.length
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/recommendations/centres
 * Quick candidate centre list with real-time operational status
 */
recommendationsRouter.get(
  '/centres',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const preferredDate = (req.query.preferredDate as string) || new Date().toISOString().split('T')[0];
      const cropTypeId = (req.query.cropTypeId as string) || 'crop-001-wheat';
      const quantityKg = Number(req.query.quantityKg) || 1000;

      const recommendations = await recommendationEngine.getRecommendations({
        cropTypeId,
        quantityKg,
        preferredDate
      });

      res.status(200).json({
        success: true,
        data: recommendations
      });
    } catch (err) {
      next(err);
    }
  }
);
