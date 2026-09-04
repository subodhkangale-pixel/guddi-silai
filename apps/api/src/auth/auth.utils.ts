import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { JwtPayload, PublicUser } from './auth.types.js';

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
