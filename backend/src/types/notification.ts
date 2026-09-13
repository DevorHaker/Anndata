export type NotificationChannel = 'SMS' | 'IN_APP' | 'PUSH' | 'WHATSAPP';

export type NotificationStatus = 
  | 'CREATED'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETRYING'
  | 'EXPIRED'
  | 'CANCELLED';

export type FailureClassification = 'RETRYABLE' | 'PERMANENT';

export interface NotificationRecord {
  id: string;
  userId: string;
  eventType: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  language: string;
  templateId?: string;
  templateVersion?: number;
  status: NotificationStatus;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplateRecord {
  id: string;
  templateCode: string;
  eventType: string;
  language: 'en' | 'hi' | string;
  channel: NotificationChannel;
  version: number;
  titleTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferenceRecord {
  userId: string;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  preferredLanguage: 'en' | 'hi' | string;
  categoryPreferences: {
    bookingUpdates: boolean;
    queueUpdates: boolean;
    paymentUpdates: boolean;
    promotional: boolean;
  };
  updatedAt: string;
}

export interface NotificationDeliveryRecord {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  providerName: string;
  providerReference?: string;
  status: NotificationStatus;
  attemptCount: number;
  maxAttempts: number;
  failureReason?: string;
  failureClassification?: FailureClassification;
  nextRetryAt?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
