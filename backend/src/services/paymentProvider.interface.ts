import { PaymentRecord, PaymentStatus } from '../types/payment';

export interface PaymentSubmissionResult {
  success: boolean;
  status: PaymentStatus;
  providerTransactionRef?: string;
  failureCode?: string;
  failureReason?: string;
  rawPayload?: any;
}

export interface PaymentProviderAdapter {
  providerName: string;

  validateDestination(farmerId: string, destinationRef: string): Promise<{ valid: boolean; reason?: string }>;

  submitPayment(payment: PaymentRecord): Promise<PaymentSubmissionResult>;

  getPaymentStatus(providerTransactionRef: string): Promise<PaymentSubmissionResult>;

  reversePayment(payment: PaymentRecord, reason: string): Promise<PaymentSubmissionResult>;
}
