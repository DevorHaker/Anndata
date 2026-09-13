import { NotificationProvider, SendNotificationParams, SendNotificationResult } from './notificationProvider.interface';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class WebPushProvider implements NotificationProvider {
  public channel = 'PUSH' as const;
  public providerName = 'WEB_PUSH_DISPATCHER';

  async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    const providerRef = `PUSH-${uuidv4().substring(0, 8)}`;
    logger.info(`WebPushProvider: Dispatching web push to ${params.recipientId}: ${params.title}`);
    return {
      success: true,
      status: 'SENT',
      providerName: this.providerName,
      providerReference: providerRef
    };
  }
}

export const webPushProvider = new WebPushProvider();
