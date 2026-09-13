import { pool } from '../database';
import { getRedisClient } from '../database/redis';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceInfo: string | null;
  ipAddress: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const inMemorySessions = new Map<string, SessionRecord>();

export class SessionRepository {
  async createSession(sessionData: {
    userId: string;
    refreshTokenHash: string;
    deviceInfo?: string;
    ipAddress: string;
    expiresAt: Date;
  }): Promise<SessionRecord> {
    const id = uuidv4();
    const session: SessionRecord = {
      id,
      userId: sessionData.userId,
      refreshTokenHash: sessionData.refreshTokenHash,
      deviceInfo: sessionData.deviceInfo || null,
      ipAddress: sessionData.ipAddress,
      isRevoked: false,
      expiresAt: sessionData.expiresAt,
      createdAt: new Date()
    };

    inMemorySessions.set(id, session);

    try {
      const query = `
        INSERT INTO user_sessions (id, user_id, refresh_token_hash, device_info, ip_address, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      await pool.query(query, [
        id,
        sessionData.userId,
        sessionData.refreshTokenHash,
        sessionData.deviceInfo || null,
        sessionData.ipAddress,
        sessionData.expiresAt
      ]);
    } catch (err: any) {
      // Memory fallback active
    }

    try {
      const redis = getRedisClient();
      if (redis) {
        const ttlSeconds = Math.max(1, Math.floor((sessionData.expiresAt.getTime() - Date.now()) / 1000));
        await redis.set(`session:${session.id}`, JSON.stringify({ userId: sessionData.userId, isRevoked: false }), 'EX', ttlSeconds);
      }
    } catch (err: any) {
      logger.warn('Failed to set session in Redis cache', { error: err.message });
    }

    return session;
  }

  async findSessionById(sessionId: string): Promise<SessionRecord | null> {
    try {
      const query = `
        SELECT id, user_id AS "userId", refresh_token_hash AS "refreshTokenHash",
               device_info AS "deviceInfo", ip_address AS "ipAddress",
               is_revoked AS "isRevoked", expires_at AS "expiresAt", created_at AS "createdAt"
        FROM user_sessions WHERE id = $1
      `;
      const res = await pool.query(query, [sessionId]);
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      // Memory fallback
    }
    return inMemorySessions.get(sessionId) || null;
  }

  async findSessionByHash(hash: string): Promise<SessionRecord | null> {
    try {
      const query = `
        SELECT id, user_id AS "userId", refresh_token_hash AS "refreshTokenHash",
               device_info AS "deviceInfo", ip_address AS "ipAddress",
               is_revoked AS "isRevoked", expires_at AS "expiresAt", created_at AS "createdAt"
        FROM user_sessions WHERE refresh_token_hash = $1
      `;
      const res = await pool.query(query, [hash]);
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      // Memory fallback
    }
    for (const s of inMemorySessions.values()) {
      if (s.refreshTokenHash === hash) return s;
    }
    return null;
  }

  async revokeSession(sessionId: string): Promise<void> {
    const mem = inMemorySessions.get(sessionId);
    if (mem) mem.isRevoked = true;

    try {
      const query = `UPDATE user_sessions SET is_revoked = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
      await pool.query(query, [sessionId]);
    } catch (err) {
      // Memory fallback
    }

    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.del(`session:${sessionId}`);
      }
    } catch (err: any) {
      // Ignore
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    for (const s of inMemorySessions.values()) {
      if (s.userId === userId) s.isRevoked = true;
    }

    try {
      const query = `UPDATE user_sessions SET is_revoked = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_revoked = false`;
      await pool.query(query, [userId]);
    } catch (err) {
      // Memory fallback
    }
  }
}

export const sessionRepository = new SessionRepository();
