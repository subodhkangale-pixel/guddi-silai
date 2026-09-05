import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  GoogleInput,
  LoginInput,
  MergeInput,
  RegisterInput,
} from './auth.schemas.js';
import { AuthResult, GuestResult, PublicUser } from './auth.types.js';
import {
  comparePassword,
  hashPassword,
  parseExpiresIn,
  signGuestToken,
  signToken,
  toPublicUser,
  verifyGoogleIdToken,
  verifyToken,
} from './auth.utils.js';
import { CartItem } from '@prisma/client';
import { randomUUID } from 'node:crypto';

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
      // MongoDB unique indexes allow only one null. Keep email/password users
      // distinct until a verified Google account is linked by email.
      googleId: `email-${randomUUID()}`,
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

export async function createGuest(): Promise<GuestResult> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const user = await prisma.user.create({
    data: {
      name: `Guest ${suffix}`,
      email: `guest-${suffix}@guest.guddisilai.local`,
      googleId: `guest-${suffix}`,
      isGuest: true,
    },
  });

  return {
    token: signGuestToken(user.id),
    expiresIn: parseExpiresIn(env.jwt.expiresIn),
    guest: { id: user.id, name: user.name },
  };
}

export async function loginWithGoogle(input: GoogleInput): Promise<AuthResult> {
  let profile;
  try {
    profile = await verifyGoogleIdToken(input.idToken);
  } catch {
    throw new AppError(401, 'Invalid Google token');
  }

  if (!profile.googleId) {
    throw new AppError(401, 'Invalid Google token');
  }
  if (profile.email && !profile.emailVerified) {
    throw new AppError(403, 'Please verify your Google email address');
  }

  const existingByGoogle = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });
  if (existingByGoogle) {
    if (existingByGoogle.isActive === false) {
      throw new AppError(403, 'Account is disabled');
    }
    return issueSession(existingByGoogle);
  }

  if (profile.email) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (existingByEmail) {
      if (existingByEmail.isActive === false) {
        throw new AppError(403, 'Account is disabled');
      }
      if (existingByEmail.isGuest) {
        const upgraded = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            name: profile.name || existingByEmail.name,
            googleId: profile.googleId,
            avatar: profile.picture,
            isGuest: false,
          },
        });
        return issueSession(upgraded);
      }
      const linked = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: profile.googleId,
          avatar: profile.picture ?? existingByEmail.avatar,
        },
      });
      return issueSession(linked);
    }
  }

  const user = await prisma.user.create({
    data: {
      name: profile.name || 'Google User',
      email: profile.email,
      googleId: profile.googleId,
      avatar: profile.picture,
    },
  });

  return issueSession(user);
}

export async function mergeGuestCart(
  userId: string,
  guestToken: MergeInput['guestToken']
): Promise<{ merged: boolean; itemsMerged: number }> {
  let payload;
  try {
    payload = verifyToken(guestToken);
  } catch {
    throw new AppError(401, 'Invalid guest token');
  }

  const guestId = payload?.sub;
  if (payload?.type !== 'guest' || !guestId) {
    throw new AppError(401, 'Invalid guest token');
  }
  if (guestId === userId) {
    throw new AppError(400, 'Nothing to merge');
  }

  const guestUser = await prisma.user.findUnique({ where: { id: guestId } });
  if (!guestUser || guestUser.isGuest !== true) {
    throw new AppError(400, 'Invalid guest session');
  }

  const [guestCart, userCart] = await Promise.all([
    prisma.cart.findUnique({ where: { ownerKey: guestId } }),
    prisma.cart.findFirst({ where: { userId } }),
  ]);

  if (!guestCart || guestCart.items.length === 0) {
    await prisma.user.update({
      where: { id: guestId },
      data: { isActive: false },
    });
    return { merged: false, itemsMerged: 0 };
  }

  const mergedItems = mergeCartItems(userCart?.items ?? [], guestCart.items);
  const totalItems = mergedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Number(
    mergedItems
      .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      .toFixed(2)
  );

  if (userCart) {
    await prisma.cart.update({
      where: { id: userCart.id },
      data: { items: mergedItems, totalItems, totalPrice },
    });
  } else {
    await prisma.cart.create({
      data: {
        ownerKey: userId,
        userId,
        items: mergedItems,
        totalItems,
        totalPrice,
      },
    });
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
  await prisma.order.updateMany({ where: { userId: guestId }, data: { userId } });
  await prisma.user.update({
    where: { id: guestId },
    data: { isActive: false },
  });

  return { merged: true, itemsMerged: guestCart.items.length };
}

function cartItemKey(item: CartItem): string {
  const measurementKey = item.measurementValues
    ? JSON.stringify(item.measurementValues)
    : '';
  return [
    item.productId,
    item.variantId ?? '',
    item.colorId ?? '',
    item.sizeId ?? '',
    item.fiberId ?? '',
    item.embroideryId ?? '',
    measurementKey,
  ].join(':');
}

function mergeCartItems(base: CartItem[], incoming: CartItem[]): CartItem[] {
  const byKey = new Map<string, CartItem>();
  for (const item of base) byKey.set(cartItemKey(item), { ...item });
  for (const item of incoming) {
    const key = cartItemKey(item);
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      byKey.set(key, { ...item });
    }
  }
  return Array.from(byKey.values());
}
