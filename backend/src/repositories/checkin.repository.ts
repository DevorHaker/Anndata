import { pool } from '../database';
import { logger } from '../utils/logger';
import { CheckinRecord } from '../types/tokenQueue';
import { v4 as uuidv4 } from 'uuid';

class CheckinRepository {
  private memoryCheckinsByBooking: Map<string, CheckinRecord> = new Map();
  private memoryCheckinsByToken: Map<string, CheckinRecord> = new Map();

  public async createCheckin(params: {
    tokenId: string;
    bookingId: string;
    centreId: string;
    farmerId: string;
    checkedInBy: string;
    verificationMethod: 'QR_SCAN' | 'MANUAL_OVERRIDE';
    deviceMetadata?: any;
  }): Promise<CheckinRecord> {
    const existing = await this.findCheckinByBookingId(params.bookingId);
    if (existing) {
      return existing;
    }

    const checkinId = uuidv4();
    const now = new Date().toISOString();

    const record: CheckinRecord = {
      id: checkinId,
      tokenId: params.tokenId,
      bookingId: params.bookingId,
      centreId: params.centreId,
      farmerId: params.farmerId,
      checkedInBy: params.checkedInBy,
      verificationMethod: params.verificationMethod,
      checkinTimestamp: now,
      deviceMetadata: params.deviceMetadata || null,
      createdAt: now
    };

    try {
      const query = `
        INSERT INTO checkins (
          id, token_id, booking_id, centre_id, farmer_id, checked_in_by,
          verification_method, checkin_timestamp, device_metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      const values = [
        record.id,
        record.tokenId,
        record.bookingId,
        record.centreId,
        record.farmerId,
        record.checkedInBy,
        record.verificationMethod,
        record.checkinTimestamp,
        record.deviceMetadata ? JSON.stringify(record.deviceMetadata) : null,
        record.createdAt
      ];
      await pool.query(query, values);
    } catch (err) {
      // Memory fallback active
    }

    this.memoryCheckinsByBooking.set(params.bookingId, record);
    this.memoryCheckinsByToken.set(params.tokenId, record);

    return record;
  }

  public async findCheckinByBookingId(bookingId: string): Promise<CheckinRecord | null> {
    try {
      const res = await pool.query(`SELECT * FROM checkins WHERE booking_id = $1`, [bookingId]);
      if (res.rows.length > 0) {
        return this.mapDbRowToCheckin(res.rows[0]);
      }
    } catch (err) {
      // Fallback
    }
    return this.memoryCheckinsByBooking.get(bookingId) || null;
  }

  public async findCheckinByTokenId(tokenId: string): Promise<CheckinRecord | null> {
    try {
      const res = await pool.query(`SELECT * FROM checkins WHERE token_id = $1`, [tokenId]);
      if (res.rows.length > 0) {
        return this.mapDbRowToCheckin(res.rows[0]);
      }
    } catch (err) {
      // Fallback
    }
    return this.memoryCheckinsByToken.get(tokenId) || null;
  }

  private mapDbRowToCheckin(row: any): CheckinRecord {
    return {
      id: row.id,
      tokenId: row.token_id,
      bookingId: row.booking_id,
      centreId: row.centre_id,
      farmerId: row.farmer_id,
      checkedInBy: row.checked_in_by,
      verificationMethod: row.verification_method,
      checkinTimestamp: new Date(row.checkin_timestamp).toISOString(),
      deviceMetadata: row.device_metadata ? JSON.parse(JSON.stringify(row.device_metadata)) : null,
      createdAt: new Date(row.created_at).toISOString()
    };
  }
}

export const checkinRepository = new CheckinRepository();
