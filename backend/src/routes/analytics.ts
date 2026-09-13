import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics/analytics.service';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';

export const analyticsRouter = Router();

// Protect all analytics endpoints with authentication
analyticsRouter.use(authenticate as any);

/**
 * GET /api/v1/analytics/summary
 * Returns overall executive KPI dashboard summary (Asia/Kolkata timezone context)
 */
analyticsRouter.get(
  '/summary',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'CENTRE_MANAGER', 'PROCUREMENT_OFFICER']) as any,
  async (req: Request, res: Response) => {
    try {
      const summary = await analyticsService.getExecutiveSummary();
      res.json({
        success: true,
        data: summary,
        requestId: (req as any).id
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_FAILED',
          message: err.message || 'Failed to compute executive analytics summary'
        }
      });
    }
  }
);

/**
 * GET /api/v1/analytics/farmers
 * Returns Farmer registration & booking analytics
 */
analyticsRouter.get(
  '/farmers',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'CENTRE_MANAGER']) as any,
  async (req: Request, res: Response) => {
    try {
      const metrics = await analyticsService.getFarmerMetrics();
      res.json({
        success: true,
        data: metrics,
        requestId: (req as any).id
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'ANALYTICS_FAILED', message: err.message }
      });
    }
  }
);

/**
 * GET /api/v1/analytics/centres
 * Returns Procurement Centre throughput & queue turnaround metrics
 */
analyticsRouter.get(
  '/centres',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'CENTRE_MANAGER', 'PROCUREMENT_OFFICER']) as any,
  async (req: Request, res: Response) => {
    try {
      const centreId = req.query.centreId as string | undefined;
      const metrics = await analyticsService.getCentreMetrics(centreId);
      res.json({
        success: true,
        data: metrics,
        requestId: (req as any).id
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'ANALYTICS_FAILED', message: err.message }
      });
    }
  }
);

/**
 * GET /api/v1/analytics/procurements
 * Returns Procurement volume, weighments & rejection metrics
 */
analyticsRouter.get(
  '/procurements',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'CENTRE_MANAGER', 'PROCUREMENT_OFFICER']) as any,
  async (req: Request, res: Response) => {
    try {
      const metrics = await analyticsService.getProcurementMetrics();
      res.json({
        success: true,
        data: metrics,
        requestId: (req as any).id
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'ANALYTICS_FAILED', message: err.message }
      });
    }
  }
);

/**
 * GET /api/v1/analytics/payments
 * Returns DBT Payment volume & reconciliation metrics
 */
analyticsRouter.get(
  '/payments',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'CENTRE_MANAGER', 'PROCUREMENT_OFFICER']) as any,
  async (req: Request, res: Response) => {
    try {
      const metrics = await analyticsService.getPaymentMetrics();
      res.json({
        success: true,
        data: metrics,
        requestId: (req as any).id
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'ANALYTICS_FAILED', message: err.message }
      });
    }
  }
);

/**
 * GET /api/v1/analytics/system
 * Returns System Health, Notification delivery & Offline sync metrics
 */
analyticsRouter.get(
  '/system',
  authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN']) as any,
  async (req: Request, res: Response) => {
    try {
      const metrics = await analyticsService.getSystemHealthMetrics();
      res.json({
        success: true,
        data: metrics,
        requestId: (req as any).id
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'ANALYTICS_FAILED', message: err.message }
      });
    }
  }
);
