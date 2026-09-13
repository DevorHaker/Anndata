import { Router, Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { z } from 'zod';
import { AppError, ForbiddenError } from '../utils/errors';

export const paymentsRouter = Router();

const createPaymentSchema = z.object({
  procurementId: z.string().min(1, 'procurementId is required'),
  idempotencyKey: z.string().optional()
});

const retryPaymentSchema = z.object({
  reason: z.string().optional()
});

const cancelPaymentSchema = z.object({
  reason: z.string().min(3, 'Reason for cancellation is required')
});

const reversePaymentSchema = z.object({
  reason: z.string().min(3, 'Reason for reversal is required')
});

const webhookSchema = z.object({
  paymentReferenceId: z.string().min(1),
  providerTransactionRef: z.string().min(1),
  status: z.enum([
    'PAYMENT_PENDING',
    'PAYMENT_VALIDATED',
    'PAYMENT_QUEUED',
    'PAYMENT_PROCESSING',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'PAYMENT_RETRY',
    'PAYMENT_CANCELLED',
    'PAYMENT_REVERSED'
  ]),
  failureReason: z.string().optional(),
  signature: z.string().optional()
});

/**
 * POST /api/v1/payments - Create payment record for procurement
 */
paymentsRouter.post(
  '/',
  authenticate,
  authorizeRole(['PROCUREMENT_OFFICER', 'STAFF', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createPaymentSchema.parse(req.body);
      const idempotencyKey = req.headers['idempotency-key'] as string || body.idempotencyKey;
      const payment = await paymentService.createPaymentForProcurement(
        body.procurementId,
        idempotencyKey,
        (req.user as any)?.id || 'SYSTEM'
      );

      res.status(201).json({
        success: true,
        data: payment
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/payments - List payment records (RBAC scoped)
 */
paymentsRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;
      const { centreId, farmerId, status, search, limit, offset } = req.query;

      let targetFarmerId = farmerId as string | undefined;
      let targetCentreId = centreId as string | undefined;

      if (user.role === 'FARMER') {
        targetFarmerId = user.farmerId || user.id;
      } else if (user.role === 'STAFF' || user.role === 'CENTRE_MANAGER') {
        targetCentreId = user.centreId || targetCentreId;
      }

      const result = await paymentService.listPayments({
        centreId: targetCentreId,
        farmerId: targetFarmerId,
        status: status as any,
        search: search as string,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0
      });

      res.json({
        success: true,
        data: result.payments,
        totalCount: result.totalCount
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/payments/reconciliation - Admin Reconciliation Dashboard
 */
paymentsRouter.get(
  '/reconciliation',
  authenticate,
  authorizeRole(['DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reconciliations = await paymentService.listReconciliations();
      res.json({
        success: true,
        data: reconciliations
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/farmers/me/payments - Farmer Payment History
 */
paymentsRouter.get(
  '/farmer/me',
  authenticate,
  authorizeRole(['FARMER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const farmerId = (req.user as any).farmerId || (req.user as any).id;
      const result = await paymentService.listPayments({ farmerId });
      res.json({
        success: true,
        data: result.payments
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/payments/:paymentId - Get single payment record & event history
 */
paymentsRouter.get(
  '/:paymentId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;
      const result = await paymentService.getPaymentById(req.params.paymentId);

      // RBAC Security check
      if (user.role === 'FARMER' && result.payment.farmerId !== (user.farmerId || user.id)) {
        throw new ForbiddenError('You can only view your own payment records.', 'ACCESS_DENIED');
      }

      res.json({
        success: true,
        data: result.payment,
        events: result.events
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/payments/:paymentId/validate - Validate destination
 */
paymentsRouter.post(
  '/:paymentId/validate',
  authenticate,
  authorizeRole(['PROCUREMENT_OFFICER', 'STAFF', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await paymentService.validatePayment(req.params.paymentId, (req.user as any).id);
      res.json({
        success: true,
        data: payment
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/payments/:paymentId/process - Submit payment for processing
 */
paymentsRouter.post(
  '/:paymentId/process',
  authenticate,
  authorizeRole(['PROCUREMENT_OFFICER', 'STAFF', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await paymentService.processPayment(req.params.paymentId, (req.user as any).id);
      res.json({
        success: true,
        data: payment
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/payments/:paymentId/retry - Retry failed payment
 */
paymentsRouter.post(
  '/:paymentId/retry',
  authenticate,
  authorizeRole(['PROCUREMENT_OFFICER', 'STAFF', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await paymentService.retryPayment(req.params.paymentId, (req.user as any).id);
      res.json({
        success: true,
        data: payment
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/payments/:paymentId/cancel - Cancel payment
 */
paymentsRouter.post(
  '/:paymentId/cancel',
  authenticate,
  authorizeRole(['CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = cancelPaymentSchema.parse(req.body);
      const payment = await paymentService.cancelPayment(req.params.paymentId, body.reason, (req.user as any).id);
      res.json({
        success: true,
        data: payment
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/payments/:paymentId/reverse - Reverse completed payment (Admin only)
 */
paymentsRouter.post(
  '/:paymentId/reverse',
  authenticate,
  authorizeRole(['DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = reversePaymentSchema.parse(req.body);
      const payment = await paymentService.reversePayment(req.params.paymentId, body.reason, (req.user as any).id);
      res.json({
        success: true,
        data: payment
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/payment-provider/webhooks - Webhook callback from provider gateway
 */
paymentsRouter.post('/webhooks/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = webhookSchema.parse(req.body);
    const payment = await paymentService.handleWebhookCallback(body);
    res.json({
      success: true,
      data: payment
    });
  } catch (err) {
    next(err);
  }
});
