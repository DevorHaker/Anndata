import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { checkinService } from '../services/checkin.service';
import { qrCrypto } from '../utils/qrCrypto';

export const checkinsRouter = Router();

checkinsRouter.use(authenticate);

/**
 * POST /api/v1/checkins/qr
 * Perform gate check-in by scanning QR payload
 */
checkinsRouter.post(
  '/qr',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { qrPayload, centreId } = req.body;
      const checkedInBy = user.sub;
      const actorRole = user.role || user.roleCode || 'PROCUREMENT_OFFICER';

      const checkin = await checkinService.validateAndCheckin(
        qrPayload,
        centreId,
        checkedInBy,
        actorRole
      );

      res.status(201).json({
        success: true,
        message: 'Gate check-in recorded successfully. Token entered live queue.',
        data: checkin
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/checkins/token
 * Perform gate check-in manually using token code (e.g. T-023)
 */
checkinsRouter.post(
  '/token',
  authorizeRole(['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { tokenCode, centreId } = req.body;
      const checkedInBy = user.sub;
      const actorRole = user.role || user.roleCode || 'PROCUREMENT_OFFICER';

      const checkin = await checkinService.checkinByTokenCode(
        tokenCode,
        centreId,
        checkedInBy,
        actorRole
      );

      res.status(201).json({
        success: true,
        message: 'Manual token check-in recorded successfully. Token entered live queue.',
        data: checkin
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/checkins/validate
 * Validate QR payload format and signature without mutating state
 */
checkinsRouter.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrPayload } = req.body;
    const result = qrCrypto.verifyQRPayload(qrPayload);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});
