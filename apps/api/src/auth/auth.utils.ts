import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

import { env } from '../config/env.js';
import {
  GoogleProfile,
  JwtPayload,
  PublicUser,
} from './auth.types.js';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.bcrypt.rounds);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.secret) as JwtPayload;
}

export function signGuestToken(guestId: string): string {
  return jwt.sign({ sub: guestId, type: 'guest' }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function signAdminToken(adminId: string): string {
  return jwt.sign({ sub: adminId, type: 'admin' }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!env.google.clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }
  const client = new OAuth2Client(env.google.clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.google.clientId,
  });
  const payload = ticket.getPayload();
  return {
    googleId: payload?.sub ?? '',
    email: payload?.email ?? null,
    emailVerified: payload?.email_verified ?? false,
    name: payload?.name ?? '',
    picture: payload?.picture ?? null,
  };
}

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

export function parseExpiresIn(value: string, fallbackDays = 7): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return fallbackDays * 86400;
  const amount = Number(match[1]);
  const unit = match[2];
  const seconds = UNIT_SECONDS[unit] ?? 86400;
  return amount * seconds;
}

type UserForPublic = {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  avatar: string | null;
  createdAt: Date;
};

export function toPublicUser(user: UserForPublic): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

export function parseTokenType(type: string): 'user' | 'guest' | 'admin' | null {
  return type === 'user' || type === 'guest' || type === 'admin' ? type : null;
}
