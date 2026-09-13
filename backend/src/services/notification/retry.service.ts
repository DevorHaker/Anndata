import { FailureClassification, NotificationStatus } from '../../types/notification';
import { logger } from '../../utils/logger';

export class RetryService {
  /**
   * Classify failure as RETRYABLE vs PERMANENT
   */
  classifyFailure(error: any): FailureClassification {
    const message = (error?.message || '').toUpperCase();
    if (
      message.includes('TIMEOUT') ||
      message.includes('UNAVAILABLE') ||
      message.includes('NETWORK') ||
      message.includes('503') ||
      message.includes('500')
    ) {
      return 'RETRYABLE';
    }
    return 'PERMANENT';
  }

  /**
   * Calculate next retry delay using exponential backoff (e.g. 1m, 4m, 16m)
   */
  calculateNextRetryTime(attemptCount: number): string {
    const baseDelaySec = 60;
    const backoffSec = Math.pow(4, attemptCount - 1) * baseDelaySec;
    const nextRetry = new Date(Date.now() + backoffSec * 1000);
    return nextRetry.toISOString();
  }
}

export const retryService = new RetryService();
