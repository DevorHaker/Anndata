import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { notificationService } from '../services/notification/notification.service';
import { mockSMSProvider } from '../services/notification/mockSmsProvider';

export const notificationsRouter = Router();

notificationsRouter.use(authenticate as any);

/**
 * GET /api/v1/notifications
 * Get authenticated user's notification history
 */
notificationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const notifications = await notificationService.getUserNotifications(userId);
    res.json({
      success: true,
      data: notifications
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/notifications/preferences
 * Get user notification preferences
 */
notificationsRouter.get('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const preferences = await notificationService.getPreferences(userId);
    res.json({
      success: true,
      data: preferences
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/v1/notifications/preferences
 * Update user notification preferences
 */
notificationsRouter.put('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const updated = await notificationService.updatePreferences(userId, req.body);
    res.json({
      success: true,
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark notification as read
 */
notificationsRouter.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const success = await notificationService.markAsRead(req.params.id, userId);
    res.json({
      success,
      message: success ? 'Notification marked as read' : 'Notification not found'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/notifications/read-all
 * Mark all notifications as read
 */
notificationsRouter.post('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const count = await notificationService.markAllAsRead(userId);
    res.json({
      success: true,
      message: `${count} notifications marked as read`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/notifications/deliveries/stats
 * Get notification delivery analytics (Admin / Staff)
 */
notificationsRouter.get('/deliveries/stats', authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'CENTRE_MANAGER', 'PROCUREMENT_OFFICER']) as any, async (req: Request, res: Response) => {
  try {
    const stats = await notificationService.getDeliveryStats();
    res.json({
      success: true,
      data: {
        ...stats,
        mockSmsLogsCount: mockSMSProvider.getMockLogs().length
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
