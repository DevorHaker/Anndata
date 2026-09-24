import { pool } from '../database';
import { logger } from '../utils/logger';
import { 
  NotificationRecord, 
  NotificationTemplateRecord, 
  NotificationPreferenceRecord, 
  NotificationDeliveryRecord,
  NotificationStatus
} from '../types/notification';

class NotificationRepository {
  private memoryNotifications: Map<string, NotificationRecord> = new Map();
  private memoryIdempotencyKeys: Map<string, NotificationRecord> = new Map();
  private memoryTemplates: Map<string, NotificationTemplateRecord> = new Map();
  private memoryPreferences: Map<string, NotificationPreferenceRecord> = new Map();
  private memoryDeliveries: Map<string, NotificationDeliveryRecord> = new Map();

  constructor() {
    this.seedDefaultTemplates();
  }

  private seedDefaultTemplates() {
    const templates: NotificationTemplateRecord[] = [
      {
        id: 'tpl-booking-confirmed-en',
        templateCode: 'BOOKING_CONFIRMED',
        eventType: 'BookingConfirmed',
        language: 'en',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'Procurement Slot Confirmed',
        bodyTemplate: 'Your procurement slot is confirmed for {date} at {time} at {centre}. Token: {tokenCode}.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tpl-booking-confirmed-hi',
        templateCode: 'BOOKING_CONFIRMED',
        eventType: 'BookingConfirmed',
        language: 'hi',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'खरीद स्लॉट की पुष्टि हुई',
        bodyTemplate: 'आपका खरीद स्लॉट {date} को {time} बजे {centre} पर पुष्टि हो गया है। टोकन: {tokenCode}।',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tpl-token-generated-en',
        templateCode: 'TOKEN_GENERATED',
        eventType: 'TokenGenerated',
        language: 'en',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'Digital Mandi Token Issued',
        bodyTemplate: 'Your digital queue token {tokenCode} has been issued for booking {bookingReferenceId}.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tpl-token-generated-hi',
        templateCode: 'TOKEN_GENERATED',
        eventType: 'TokenGenerated',
        language: 'hi',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'डिजिटल मंडी टोकन जारी',
        bodyTemplate: 'आपकी बुकिंग {bookingReferenceId} के लिए डिजिटल टोकन {tokenCode} जारी किया गया है।',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tpl-payment-success-en',
        templateCode: 'PAYMENT_SUCCESSFUL',
        eventType: 'PaymentSuccessful',
        language: 'en',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'DBT Payment Processed',
        bodyTemplate: 'Your DBT payment of ₹{amount} for procurement {procurementId} has been credited via Bank UTR {utr}.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tpl-payment-success-hi',
        templateCode: 'PAYMENT_SUCCESSFUL',
        eventType: 'PaymentSuccessful',
        language: 'hi',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'DBT भुगतान सफल',
        bodyTemplate: 'खरीद {procurementId} के लिए आपका ₹{amount} का DBT भुगतान यूटीआर {utr} द्वारा भेजा गया है।',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tpl-centre-disruption-en',
        templateCode: 'CENTRE_DISRUPTION',
        eventType: 'CentreDisruptionCreated',
        language: 'en',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'Mandi Operational Notice',
        bodyTemplate: 'Operational alert at {centre}: {reason}. Expected resolution: {expectedEndTime}.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tpl-centre-disruption-hi',
        templateCode: 'CENTRE_DISRUPTION',
        eventType: 'CentreDisruptionCreated',
        language: 'hi',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'मंडी परिचालन सूचना',
        bodyTemplate: '{centre} पर परिचालन अलर्ट: {reason}। संभावित समाधान समय: {expectedEndTime}।',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tpl-procurement-request-submitted-en',
        templateCode: 'PROCUREMENT_REQUEST_SUBMITTED',
        eventType: 'ProcurementRequestSubmitted',
        language: 'en',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'New Procurement Request Received',
        bodyTemplate: 'Farmer {farmerName} submitted procurement request {bookingReferenceId} for {cropName} ({quantityKg} kg) at {centreName}.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tpl-procurement-request-submitted-hi',
        templateCode: 'PROCUREMENT_REQUEST_SUBMITTED',
        eventType: 'ProcurementRequestSubmitted',
        language: 'hi',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'नया खरीद अनुरोध प्राप्त हुआ',
        bodyTemplate: 'किसान {farmerName} ने {centreName} पर {cropName} ({quantityKg} किग्रा) के लिए खरीद अनुरोध ({bookingReferenceId}) जमा किया है।',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tpl-procurement-request-approved-en',
        templateCode: 'PROCUREMENT_REQUEST_APPROVED',
        eventType: 'ProcurementRequestApproved',
        language: 'en',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'Procurement Request Approved',
        bodyTemplate: 'Your procurement request {bookingReferenceId} for {cropName} ({quantityKg} kg) at {centreName} has been approved by the Centre Manager.',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tpl-procurement-request-approved-hi',
        templateCode: 'PROCUREMENT_REQUEST_APPROVED',
        eventType: 'ProcurementRequestApproved',
        language: 'hi',
        channel: 'IN_APP',
        version: 1,
        titleTemplate: 'खरीद अनुरोध स्वीकृत',
        bodyTemplate: 'आपकी फसल {cropName} ({quantityKg} किग्रा) के लिए खरीद अनुरोध {bookingReferenceId} {centreName} पर स्वीकृत कर दिया गया है।',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    templates.forEach((t) => this.memoryTemplates.set(`${t.templateCode}:${t.language}:${t.channel}`, t));
  }

  // NOTIFICATION CRUD & IDEMPOTENCY
  public async createNotification(notification: NotificationRecord): Promise<NotificationRecord> {
    const existing = this.memoryIdempotencyKeys.get(notification.idempotencyKey);
    if (existing) {
      logger.info(`NotificationRepository: Duplicate notification skipped via idempotency key ${notification.idempotencyKey}`);
      return existing;
    }

    try {
      await pool.query(
        `INSERT INTO notifications (
          id, user_id, event_type, channel, title, message, language,
          template_id, template_version, status, idempotency_key, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          notification.id,
          notification.userId,
          notification.eventType,
          notification.channel,
          notification.title,
          notification.message,
          notification.language,
          notification.templateId || null,
          notification.templateVersion || 1,
          notification.status,
          notification.idempotencyKey,
          notification.metadata ? JSON.stringify(notification.metadata) : null,
          notification.createdAt,
          notification.updatedAt
        ]
      );
    } catch (err) {
      // Memory fallback active
    }

    this.memoryNotifications.set(notification.id, notification);
    this.memoryIdempotencyKeys.set(notification.idempotencyKey, notification);
    return notification;
  }

  public async getUserNotifications(userId: string, limit = 50): Promise<NotificationRecord[]> {
    try {
      const res = await pool.query(
        `SELECT * FROM notifications WHERE user_id = $1 OR user_id = 'ALL' OR user_id = 'CENTRE_MANAGER' OR user_id = '10000000-0000-4000-8000-000000000003' ORDER BY created_at DESC LIMIT $2`,
        [userId, limit]
      );
      if (res.rows.length > 0) {
        return res.rows.map(this.mapDbRowToNotification);
      }
    } catch (err) {
      // Fallback
    }

    const isManagerUser = userId === '10000000-0000-4000-8000-000000000003' || userId.includes('manager') || userId.includes('0003');

    return Array.from(this.memoryNotifications.values())
      .filter((n) => n.userId === userId || n.userId === 'ALL' || (isManagerUser && n.userId === 'CENTRE_MANAGER') || (!isManagerUser && n.userId === 'FARMER'))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  public async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const notif = this.memoryNotifications.get(notificationId);
    const now = new Date().toISOString();
    if (notif && notif.userId === userId) {
      notif.readAt = now;
      notif.updatedAt = now;
    }

    try {
      await pool.query(
        `UPDATE notifications SET read_at = $1, updated_at = $1 WHERE id = $2 AND user_id = $3`,
        [now, notificationId, userId]
      );
      return true;
    } catch (err) {
      return !!notif;
    }
  }

  public async markAllAsRead(userId: string): Promise<number> {
    const now = new Date().toISOString();
    let count = 0;
    for (const notif of this.memoryNotifications.values()) {
      if (notif.userId === userId && !notif.readAt) {
        notif.readAt = now;
        notif.updatedAt = now;
        count++;
      }
    }

    try {
      const res = await pool.query(
        `UPDATE notifications SET read_at = $1, updated_at = $1 WHERE user_id = $2 AND read_at IS NULL`,
        [now, userId]
      );
      return res.rowCount || count;
    } catch (err) {
      return count;
    }
  }

  // TEMPLATES
  public async getTemplate(templateCode: string, language: string, channel: string): Promise<NotificationTemplateRecord | null> {
    const key = `${templateCode}:${language}:${channel}`;
    const directMatch = this.memoryTemplates.get(key);
    if (directMatch) return directMatch;

    // Fallback to English template if requested language translation is missing
    const fallbackKey = `${templateCode}:en:${channel}`;
    return this.memoryTemplates.get(fallbackKey) || null;
  }

  public async listTemplates(): Promise<NotificationTemplateRecord[]> {
    return Array.from(this.memoryTemplates.values());
  }

  // USER PREFERENCES
  public async getPreferences(userId: string): Promise<NotificationPreferenceRecord> {
    const existing = this.memoryPreferences.get(userId);
    if (existing) return existing;

    const defaultPref: NotificationPreferenceRecord = {
      userId,
      smsEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      preferredLanguage: 'hi', // default to Hindi for farmer accessibility
      categoryPreferences: {
        bookingUpdates: true,
        queueUpdates: true,
        paymentUpdates: true,
        promotional: false
      },
      updatedAt: new Date().toISOString()
    };

    this.memoryPreferences.set(userId, defaultPref);
    return defaultPref;
  }

  public async updatePreferences(userId: string, updates: Partial<NotificationPreferenceRecord>): Promise<NotificationPreferenceRecord> {
    const current = await this.getPreferences(userId);
    const updated: NotificationPreferenceRecord = {
      ...current,
      ...updates,
      categoryPreferences: {
        ...current.categoryPreferences,
        ...(updates.categoryPreferences || {})
      },
      updatedAt: new Date().toISOString()
    };

    try {
      await pool.query(
        `INSERT INTO notification_preferences (user_id, sms_enabled, push_enabled, in_app_enabled, preferred_language, category_preferences, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
           sms_enabled = EXCLUDED.sms_enabled,
           push_enabled = EXCLUDED.push_enabled,
           in_app_enabled = EXCLUDED.in_app_enabled,
           preferred_language = EXCLUDED.preferred_language,
           category_preferences = EXCLUDED.category_preferences,
           updated_at = EXCLUDED.updated_at`,
        [
          userId,
          updated.smsEnabled,
          updated.pushEnabled,
          updated.inAppEnabled,
          updated.preferredLanguage,
          JSON.stringify(updated.categoryPreferences),
          updated.updatedAt
        ]
      );
    } catch (err) {
      // Memory fallback active
    }

    this.memoryPreferences.set(userId, updated);
    return updated;
  }

  // DELIVERY LOGS & RETRIES
  public async recordDelivery(delivery: NotificationDeliveryRecord): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO notification_deliveries (
          id, notification_id, channel, provider_name, provider_reference, status,
          attempt_count, max_attempts, failure_reason, failure_classification, next_retry_at, sent_at, delivered_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          delivery.id,
          delivery.notificationId,
          delivery.channel,
          delivery.providerName,
          delivery.providerReference || null,
          delivery.status,
          delivery.attemptCount,
          delivery.maxAttempts,
          delivery.failureReason || null,
          delivery.failureClassification || null,
          delivery.nextRetryAt || null,
          delivery.sentAt || null,
          delivery.deliveredAt || null,
          delivery.createdAt,
          delivery.updatedAt
        ]
      );
    } catch (err) {
      // Memory fallback active
    }
    this.memoryDeliveries.set(delivery.id, delivery);
  }

  public async getDeliveryStats() {
    const deliveries = Array.from(this.memoryDeliveries.values());
    const total = deliveries.length;
    const delivered = deliveries.filter((d) => d.status === 'DELIVERED').length;
    const failed = deliveries.filter((d) => d.status === 'FAILED').length;
    const retrying = deliveries.filter((d) => d.status === 'RETRYING').length;

    return {
      total,
      delivered,
      failed,
      retrying,
      deliverySuccessRatePct: total > 0 ? Math.round((delivered / total) * 100) : 100
    };
  }

  private mapDbRowToNotification(row: any): NotificationRecord {
    return {
      id: row.id,
      userId: row.user_id,
      eventType: row.event_type,
      channel: row.channel,
      title: row.title,
      message: row.message,
      language: row.language,
      templateId: row.template_id,
      templateVersion: row.template_version,
      status: row.status as NotificationStatus,
      idempotencyKey: row.idempotency_key,
      metadata: row.metadata ? JSON.parse(JSON.stringify(row.metadata)) : undefined,
      readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString()
    };
  }
}

export const notificationRepository = new NotificationRepository();
