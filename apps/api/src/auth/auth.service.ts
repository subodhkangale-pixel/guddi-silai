import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { LoginInput, RegisterInput } from './auth.schemas.js';
import { AuthResult, PublicUser } from './auth.types.js';
import {
  comparePassword,
  hashPassword,
  parseExpiresIn,
  signToken,
  toPublicUser,
} from './auth.utils.js';

async function issueSession(
  user: Parameters<typeof toPublicUser>[0]
): Promise<AuthResult> {
  const token = signToken({ sub: user.id, type: 'user' });
  return {
    token,
    expiresIn: parseExpiresIn(env.jwt.expiresIn),
    user: toPublicUser(user),
  };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AppError(409, 'Email already in use');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
  });

  return issueSession(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.passwordHash) {
    throw new AppError(401, 'Invalid email or password');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.isActive === false) {
    throw new AppError(403, 'Account is disabled');
  }

  return issueSession(user);
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.isActive === false) {
    throw new AppError(401, 'Authentication required');
  }

  return toPublicUser(user);
}
