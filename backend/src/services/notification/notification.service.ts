import { notificationDispatcherService } from './dispatcher.service';
import { notificationRepository } from '../../repositories/notification.repository';
import { NotificationRecord, NotificationPreferenceRecord } from '../../types/notification';

export class NotificationService {
  /**
   * Handle domain event: BookingConfirmed
   */
  async notifyBookingConfirmed(params: {
    userId: string;
    bookingReferenceId: string;
    date: string;
    time: string;
    centreName: string;
    tokenCode: string;
  }) {
    return notificationDispatcherService.dispatch({
      userId: params.userId,
      eventType: 'BookingConfirmed',
      templateCode: 'BOOKING_CONFIRMED',
      channel: 'IN_APP',
      variables: {
        bookingReferenceId: params.bookingReferenceId,
        date: params.date,
        time: params.time,
        centre: params.centreName,
        tokenCode: params.tokenCode
      }
    });
  }

  /**
   * Handle domain event: TokenGenerated
   */
  async notifyTokenGenerated(params: {
    userId: string;
    bookingReferenceId: string;
    tokenCode: string;
  }) {
    return notificationDispatcherService.dispatch({
      userId: params.userId,
      eventType: 'TokenGenerated',
      templateCode: 'TOKEN_GENERATED',
      channel: 'IN_APP',
      variables: {
        bookingReferenceId: params.bookingReferenceId,
        tokenCode: params.tokenCode
      }
    });
  }

  /**
   * Handle domain event: PaymentSuccessful
   */
  async notifyPaymentSuccessful(params: {
    userId: string;
    procurementId: string;
    amount: number;
    utr: string;
  }) {
    return notificationDispatcherService.dispatch({
      userId: params.userId,
      eventType: 'PaymentSuccessful',
      templateCode: 'PAYMENT_SUCCESSFUL',
      channel: 'IN_APP',
      variables: {
        procurementId: params.procurementId,
        amount: params.amount,
        utr: params.utr
      }
    });
  }

  /**
   * Handle domain event: ProcurementRequestSubmitted (Sent to Centre Manager)
   */
  async notifyProcurementRequestSubmitted(params: {
    managerUserId?: string;
    farmerName: string;
    bookingReferenceId: string;
    cropName: string;
    quantityKg: number;
    centreName: string;
  }) {
    const targetUserId = params.managerUserId || '10000000-0000-4000-8000-000000000003';
    return notificationDispatcherService.dispatch({
      userId: targetUserId,
      eventType: 'ProcurementRequestSubmitted',
      templateCode: 'PROCUREMENT_REQUEST_SUBMITTED',
      channel: 'IN_APP',
      variables: {
        farmerName: params.farmerName,
        bookingReferenceId: params.bookingReferenceId,
        cropName: params.cropName,
        quantityKg: params.quantityKg,
        centreName: params.centreName
      }
    });
  }

  /**
   * Handle domain event: ProcurementRequestApproved (Sent to Farmer)
   */
  async notifyProcurementRequestApproved(params: {
    farmerUserId: string;
    bookingReferenceId: string;
    cropName: string;
    quantityKg: number;
    centreName: string;
  }) {
    return notificationDispatcherService.dispatch({
      userId: params.farmerUserId,
      eventType: 'ProcurementRequestApproved',
      templateCode: 'PROCUREMENT_REQUEST_APPROVED',
      channel: 'IN_APP',
      variables: {
        bookingReferenceId: params.bookingReferenceId,
        cropName: params.cropName,
        quantityKg: params.quantityKg,
        centreName: params.centreName
      }
    });
  }

  /**
   * Handle domain event: CentreDisruptionCreated
   */
  async notifyCentreDisruption(params: {
    affectedUserIds: string[];
    centreName: string;
    reason: string;
    expectedEndTime: string;
  }) {
    const results: NotificationRecord[] = [];
    for (const userId of params.affectedUserIds) {
      const notif = await notificationDispatcherService.dispatch({
        userId,
        eventType: 'CentreDisruptionCreated',
        templateCode: 'CENTRE_DISRUPTION',
        channel: 'IN_APP',
        variables: {
          centre: params.centreName,
          reason: params.reason,
          expectedEndTime: params.expectedEndTime
        }
      });
      results.push(notif);
    }
    return results;
  }

  async getUserNotifications(userId: string): Promise<NotificationRecord[]> {
    return notificationRepository.getUserNotifications(userId);
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    return notificationRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return notificationRepository.markAllAsRead(userId);
  }

  async getPreferences(userId: string): Promise<NotificationPreferenceRecord> {
    return notificationRepository.getPreferences(userId);
  }

  async updatePreferences(userId: string, updates: Partial<NotificationPreferenceRecord>): Promise<NotificationPreferenceRecord> {
    return notificationRepository.updatePreferences(userId, updates);
  }

  async getDeliveryStats() {
    return notificationRepository.getDeliveryStats();
  }
}

export const notificationService = new NotificationService();
