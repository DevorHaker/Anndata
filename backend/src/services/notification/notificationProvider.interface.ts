import { NotificationChannel, NotificationStatus, FailureClassification } from '../../types/notification';

export interface SendNotificationParams {
  notificationId: string;
  recipientId: string;
  recipientAddress: string; // phone number, push endpoint, or userId
  title: string;
  message: string;
  channel: NotificationChannel;
  metadata?: Record<string, any>;
}

export interface SendNotificationResult {
  success: boolean;
  status: NotificationStatus;
  providerName: string;
  providerReference?: string;
  failureReason?: string;
  failureClassification?: FailureClassification;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  providerName: string;
  send(params: SendNotificationParams): Promise<SendNotificationResult>;
}
