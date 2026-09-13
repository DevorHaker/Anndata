import { NotificationProvider, SendNotificationParams, SendNotificationResult } from './notificationProvider.interface';
import { v4 as uuidv4 } from 'uuid';

export class InAppProvider implements NotificationProvider {
  public channel = 'IN_APP' as const;
  public providerName = 'IN_APP_DISPATCHER';

  async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    const providerRef = `INAPP-${uuidv4().substring(0, 8)}`;
    return {
      success: true,
      status: 'DELIVERED',
      providerName: this.providerName,
      providerReference: providerRef
    };
  }
}

export const inAppProvider = new InAppProvider();
