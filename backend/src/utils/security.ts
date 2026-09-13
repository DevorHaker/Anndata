import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { AuthenticationError } from './errors';

export interface JwtAccessPayload {
  sub: string; // User ID
  mobileNumber: string;
  role: string;
  farmerId?: string | null;
  centreId?: string | null;
  sessionId: string;
  permissions: string[];
}

export interface JwtRefreshPayload {
  sub: string;
  sessionId: string;
  tokenFamily?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashString(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateOtp(): string {
  // Cryptographically secure 6-digit OTP
  const buffer = crypto.randomBytes(4);
  const number = buffer.readUInt32BE(0) % 1000000;
  return number.toString().padStart(6, '0');
}

export function generateAccessToken(payload: JwtAccessPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m'
  });
}

export function generateRefreshToken(payload: JwtRefreshPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d'
  });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtAccessPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthenticationError('Access token has expired', 'TOKEN_EXPIRED');
    }
    throw new AuthenticationError('Invalid access token signature or format', 'INVALID_TOKEN');
  }
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtRefreshPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthenticationError('Refresh token has expired', 'TOKEN_EXPIRED');
    }
    throw new AuthenticationError('Invalid refresh token signature or format', 'INVALID_TOKEN');
  }
}
