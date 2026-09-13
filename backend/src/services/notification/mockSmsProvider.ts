import { NotificationProvider, SendNotificationParams, SendNotificationResult } from './notificationProvider.interface';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class MockSMSProvider implements NotificationProvider {
  public channel = 'SMS' as const;
  public providerName = 'DEVELOPMENT_MOCK_SMS_PROVIDER';

  private sentSmsLogs: Array<{
    id: string;
    recipientPhone: string;
    message: string;
    timestamp: string;
    status: string;
  }> = [];

  async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    const providerRef = `MOCK-SMS-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    logger.info(`[DEVELOPMENT / MOCK ONLY] SMS Provider sending to ${params.recipientAddress}: ${params.message}`);

    this.sentSmsLogs.push({
      id: providerRef,
      recipientPhone: params.recipientAddress,
      message: params.message,
      timestamp: now,
      status: 'DELIVERED'
    });

    return {
      success: true,
      status: 'DELIVERED',
      providerName: this.providerName,
      providerReference: providerRef
    };
  }

  public getMockLogs() {
    return this.sentSmsLogs;
  }
}

export const mockSMSProvider = new MockSMSProvider();
