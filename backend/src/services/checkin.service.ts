import { checkinRepository } from '../repositories/checkin.repository';
import { tokenRepository } from '../repositories/token.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { queueRepository } from '../repositories/queue.repository';
import { centreDomainRepository } from '../repositories/centreDomain.repository';
import { CheckinRecord, QRPayload } from '../types/tokenQueue';
import { qrCrypto } from '../utils/qrCrypto';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../utils/errors';
import { auditService } from './audit.service';
import { realtimeHub } from '../utils/realtimeHub';

export class CheckinService {
  /**
   * Validates QR payload and records gate check-in
   */
  async validateAndCheckin(
    qrPayload: QRPayload,
    scanningCentreId: string,
    checkedInBy: string,
    actorRole: string
  ): Promise<CheckinRecord> {
    // 1. QR Cryptographic Signature & Freshness Validation
    const verifyResult = qrCrypto.verifyQRPayload(qrPayload);
    if (!verifyResult.isValid) {
      throw new ValidationError(`QR Code validation failed: ${verifyResult.reason}`, 'INVALID_QR');
    }

    // 2. Fetch Digital Token
    const token = await tokenRepository.findTokenByCode(qrPayload.tokenCode);
    if (!token) {
      throw new NotFoundError(`Token '${qrPayload.tokenCode}' not found.`);
    }

    // 3. Wrong Centre Protection
    if (token.centreId !== scanningCentreId) {
      throw new ConflictError(
        'This booking is assigned to another procurement centre.',
        'WRONG_CENTRE'
      );
    }

    // 4. Booking Validation
    const booking = await bookingRepository.findBookingById(token.bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking '${token.bookingId}' not found.`);
    }
    if (booking.status === 'CANCELLED') {
      throw new ConflictError('Cannot check in a cancelled booking.', 'BOOKING_CANCELLED');
    }

    // 5. Duplicate Check-in Protection
    const existingCheckin = await checkinRepository.findCheckinByBookingId(booking.id);
    if (existingCheckin) {
      throw new ConflictError('Booking has already been checked in.', 'ALREADY_CHECKED_IN');
    }

    // 6. Record Check-in
    const checkin = await checkinRepository.createCheckin({
      tokenId: token.id,
      bookingId: booking.id,
      centreId: scanningCentreId,
      farmerId: token.farmerId,
      checkedInBy,
      verificationMethod: 'QR_SCAN'
    });

    // 7. Update Token Status
    await tokenRepository.updateTokenStatus(token.id, 'USED', checkin.checkinTimestamp);

    // 8. Enter Token into Live Queue
    const queueEntry = await queueRepository.createQueueEntry({
      centreId: scanningCentreId,
      bookingId: booking.id,
      farmerId: token.farmerId,
      tokenId: token.id,
      tokenCode: token.tokenCode,
      priorityScore: 1.0, // Standard priority
      actorId: checkedInBy
    });

    // 9. Update Booking Status to CHECKED_IN
    await bookingRepository.updateBookingStatus(
      booking.id,
      'CHECKED_IN',
      checkedInBy,
      actorRole,
      'Gate scan check-in completed'
    );

    // 10. Record Security Audit Log
    await auditService.recordAudit({
      actorId: checkedInBy,
      actorRole,
      action: 'GATE_CHECKIN',
      entityType: 'CHECKIN',
      entityId: checkin.id,
      ipAddress: '127.0.0.1',
      afterState: {
        tokenCode: token.tokenCode,
        centreId: scanningCentreId,
        bookingId: booking.id,
        queueEntryId: queueEntry.id
      }
    });

    // 11. Real-time Event Broadcast
    realtimeHub.broadcastQueueEvent(scanningCentreId, 'TOKEN_CHECKED_IN', {
      tokenCode: token.tokenCode,
      queueEntryId: queueEntry.id,
      farmerId: token.farmerId
    });
    realtimeHub.broadcastFarmerEvent(token.farmerId, 'TOKEN_CHECKED_IN', {
      tokenCode: token.tokenCode,
      status: 'WAITING',
      queueEntryId: queueEntry.id
    });

    return checkin;
  }

  /**
   * Manual token-assisted gate check-in
   */
  async checkinByTokenCode(
    tokenCode: string,
    scanningCentreId: string,
    checkedInBy: string,
    actorRole: string
  ): Promise<CheckinRecord> {
    const token = await tokenRepository.findTokenByCode(tokenCode);
    if (!token) {
      throw new NotFoundError(`Token number '${tokenCode}' not found.`);
    }

    if (token.centreId !== scanningCentreId) {
      throw new ConflictError(
        'This booking is assigned to another procurement centre.',
        'WRONG_CENTRE'
      );
    }

    const booking = await bookingRepository.findBookingById(token.bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking '${token.bookingId}' not found.`);
    }

    const existingCheckin = await checkinRepository.findCheckinByBookingId(booking.id);
    if (existingCheckin) {
      throw new ConflictError('Booking has already been checked in.', 'ALREADY_CHECKED_IN');
    }

    const checkin = await checkinRepository.createCheckin({
      tokenId: token.id,
      bookingId: booking.id,
      centreId: scanningCentreId,
      farmerId: token.farmerId,
      checkedInBy,
      verificationMethod: 'MANUAL_OVERRIDE'
    });

    await tokenRepository.updateTokenStatus(token.id, 'USED', checkin.checkinTimestamp);

    const queueEntry = await queueRepository.createQueueEntry({
      centreId: scanningCentreId,
      bookingId: booking.id,
      farmerId: token.farmerId,
      tokenId: token.id,
      tokenCode: token.tokenCode,
      priorityScore: 1.0,
      actorId: checkedInBy
    });

    await bookingRepository.updateBookingStatus(
      booking.id,
      'CHECKED_IN',
      checkedInBy,
      actorRole,
      'Manual token-assisted check-in completed'
    );

    await auditService.recordAudit({
      actorId: checkedInBy,
      actorRole,
      action: 'MANUAL_GATE_CHECKIN',
      entityType: 'CHECKIN',
      entityId: checkin.id,
      ipAddress: '127.0.0.1',
      afterState: {
        tokenCode: token.tokenCode,
        centreId: scanningCentreId,
        bookingId: booking.id
      }
    });

    realtimeHub.broadcastQueueEvent(scanningCentreId, 'TOKEN_CHECKED_IN', {
      tokenCode: token.tokenCode,
      queueEntryId: queueEntry.id
    });

    return checkin;
  }
}

export const checkinService = new CheckinService();
