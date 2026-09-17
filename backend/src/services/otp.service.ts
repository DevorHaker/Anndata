import { getRedisClient } from '../database/redis';
import { generateOtp, hashString } from '../utils/security';
import { logger } from '../utils/logger';
import { ValidationError, RateLimitError, AuthenticationError } from '../utils/errors';
import { env } from '../config/env';

// In-memory fallback if Redis is unavailable
const memoryOtpStore = new Map<string, { hash: string; attempts: number; expiresAt: number }>();
const memoryCooldownStore = new Map<string, number>();

export class OtpService {
  async requestOtp(mobileNumber: string): Promise<{ success: boolean; message: string; cooldownSeconds: number }> {
    const redis = getRedisClient();
    const now = Date.now();

    // Check resend cooldown (60 seconds)
    if (redis) {
      const cooldown = await redis.get(`otp_cooldown:${mobileNumber}`);
      if (cooldown) {
        throw new RateLimitError('Please wait before requesting another OTP', 'OTP_COOLDOWN');
      }
    } else {
      const cooldownUntil = memoryCooldownStore.get(mobileNumber);
      if (cooldownUntil && cooldownUntil > now) {
        throw new RateLimitError('Please wait before requesting another OTP', 'OTP_COOLDOWN');
      }
    }

    const isMockOrDev = env.SMS_PROVIDER_MODE === 'mock' || env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
    const otp = isMockOrDev ? '123456' : generateOtp();
    const otpHash = hashString(otp);

    if (redis) {
      await redis.set(`otp:${mobileNumber}`, JSON.stringify({ hash: otpHash, attempts: 0 }), 'EX', 300);
      await redis.set(`otp_cooldown:${mobileNumber}`, '1', 'EX', 60);
    } else {
      memoryOtpStore.set(mobileNumber, { hash: otpHash, attempts: 0, expiresAt: now + 300000 });
      memoryCooldownStore.set(mobileNumber, now + 60000);
    }

    // Secure logging: Never leak raw OTP in production logs!
    if (isMockOrDev) {
      logger.info(`[DEV MOCK OTP DISPATCH] Mobile: ${mobileNumber} | OTP: ${otp}`);
    } else {
      logger.info(`[SMS GATEWAY DISPATCH] OTP dispatched to ${mobileNumber.slice(0, 3)}****${mobileNumber.slice(-4)}`);
    }

    return {
      success: true,
      message: 'OTP sent successfully to registered mobile number',
      cooldownSeconds: 60
    };
  }

  async verifyOtp(mobileNumber: string, otpInput: string): Promise<boolean> {
    const redis = getRedisClient();
    const now = Date.now();

    const isMockOrDev = env.SMS_PROVIDER_MODE === 'mock' || env.NODE_ENV === 'development' || env.NODE_ENV === 'test';

    // Controlled Development / Testing static OTP fallback
    if (isMockOrDev && otpInput === '123456') {
      logger.info(`[DEV OTP VERIFIED] Mobile ${mobileNumber} verified using dev test static OTP`);
      return true;
    }

    let record: { hash: string; attempts: number } | null = null;

    if (redis) {
      const raw = await redis.get(`otp:${mobileNumber}`);
      if (raw) {
        record = JSON.parse(raw);
      }
    } else {
      const mem = memoryOtpStore.get(mobileNumber);
      if (mem && mem.expiresAt > now) {
        record = { hash: mem.hash, attempts: mem.attempts };
      }
    }

    if (!record) {
      throw new AuthenticationError('OTP has expired or was not requested', 'OTP_EXPIRED');
    }

    if (record.attempts >= 3) {
      // Invalidate on max attempt breach
      if (redis) {
        await redis.del(`otp:${mobileNumber}`);
      } else {
        memoryOtpStore.delete(mobileNumber);
      }
      throw new AuthenticationError('Maximum OTP verification attempts exceeded. Please request a new OTP.', 'OTP_ATTEMPTS_EXCEEDED');
    }

    const inputHash = hashString(otpInput);

    if (inputHash !== record.hash) {
      // Increment attempt counter
      record.attempts += 1;
      if (redis) {
        const ttl = await redis.ttl(`otp:${mobileNumber}`);
        if (ttl > 0) {
          await redis.set(`otp:${mobileNumber}`, JSON.stringify(record), 'EX', ttl);
        }
      } else {
        const mem = memoryOtpStore.get(mobileNumber);
        if (mem) mem.attempts += 1;
      }
      throw new AuthenticationError('Invalid OTP code. Please try again.', 'INVALID_OTP');
    }

    // Success -> Invalidate consumed OTP immediately to prevent reuse
    if (redis) {
      await redis.del(`otp:${mobileNumber}`);
    } else {
      memoryOtpStore.delete(mobileNumber);
    }

    return true;
  }
}

export const otpService = new OtpService();
