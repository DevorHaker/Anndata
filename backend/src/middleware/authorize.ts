import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, AuthenticationError } from '../utils/errors';

export function authorizeRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      return next(new AuthenticationError('Authentication required to verify permissions', 'UNAUTHENTICATED'));
    }

    const normalizedUserRole = req.user.role === 'ADMIN' ? 'SYSTEM_ADMIN' : req.user.role;
    const normalizedAllowed = allowedRoles.map((r) => (r === 'ADMIN' ? 'SYSTEM_ADMIN' : r));

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return next(
        new ForbiddenError(
          `Role '${req.user.role}' does not have authorization to access this resource`,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
}

export function authorizePermission(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required', 'UNAUTHENTICATED'));
    }

    // System admin role automatically possesses all permissions
    if (req.user.role === 'SYSTEM_ADMIN' || req.user.role === 'ADMIN') {
      return next();
    }

    const hasPermission = req.user.permissions && req.user.permissions.includes(requiredPermission);

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          `Missing required permission code: ${requiredPermission}`,
          'FORBIDDEN_PERMISSION'
        )
      );
    }

    next();
  };
}

export function validateScope(scopeConfig: { resource: string; paramName?: string }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required', 'UNAUTHENTICATED'));
    }

    const userRole = req.user.role;

    // System Admins bypass scope restrictions
    if (userRole === 'SYSTEM_ADMIN' || userRole === 'ADMIN') {
      return next();
    }

    const paramName = scopeConfig.paramName || 'farmerId';
    const targetResourceId = req.params[paramName] || req.body[paramName] || req.query[paramName];

    if (userRole === 'FARMER') {
      if (targetResourceId && req.user.farmerId && targetResourceId !== req.user.farmerId) {
        return next(
          new ForbiddenError('Access denied: You cannot access or modify resources belonging to another farmer', 'BOLA_SCOPE_VIOLATION')
        );
      }
    }

    next();
  };
}
