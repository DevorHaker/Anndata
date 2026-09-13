import { notificationRepository } from '../../repositories/notification.repository';
import { templateService } from './template.service';
import { retryService } from './retry.service';
import { NotificationProvider } from './notificationProvider.interface';
import { mockSMSProvider } from './mockSmsProvider';
import { inAppProvider } from './inAppProvider';
import { webPushProvider } from './webPushProvider';
import { 
  NotificationChannel, 
  NotificationRecord, 
  NotificationDeliveryRecord 
} from '../../types/notification';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class NotificationDispatcherService {
  private providers: Map<NotificationChannel, NotificationProvider> = new Map();

  constructor() {
    this.providers.set('SMS', mockSMSProvider);
    this.providers.set('IN_APP', inAppProvider);
    this.providers.set('PUSH', webPushProvider);
  }

  /**
   * Dispatch notification safely with template versioning, idempotency key, and provider routing
   */
  async dispatch(params: {
    userId: string;
    recipientAddress?: string;
    eventType: string;
    templateCode: string;
    channel: NotificationChannel;
    variables: Record<string, any>;
    idempotencyKey?: string;
  }): Promise<NotificationRecord> {
    const key = params.idempotencyKey || `idemp-${params.eventType}-${params.userId}-${JSON.stringify(params.variables)}`;

    // 1. User preferences check
    const prefs = await notificationRepository.getPreferences(params.userId);
    const language = prefs.preferredLanguage || 'hi';

    // 2. Render Template
    const { title, body, templateId, version } = await templateService.renderTemplate(
      params.templateCode,
      language,
      params.channel,
      params.variables
    );

    // 3. Create Notification Record
    const notificationId = uuidv4();
    const now = new Date().toISOString();

    const record: NotificationRecord = {
      id: notificationId,
      userId: params.userId,
      eventType: params.eventType,
      channel: params.channel,
      title,
      message: body,
      language,
      templateId,
      templateVersion: version,
      status: 'QUEUED',
      idempotencyKey: key,
      metadata: params.variables,
      readAt: null,
      createdAt: now,
      updatedAt: now
    };

    const notification = await notificationRepository.createNotification(record);

    // 4. Send via Provider
    const provider = this.providers.get(params.channel);
    if (!provider) {
      logger.warn(`NotificationDispatcher: Provider for channel ${params.channel} not configured`);
      return notification;
    }

    try {
      const sendResult = await provider.send({
        notificationId: notification.id,
        recipientId: params.userId,
        recipientAddress: params.recipientAddress || params.userId,
        title,
        message: body,
        channel: params.channel,
        metadata: params.variables
      });

      notification.status = sendResult.status;
      notification.updatedAt = new Date().toISOString();

      await notificationRepository.recordDelivery({
        id: uuidv4(),
        notificationId: notification.id,
        channel: params.channel,
        providerName: sendResult.providerName,
        providerReference: sendResult.providerReference,
        status: sendResult.status,
        attemptCount: 1,
        maxAttempts: 3,
        failureReason: sendResult.failureReason,
        failureClassification: sendResult.failureClassification,
        sentAt: now,
        deliveredAt: sendResult.status === 'DELIVERED' ? now : null,
        createdAt: now,
        updatedAt: now
      });
    } catch (err: any) {
      const failureClass = retryService.classifyFailure(err);
      notification.status = 'FAILED';

      await notificationRepository.recordDelivery({
        id: uuidv4(),
        notificationId: notification.id,
        channel: params.channel,
        providerName: provider.providerName,
        status: 'FAILED',
        attemptCount: 1,
        maxAttempts: 3,
        failureReason: err.message,
        failureClassification: failureClass,
        nextRetryAt: failureClass === 'RETRYABLE' ? retryService.calculateNextRetryTime(1) : null,
        createdAt: now,
        updatedAt: now
      });
    }

    return notification;
  }
}

export const notificationDispatcherService = new NotificationDispatcherService();
