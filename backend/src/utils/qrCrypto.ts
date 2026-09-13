import crypto from 'crypto';
import { QRPayload } from '../types/tokenQueue';
import { env } from '../config/env';

const SECRET_KEY = env.JWT_SECRET || 'smart-procure-qr-secret-key-2026';

export class QRCrypto {
  /**
   * Generates a secure HMAC-SHA256 signature for a token reference
   */
  public generateSignature(tokenCode: string, bookingId: string, centreId: string, timestamp: number): string {
    const payloadStr = `${tokenCode}:${bookingId}:${centreId}:${timestamp}`;
    return crypto.createHmac('sha256', SECRET_KEY).update(payloadStr).digest('hex');
  }

  /**
   * Constructs an opaque, secure QR payload containing no PII (no Aadhaar, no bank info, no name)
   */
  public createQRPayload(tokenCode: string, tokenId: string, bookingId: string, centreId: string): QRPayload {
    const timestamp = Date.now();
    const signature = this.generateSignature(tokenCode, bookingId, centreId, timestamp);
    return {
      type: 'PROCUREMENT_CHECKIN',
      tokenCode,
      tokenId,
      bookingId,
      centreId,
      timestamp,
      signature,
      version: 1
    };
  }

  /**
   * Validates QR payload cryptographic signature and timestamp freshness
   */
  public verifyQRPayload(payload: QRPayload): { isValid: boolean; reason?: string } {
    if (!payload || payload.type !== 'PROCUREMENT_CHECKIN') {
      return { isValid: false, reason: 'INVALID_QR_TYPE' };
    }

    if (!payload.tokenCode || !payload.bookingId || !payload.centreId || !payload.signature) {
      return { isValid: false, reason: 'MALFORMED_QR_PAYLOAD' };
    }

    const expectedSignature = this.generateSignature(
      payload.tokenCode,
      payload.bookingId,
      payload.centreId,
      payload.timestamp
    );

    // Timing safe comparison to protect against timing attacks
    const sigBuffer = Buffer.from(payload.signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { isValid: false, reason: 'INVALID_QR_SIGNATURE' };
    }

    // Check payload expiration (e.g. max 48 hours for checkin window)
    const MAX_AGE_MS = 48 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > MAX_AGE_MS) {
      return { isValid: false, reason: 'QR_EXPIRED' };
    }

    return { isValid: true };
  }
}

export const qrCrypto = new QRCrypto();
