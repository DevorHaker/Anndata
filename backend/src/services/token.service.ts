import { tokenRepository } from '../repositories/token.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { farmerDomainRepository } from '../repositories/farmerDomain.repository';
import { centreDomainRepository } from '../repositories/centreDomain.repository';
import { TokenRecord, QRPayload } from '../types/tokenQueue';
import { qrCrypto } from '../utils/qrCrypto';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../utils/errors';
import { auditService } from './audit.service';

export class TokenService {
  /**
   * Generates or retrieves digital token for a confirmed booking
   */
  async generateTokenForBooking(
    bookingId: string,
    actorId: string,
    actorRole: string
  ): Promise<TokenRecord> {
    const booking = await bookingRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking '${bookingId}' not found.`);
    }

    // Ownership check if Farmer
    if (actorRole === 'FARMER') {
      const farmer = await farmerDomainRepository.findFarmerById(booking.farmerId);
      if (farmer && farmer.userId !== actorId) {
        throw new ForbiddenError('You can only generate tokens for your own slot bookings.');
      }
    }

    if (booking.status === 'CANCELLED') {
      throw new ConflictError('Cannot generate token for a cancelled booking.', 'BOOKING_CANCELLED');
    }

    if (booking.status === 'EXPIRED') {
      throw new ConflictError('Cannot generate token for an expired booking.', 'BOOKING_EXPIRED');
    }

    // Centre Operational Check
    const centre = await centreDomainRepository.getCentreById(booking.centreId);
    if (centre && centre.status === 'CLOSED') {
      throw new ConflictError('Procurement centre is CLOSED for operations.', 'CENTRE_CLOSED');
    }

    // Check if token already exists (Idempotent)
    const existing = await tokenRepository.findTokenByBookingId(bookingId);
    if (existing) {
      return existing;
    }

    // Create New Token
    const token = await tokenRepository.createToken(
      booking.id,
      booking.farmerId,
      booking.centreId,
      booking.scheduledDate
    );

    await auditService.recordAudit({
      actorId,
      actorRole,
      action: 'GENERATE_TOKEN',
      entityType: 'TOKEN',
      entityId: token.id,
      ipAddress: '127.0.0.1',
      afterState: {
        tokenCode: token.tokenCode,
        bookingId: booking.id,
        centreId: booking.centreId
      }
    });

    return token;
  }

  async getTokenById(tokenId: string): Promise<TokenRecord> {
    const token = await tokenRepository.findTokenById(tokenId);
    if (!token) {
      throw new NotFoundError(`Token '${tokenId}' not found.`);
    }
    return token;
  }

  async getTokenByBooking(bookingId: string): Promise<TokenRecord> {
    const token = await tokenRepository.findTokenByBookingId(bookingId);
    if (!token) {
      throw new NotFoundError(`No digital token generated for booking '${bookingId}'.`);
    }
    return token;
  }

  async getQRPayload(tokenId: string): Promise<QRPayload> {
    const token = await this.getTokenById(tokenId);
    return qrCrypto.createQRPayload(token.tokenCode, token.id, token.bookingId, token.centreId);
  }
}

export const tokenService = new TokenService();
