import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { procurementService } from '../services/procurement.service';
import { qualityRepository } from '../repositories/quality.repository';
import { QUALITY_RULE_CONFIGS } from '../utils/procurementCalc';

export const qualityRouter = Router();

qualityRouter.use(authenticate);

/**
 * GET /api/v1/quality/configuration
 * Return commodity-specific quality inspection parameters & rules
 */
qualityRouter.get('/configuration', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cropTypeId = req.query.cropTypeId as string;
    if (cropTypeId && QUALITY_RULE_CONFIGS[cropTypeId]) {
      return res.status(200).json({
        success: true,
        data: QUALITY_RULE_CONFIGS[cropTypeId]
      });
    }
    return res.status(200).json({
      success: true,
      data: Object.values(QUALITY_RULE_CONFIGS)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/quality/inspections
 * Submit quality inspection parameters
 */
qualityRouter.post(
  '/inspections',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user || {};
      const {
        procurementId,
        moisturePercentage,
        foreignMatterPercentage,
        damagedGrainsPercentage,
        brokenGrainsPercentage
      } = req.body;

      if (
        !procurementId ||
        moisturePercentage === undefined ||
        foreignMatterPercentage === undefined ||
        damagedGrainsPercentage === undefined
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'procurementId, moisturePercentage, foreignMatterPercentage, and damagedGrainsPercentage are required.'
          }
        });
      }

      const inspectorId = user.sub || user.id || 'officer-001';
      const officerCentreId = user.assignedCentreId || req.body.centreId || '33333333-3333-4000-8000-333333333333';

      const result = await procurementService.performQualityInspection({
        procurementId,
        inspectorId,
        officerCentreId,
        moisturePercentage: Number(moisturePercentage),
        foreignMatterPercentage: Number(foreignMatterPercentage),
        damagedGrainsPercentage: Number(damagedGrainsPercentage),
        brokenGrainsPercentage: brokenGrainsPercentage ? Number(brokenGrainsPercentage) : 0
      });

      return res.status(201).json({
        success: true,
        message: 'Quality inspection evaluated and recorded successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/quality/inspections/:id/override
 * Manager override for quality decision (Requires CENTRE_MANAGER approval!)
 */
qualityRouter.post(
  '/:id/override',
  authorizeRole(['CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user || {};
      const { id } = req.params;
      const { overrideReason, newStatus, newGrade } = req.body;

      if (!overrideReason || !newStatus || !newGrade) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'overrideReason, newStatus, and newGrade are required.'
          }
        });
      }

      const overriddenBy = user.sub || user.id || 'manager-001';

      const record = await qualityRepository.recordOverride(
        id,
        overrideReason,
        overriddenBy,
        newStatus,
        newGrade
      );

      return res.status(200).json({
        success: true,
        message: 'Quality inspection decision overridden and logged.',
        data: record
      });
    } catch (err) {
      next(err);
    }
  }
);
