import { PaymentProviderAdapter, PaymentSubmissionResult } from './paymentProvider.interface';
import { PaymentRecord } from '../types/payment';
import { logger } from '../utils/logger';

export type MockProviderBehavior = 'SUCCESS' | 'PROCESSING' | 'FAILED' | 'TIMEOUT' | 'RETRYABLE_FAILURE';

export class MockPaymentProvider implements PaymentProviderAdapter {
  public providerName = 'MOCK_BANK_GATEWAY';
  private currentBehavior: MockProviderBehavior = 'SUCCESS';

  /**
   * Configures mock sandbox mode for test scenarios (SUCCESS, FAILED, TIMEOUT, etc.)
   */
  public setBehavior(behavior: MockProviderBehavior): void {
    this.currentBehavior = behavior;
    logger.info(`[MOCK PAYMENT PROVIDER] Behavior set to: ${behavior}`);
  }

  public getBehavior(): MockProviderBehavior {
    return this.currentBehavior;
  }

  async validateDestination(farmerId: string, destinationRef: string): Promise<{ valid: boolean; reason?: string }> {
    if (!destinationRef || destinationRef.trim() === '') {
      return { valid: false, reason: 'Destination account reference is blank or missing.' };
    }
    return { valid: true };
  }

  async submitPayment(payment: PaymentRecord): Promise<PaymentSubmissionResult> {
    logger.info(`[MOCK PAYMENT PROVIDER] Submitting payment ${payment.paymentReferenceId} for ₹${payment.netPayableAmount}`);

    const mockUtring = `UTR-2026-${Math.floor(100000000 + Math.random() * 900000000)}`;

    switch (this.currentBehavior) {
      case 'SUCCESS':
        return {
          success: true,
          status: 'PAYMENT_SUCCESS',
          providerTransactionRef: mockUtring,
          rawPayload: { provider: this.providerName, utr: mockUtring, timestamp: new Date().toISOString() }
        };

      case 'PROCESSING':
        return {
          success: true,
          status: 'PAYMENT_PROCESSING',
          providerTransactionRef: mockUtring,
          rawPayload: { provider: this.providerName, utr: mockUtring, message: 'Bank clearing in progress' }
        };

      case 'FAILED':
        return {
          success: false,
          status: 'PAYMENT_FAILED',
          failureCode: 'INVALID_DESTINATION_ACCOUNT',
          failureReason: 'Bank account validation failed at beneficiary node.',
          rawPayload: { provider: this.providerName, errorCode: 'ERR_ACCOUNT_INVALID' }
        };

      case 'TIMEOUT':
        return {
          success: false,
          status: 'PAYMENT_RETRY',
          failureCode: 'PROVIDER_TIMEOUT',
          failureReason: 'Gateway response timeout during bank clearing handshake.',
          rawPayload: { provider: this.providerName, errorCode: 'ERR_GATEWAY_TIMEOUT' }
        };

      case 'RETRYABLE_FAILURE':
        return {
          success: false,
          status: 'PAYMENT_RETRY',
          failureCode: 'TRANSIENT_NETWORK_FAILURE',
          failureReason: 'Temporary host network congestion at DBT switch.',
          rawPayload: { provider: this.providerName, errorCode: 'ERR_TRANSIENT_NETWORK' }
        };

      default:
        return {
          success: true,
          status: 'PAYMENT_SUCCESS',
          providerTransactionRef: mockUtring
        };
    }
  }

  async getPaymentStatus(providerTransactionRef: string): Promise<PaymentSubmissionResult> {
    return {
      success: true,
      status: 'PAYMENT_SUCCESS',
      providerTransactionRef
    };
  }

  async reversePayment(payment: PaymentRecord, reason: string): Promise<PaymentSubmissionResult> {
    const reversalUtr = `REV-${payment.providerTransactionRef || 'MOCK-UTR'}`;
    logger.info(`[MOCK PAYMENT PROVIDER] Reversing payment ${payment.paymentReferenceId}: ${reason}`);

    return {
      success: true,
      status: 'PAYMENT_REVERSED',
      providerTransactionRef: reversalUtr,
      rawPayload: { reason, timestamp: new Date().toISOString() }
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
