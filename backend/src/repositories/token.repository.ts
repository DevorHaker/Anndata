import { pool } from '../database';
import { logger } from '../utils/logger';
import { TokenRecord, TokenStatus } from '../types/tokenQueue';
import { qrCrypto } from '../utils/qrCrypto';
import { v4 as uuidv4 } from 'uuid';

class TokenRepository {
  private memoryTokensByBooking: Map<string, TokenRecord> = new Map();
  private memoryTokensById: Map<string, TokenRecord> = new Map();
  private memoryTokensByCode: Map<string, TokenRecord> = new Map();
  private memoryCentreSequences: Map<string, number> = new Map();

  /**
   * Generates a unique, human-friendly token number for a centre on a given date (e.g. T-023)
   */
  public async getNextTokenSequence(centreId: string, dateStr: string): Promise<{ sequenceNumber: number; tokenCode: string }> {
    const sequenceKey = `${centreId}:${dateStr}`;
    let sequenceNumber = 1;

    try {
      // Atomic increment SQL query using PostgreSQL sequence or ON CONFLICT lock
      const res = await pool.query(
        `INSERT INTO token_sequences (centre_id, service_date, last_sequence)
         VALUES ($1, $2, 1)
         ON CONFLICT (centre_id, service_date)
         DO UPDATE SET last_sequence = token_sequences.last_sequence + 1
         RETURNING last_sequence;`,
        [centreId, dateStr]
      );
      if (res.rows.length > 0) {
        sequenceNumber = res.rows[0].last_sequence;
      }
    } catch (err) {
      // Memory fallback for sequence increment
      const current = this.memoryCentreSequences.get(sequenceKey) || 0;
      sequenceNumber = current + 1;
      this.memoryCentreSequences.set(sequenceKey, sequenceNumber);
    }

    const paddedSeq = sequenceNumber.toString().padStart(3, '0');
    const tokenCode = `T-${paddedSeq}`;
    return { sequenceNumber, tokenCode };
  }

  /**
   * Creates a new token record for a booking with HMAC signature
   */
  public async createToken(
    bookingId: string,
    farmerId: string,
    centreId: string,
    scheduledDate: string
  ): Promise<TokenRecord> {
    // 1. Idempotency Check: return existing token if already generated for this booking
    const existing = await this.findTokenByBookingId(bookingId);
    if (existing) {
      return existing;
    }

    // 2. Generate Next Sequence & Token Code
    const { tokenCode } = await this.getNextTokenSequence(centreId, scheduledDate);

    // 3. Generate HMAC Signature
    const tokenId = uuidv4();
    const now = new Date();
    const issuedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(); // 48h validity window

    const hmacSignature = qrCrypto.generateSignature(tokenCode, bookingId, centreId, now.getTime());

    const token: TokenRecord = {
      id: tokenId,
      tokenCode,
      bookingId,
      farmerId,
      centreId,
      hmacSignature,
      status: 'ACTIVE',
      expiresAt,
      issuedAt,
      usedAt: null,
      createdAt: issuedAt,
      updatedAt: issuedAt
    };

    try {
      const query = `
        INSERT INTO tokens (
          id, token_code, booking_id, farmer_id, centre_id, hmac_signature,
          status, expires_at, issued_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;
      const values = [
        token.id,
        token.tokenCode,
        token.bookingId,
        token.farmerId,
        token.centreId,
        token.hmacSignature,
        token.status,
        token.expiresAt,
        token.issuedAt,
        token.createdAt,
        token.updatedAt
      ];
      await pool.query(query, values);
    } catch (err) {
      // Memory fallback active
    }

    this.memoryTokensByBooking.set(bookingId, token);
    this.memoryTokensById.set(token.id, token);
    this.memoryTokensByCode.set(token.tokenCode, token);

    return token;
  }

  public async findTokenById(id: string): Promise<TokenRecord | null> {
    try {
      const res = await pool.query(`SELECT * FROM tokens WHERE id = $1`, [id]);
      if (res.rows.length > 0) {
        return this.mapDbRowToToken(res.rows[0]);
      }
    } catch (err) {
      // Fallback
    }
    return this.memoryTokensById.get(id) || null;
  }

  public async findTokenByBookingId(bookingId: string): Promise<TokenRecord | null> {
    try {
      const res = await pool.query(`SELECT * FROM tokens WHERE booking_id = $1`, [bookingId]);
      if (res.rows.length > 0) {
        return this.mapDbRowToToken(res.rows[0]);
      }
    } catch (err) {
      // Fallback
    }
    return this.memoryTokensByBooking.get(bookingId) || null;
  }

  public async findTokenByCode(tokenCode: string): Promise<TokenRecord | null> {
    try {
      const res = await pool.query(`SELECT * FROM tokens WHERE token_code = $1`, [tokenCode]);
      if (res.rows.length > 0) {
        return this.mapDbRowToToken(res.rows[0]);
      }
    } catch (err) {
      // Fallback
    }
    return this.memoryTokensByCode.get(tokenCode) || null;
  }

  public async updateTokenStatus(tokenId: string, status: TokenStatus, usedAt?: string): Promise<TokenRecord | null> {
    const token = await this.findTokenById(tokenId);
    if (!token) return null;

    token.status = status;
    if (usedAt) token.usedAt = usedAt;
    token.updatedAt = new Date().toISOString();

    try {
      await pool.query(
        `UPDATE tokens SET status = $1, used_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [status, usedAt || null, tokenId]
      );
    } catch (err) {
      // Fallback
    }

    this.memoryTokensById.set(tokenId, token);
    this.memoryTokensByBooking.set(token.bookingId, token);
    this.memoryTokensByCode.set(token.tokenCode, token);

    return token;
  }

  private mapDbRowToToken(row: any): TokenRecord {
    return {
      id: row.id,
      tokenCode: row.token_code,
      bookingId: row.booking_id,
      farmerId: row.farmer_id,
      centreId: row.centre_id,
      hmacSignature: row.hmac_signature,
      status: row.status as TokenStatus,
      expiresAt: new Date(row.expires_at).toISOString(),
      issuedAt: new Date(row.issued_at).toISOString(),
      usedAt: row.used_at ? new Date(row.used_at).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString()
    };
  }
}

export const tokenRepository = new TokenRepository();
