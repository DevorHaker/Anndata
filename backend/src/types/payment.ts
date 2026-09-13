export type PaymentStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_VALIDATED'
  | 'PAYMENT_QUEUED'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_RETRY'
  | 'PAYMENT_CANCELLED'
  | 'PAYMENT_REVERSED';

export type PaymentMethod = 'DIRECT_BENEFIT_TRANSFER' | 'BANK_TRANSFER' | 'UPI';

export interface PaymentDestination {
  id: string;
  farmerId: string;
  accountHolderName: string;
  bankName: string;
  accountNumberMasked: string; // e.g. "XXXX XXXX 4521"
  ifscCodeMasked: string;      // e.g. "SBIN0XXXXXX"
  upiIdMasked?: string;
  isVerified: boolean;
}

export interface PaymentRecord {
  id: string;
  paymentReferenceId: string; // e.g. "PAY-20260913-004812"
  procurementId: string;
  procurementReferenceId?: string;
  farmerId: string;
  farmerReferenceId?: string;
  farmerName?: string;
  bookingId?: string;
  centreId: string;
  centreName?: string;
  cropTypeId: string;
  cropName?: string;
  
  // Quantities and Rates
  acceptedQuantityKg: number;
  ratePerQuintal: number;
  ratePerKg: number;
  rateVersion: string;
  
  // Financial Amounts (Authoritative Server-side Calculations)
  grossAmount: number;
  deductionsAmount: number;
  netPayableAmount: number;
  currency: string; // Default "INR"
  
  // Destination and Provider
  paymentMethod: PaymentMethod;
  destinationReference: string; // Masked account or UPI ID
  bankName?: string;
  ifscCode?: string;
  provider: string; // e.g. "MOCK_GATEWAY", "DBT_GATEWAY"
  providerTransactionRef?: string; // Bank UTR or gateway reference
  idempotencyKey: string;
  
  // Lifecycle & Failure state
  status: PaymentStatus;
  failureCode?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  
  // Timestamps
  createdTimestamp: string;
  processingTimestamp?: string;
  completedTimestamp?: string;
  lastUpdatedTimestamp: string;
  version: number;
}

export interface PaymentEventRecord {
  id: string;
  paymentId: string;
  eventType: string;
  previousStatus?: PaymentStatus | null;
  newStatus: PaymentStatus;
  actorType: 'SYSTEM' | 'FARMER' | 'STAFF' | 'ADMIN' | 'WEBHOOK_PROVIDER';
  actorId?: string;
  reason?: string;
  providerReference?: string;
  providerPayload?: any;
  correlationId?: string;
  idempotencyKey?: string;
  createdAt: string;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: Array<{
    code: string;
    message: string;
  }>;
  warnings: string[];
}

export interface ReconciliationRecord {
  id: string;
  paymentId: string;
  internalReference: string;
  providerReference?: string;
  expectedAmount: number;
  processedAmount: number;
  internalStatus: PaymentStatus;
  providerStatus: string;
  reconciliationState:
    | 'MATCHED'
    | 'MISMATCH'
    | 'MISSING_PROVIDER_RECORD'
    | 'MISSING_INTERNAL_RECORD'
    | 'PENDING_REVIEW'
    | 'RESOLVED';
  notes?: string;
  reconciledAt: string;
}

export interface TraceabilityStep {
  stepNumber: number;
  stepKey: string;
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'FAILED' | 'SKIPPED';
  timestamp?: string;
  actor?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface EndToEndTimeline {
  procurementId: string;
  procurementReferenceId: string;
  farmerId: string;
  farmerName?: string;
  centreId: string;
  centreName?: string;
  cropTypeId: string;
  overallStatus: string;
  steps: TraceabilityStep[];
  generatedAt: string;
}
