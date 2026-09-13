import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtAccessPayload } from '../utils/security';
import { userRepository } from '../repositories/user.repository';
import { AuthenticationError, ForbiddenError } from '../utils/errors';

export interface AuthenticatedUser extends JwtAccessPayload {
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication required. Missing Bearer token.', 'UNAUTHENTICATED');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Verify account state directly or via DB check
    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new AuthenticationError('User identity associated with token no longer exists.', 'USER_NOT_FOUND');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError(`Account status is ${user.status}. Access denied.`, 'ACCOUNT_INACTIVE');
    }

    req.user = {
      ...payload,
      role: user.roleCode,
      status: user.status
    };

    next();
  } catch (err) {
    next(err);
  }
}
