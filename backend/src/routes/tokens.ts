import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { tokenService } from '../services/token.service';

export const tokensRouter = Router();

// Protect all token endpoints with authentication
tokensRouter.use(authenticate);

/**
 * POST /api/v1/tokens/generate
 * Generate digital token for a confirmed booking
 */
tokensRouter.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { bookingId } = req.body;
    const actorId = user.sub;
    const actorRole = user.role || user.roleCode || 'FARMER';

    const token = await tokenService.generateTokenForBooking(bookingId, actorId, actorRole);

    res.status(201).json({
      success: true,
      message: 'Digital token generated successfully.',
      data: token
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tokens/:id
 * Get token details by token ID
 */
tokensRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenId = req.params.id;
    const token = await tokenService.getTokenById(tokenId);

    res.status(200).json({
      success: true,
      data: token
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tokens/booking/:bookingId
 * Get digital token for a booking
 */
tokensRouter.get('/booking/:bookingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookingId = req.params.bookingId;
    const token = await tokenService.getTokenByBooking(bookingId);

    res.status(200).json({
      success: true,
      data: token
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tokens/:id/qr
 * Get secure HMAC QR code payload for a digital token
 */
tokensRouter.get('/:id/qr', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenId = req.params.id;
    const qrPayload = await tokenService.getQRPayload(tokenId);

    res.status(200).json({
      success: true,
      data: qrPayload
    });
  } catch (err) {
    next(err);
  }
});
