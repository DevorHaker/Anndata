export interface FarmerAnalyticsMetrics {
  totalRegistrations: number;
  verifiedFarmers: number;
  activeFarmers: number;
  bookingCompletionRatePct: number;
  cancellationRatePct: number;
  noShowRatePct: number;
}

export interface CentrePerformanceMetrics {
  centreId: string;
  centreName: string;
  slotUtilizationPct: number;
  dailyThroughputQuintals: number;
  currentQueueLength: number;
  avgWaitMinutes: number;
  p50WaitMinutes: number;
  p95WaitMinutes: number;
  avgServiceMinutes: number;
  p50ServiceMinutes: number;
  p95ServiceMinutes: number;
  turnaroundTimeMinutes: number;
  congestionFrequency: number;
}

export interface ProcurementAnalyticsMetrics {
  totalQuantityReceivedKg: number;
  acceptedQuantityKg: number;
  rejectedQuantityKg: number;
  partialAcceptanceCount: number;
  rejectionRatePct: number;
  avgProcurementDurationMinutes: number;
}

export interface PaymentAnalyticsMetrics {
  totalPaymentVolumeINR: number;
  successfulPaymentsCount: number;
  failedPaymentsCount: number;
  pendingPaymentsCount: number;
  avgPaymentProcessingHours: number;
  procurementToPaymentAvgHours: number;
  reconciliationMismatchRatePct: number;
}

export interface IntelligenceAnalyticsMetrics {
  totalRecommendationsGenerated: number;
  recommendationAcceptanceRatePct: number;
  etaMeanAbsoluteErrorMinutes: number;
  congestionPredictionAccuracyPct: number;
}

export interface SystemHealthAnalyticsMetrics {
  notificationDeliveryRatePct: number;
  notificationFailureRatePct: number;
  offlineActionsSynced: number;
  syncConflictRatePct: number;
  systemUptimePct: number;
  securityEventsCount: number;
}

export interface ExecutiveDashboardSummary {
  timestamp: string;
  reportingTimezone: 'Asia/Kolkata';
  farmer: FarmerAnalyticsMetrics;
  centre: CentrePerformanceMetrics;
  procurement: ProcurementAnalyticsMetrics;
  payment: PaymentAnalyticsMetrics;
  intelligence: IntelligenceAnalyticsMetrics;
  systemHealth: SystemHealthAnalyticsMetrics;
}
