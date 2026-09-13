import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';
import { sendSuccess } from '../utils/response';
import {
  registerSchema,
  loginPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  changePasswordSchema,
  resetPasswordSchema
} from '../validations/auth.validation';

const router = Router();

// POST /api/v1/auth/register
router.post(
  '/register',
  rateLimiter,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'];
      const result = await authService.register(req.body, ip, userAgent);

      // Set HttpOnly refresh token cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/login
router.post(
  '/login',
  rateLimiter,
  validate(loginPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'];
      const { mobileNumber, password } = req.body;
      const result = await authService.loginWithPassword(mobileNumber, password, ip, userAgent);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/otp/request
router.post(
  '/otp/request',
  rateLimiter,
  validate(requestOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mobileNumber } = req.body;
      const result = await authService.requestOtp(mobileNumber);
      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/otp/verify
router.post(
  '/otp/verify',
  rateLimiter,
  validate(verifyOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'];
      const { mobileNumber, otp } = req.body;
      const result = await authService.loginWithOtp(mobileNumber, otp, ip, userAgent);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  rateLimiter,
  validate(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || '127.0.0.1';
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHENTICATED', message: 'Missing refresh token cookie or parameter' }
        });
      }

      const tokens = await authService.refreshToken(refreshToken, ip);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return sendSuccess(res, tokens, 200);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || '127.0.0.1';
    await authService.logout(req.user!.sessionId, req.user!.sub, ip);

    res.clearCookie('refreshToken');
    return sendSuccess(res, { message: 'Successfully logged out' }, 200);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getUserProfile(req.user!.sub);
    return sendSuccess(res, profile, 200);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/password/change
router.post(
  '/password/change',
  authenticate,
  validate(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || '127.0.0.1';
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.sub, currentPassword, newPassword, ip);
      return sendSuccess(res, { message: 'Password updated successfully. Please log in with your new password.' }, 200);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/password/reset
router.post(
  '/password/reset',
  rateLimiter,
  validate(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || '127.0.0.1';
      const { mobileNumber, otp, newPassword } = req.body;
      await authService.resetPassword(mobileNumber, otp, newPassword, ip);
      return sendSuccess(res, { message: 'Password reset successfully. You may now log in.' }, 200);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
