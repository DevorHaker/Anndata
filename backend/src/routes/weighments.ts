import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { procurementService } from '../services/procurement.service';
import { weighmentRepository } from '../repositories/weighment.repository';

export const weighmentsRouter = Router();

weighmentsRouter.use(authenticate);

/**
 * POST /api/v1/weighments
 * Submit official weighment
 */
weighmentsRouter.post(
  '/',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user || {};
      const { procurementId, equipmentId, grossWeight, tareWeight, unit } = req.body;

      if (!procurementId || !equipmentId || grossWeight === undefined || tareWeight === undefined) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'procurementId, equipmentId, grossWeight, and tareWeight are required.'
          }
        });
      }

      const operatorId = user.sub || user.id || 'officer-001';
      const officerCentreId = user.assignedCentreId || req.body.centreId || '33333333-3333-4000-8000-333333333333';

      const result = await procurementService.recordWeighment({
        procurementId,
        equipmentId,
        operatorId,
        officerCentreId,
        grossWeight: Number(grossWeight),
        tareWeight: Number(tareWeight),
        unit
      });

      return res.status(201).json({
        success: true,
        message: 'Official weighment recorded successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/weighments/:id
 * Get weighment details and correction log history
 */
weighmentsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const weighment = await weighmentRepository.findById(id);
    if (!weighment) {
      return res.status(404).json({
        success: false,
        error: { code: 'WEIGHMENT_NOT_FOUND', message: `Weighment record '${id}' not found.` }
      });
    }

    const corrections = await weighmentRepository.getCorrectionHistory(id);

    return res.status(200).json({
      success: true,
      data: { weighment, corrections }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/weighments/:id/correct
 * Submit official weighment correction (Requires CENTRE_MANAGER approval!)
 */
weighmentsRouter.post(
  '/:id/correct',
  authorizeRole(['CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user || {};
      const { id } = req.params;
      const { correctedGrossWeight, correctedTareWeight, reason, unit } = req.body;

      if (correctedGrossWeight === undefined || correctedTareWeight === undefined || !reason) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'correctedGrossWeight, correctedTareWeight, and reason are required.'
          }
        });
      }

      const authorizedBy = user.sub || user.id || 'manager-001';
      const officerCentreId = user.assignedCentreId || req.body.centreId || '33333333-3333-4000-8000-333333333333';

      const result = await procurementService.correctWeighment({
        weighmentId: id,
        correctedGrossWeight: Number(correctedGrossWeight),
        correctedTareWeight: Number(correctedTareWeight),
        reason,
        authorizedBy,
        officerCentreId,
        unit
      });

      return res.status(200).json({
        success: true,
        message: 'Weighment correction recorded successfully and audited.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
);
