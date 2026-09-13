import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validate } from '../middleware/validation';
import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { logAuditEvent } from '../services/audit.service';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ValidationError } from '../utils/errors';
import { updateStatusSchema, updateRoleSchema } from '../validations/auth.validation';

const router = Router();

// Require authentication for all admin user management routes
router.use(authenticate);

// GET /api/v1/admin/users
router.get('/', authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const roleCode = req.query.role as string | undefined;
    const status = req.query.status as string | undefined;

    const result = await userRepository.listUsers(page, limit, roleCode, status);
    return sendSuccess(res, result.users, 200, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/users/:id/status
router.patch(
  '/:id/status',
  authorizeRole(['SYSTEM_ADMIN', 'ADMIN']),
  validate(updateStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ip = req.ip || '127.0.0.1';

      const user = await userRepository.findById(id);
      if (!user) {
        throw new NotFoundError('Target user account not found', 'USER_NOT_FOUND');
      }

      await userRepository.updateUserStatus(id, status);

      // Invalidate active sessions if account is suspended, disabled, or locked
      if (status !== 'ACTIVE') {
        await sessionRepository.revokeAllUserSessions(id);
      }

      await logAuditEvent({
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        action: 'USER_STATUS_UPDATED',
        entityType: 'USER',
        entityId: id,
        beforeState: { status: user.status },
        afterState: { status },
        ipAddress: ip
      });

      return sendSuccess(res, { message: `User account status updated to ${status}` }, 200);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/admin/users/:id/role
router.patch(
  '/:id/role',
  authorizeRole(['SYSTEM_ADMIN', 'ADMIN']),
  validate(updateRoleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { roleCode } = req.body;
      const ip = req.ip || '127.0.0.1';

      const user = await userRepository.findById(id);
      if (!user) {
        throw new NotFoundError('Target user account not found', 'USER_NOT_FOUND');
      }

      const role = await userRepository.findRoleByCode(roleCode);
      if (!role) {
        throw new ValidationError(`Invalid target role code: ${roleCode}`, 'INVALID_ROLE');
      }

      await userRepository.updateUserRole(id, role.id);
      await sessionRepository.revokeAllUserSessions(id);

      await logAuditEvent({
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        action: 'USER_ROLE_UPDATED',
        entityType: 'USER',
        entityId: id,
        beforeState: { roleCode: user.roleCode },
        afterState: { roleCode: role.code },
        ipAddress: ip
      });

      return sendSuccess(res, { message: `User role updated to ${role.code}` }, 200);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
