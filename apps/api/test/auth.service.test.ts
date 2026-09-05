import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    cart: {
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      updateMany: vi.fn(),
    },
  },
  verifyGoogleIdToken: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock('../src/lib/prisma.js', () => ({ prisma: mocks.prisma }));

vi.mock('../src/auth/auth.utils.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../src/auth/auth.utils.js')>();
  return {
    ...mod,
    verifyGoogleIdToken: mocks.verifyGoogleIdToken,
    verifyToken: mocks.verifyToken,
  };
});

import jwt from 'jsonwebtoken';

import * as authService from '../src/auth/auth.service.js';

function resetAll() {
  mocks.prisma.user.create.mockReset();
  mocks.prisma.user.findUnique.mockReset();
  mocks.prisma.user.update.mockReset();
  mocks.prisma.cart.create.mockReset();
  mocks.prisma.cart.delete.mockReset();
  mocks.prisma.cart.findFirst.mockReset();
  mocks.prisma.cart.findUnique.mockReset();
  mocks.prisma.cart.update.mockReset();
  mocks.prisma.order.updateMany.mockReset();
  mocks.verifyGoogleIdToken.mockReset();
  mocks.verifyToken.mockReset();
}

function guestUser(id: string) {
  return { id, name: 'Guest xyz123', isGuest: true };
}

const guestItem = {
  productType: 'READY_MADE',
  productId: 'p1',
  productName: 'Banarasi Blouse',
  variantId: 'v1',
  unitPrice: 500,
  quantity: 2,
};

describe('createGuest', () => {
  beforeEach(resetAll);

  it('creates a guest user and issues a guest-type token', async () => {
    mocks.prisma.user.create.mockResolvedValue(guestUser('guest-1'));

    const result = await authService.createGuest();

    expect(result.guest.id).toBe('guest-1');
    expect(result.expiresIn).toBeGreaterThan(0);
    expect(mocks.prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isGuest: true }),
    });
    const decoded = jwt.decode(result.token) as jwt.JwtPayload;
    expect(decoded.sub).toBe('guest-1');
    expect(decoded.type).toBe('guest');
  });
});

describe('loginWithGoogle', () => {
  beforeEach(resetAll);

  it('logs in an existing Google-linked account', async () => {
    mocks.verifyGoogleIdToken.mockResolvedValue({
      googleId: 'google-1',
      email: 'anita@example.com',
      emailVerified: true,
      name: 'Anita',
      picture: null,
    });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Anita',
      email: 'anita@example.com',
      googleId: 'google-1',
      isActive: true,
      isGuest: false,
    });

    const result = await authService.loginWithGoogle({ idToken: 'id-token' });

    expect(result.user.id).toBe('user-1');
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { googleId: 'google-1' },
    });
  });

  it('links Google identity to an existing account by verified email', async () => {
    mocks.verifyGoogleIdToken.mockResolvedValue({
      googleId: 'google-1',
      email: 'anita@example.com',
      emailVerified: true,
      name: 'Anita',
      picture: 'http://img',
    });
    mocks.prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user-2',
        name: 'Anita',
        email: 'anita@example.com',
        googleId: null,
        isActive: true,
        isGuest: false,
      });
    mocks.prisma.user.update.mockResolvedValue({
      id: 'user-2',
      name: 'Anita',
      email: 'anita@example.com',
      googleId: 'google-1',
      isActive: true,
      isGuest: false,
    });

    const result = await authService.loginWithGoogle({ idToken: 'id-token' });

    expect(result.user.id).toBe('user-2');
    expect(mocks.prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ googleId: 'google-1' }),
      })
    );
  });

  it('upgrades a guest account to a full account on Google login', async () => {
    mocks.verifyGoogleIdToken.mockResolvedValue({
      googleId: 'google-1',
      email: 'guest@example.com',
      emailVerified: true,
      name: 'Anita',
      picture: null,
    });
    mocks.prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'guest-1',
        name: 'Guest abc',
        email: 'guest@example.com',
        googleId: null,
        isActive: true,
        isGuest: true,
      });
    mocks.prisma.user.update.mockResolvedValue({
      id: 'guest-1',
      name: 'Anita',
      email: 'guest@example.com',
      googleId: 'google-1',
      isActive: true,
      isGuest: false,
    });

    const result = await authService.loginWithGoogle({ idToken: 'id-token' });

    expect(result.user.id).toBe('guest-1');
    const update = mocks.prisma.user.update.mock.calls[0][0] as {
      data: { isGuest: boolean };
    };
    expect(update.data.isGuest).toBe(false);
  });

  it('creates a new user when no account matches', async () => {
    mocks.verifyGoogleIdToken.mockResolvedValue({
      googleId: 'google-new',
      email: 'new@example.com',
      emailVerified: true,
      name: 'New User',
      picture: 'http://img',
    });
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.user.create.mockResolvedValue({
      id: 'user-new',
      name: 'New User',
      email: 'new@example.com',
      googleId: 'google-new',
      isActive: true,
      isGuest: false,
      createdAt: new Date(),
    });

    const result = await authService.loginWithGoogle({ idToken: 'id-token' });

    expect(result.user.id).toBe('user-new');
    expect(mocks.prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'New User',
        email: 'new@example.com',
        googleId: 'google-new',
        avatar: 'http://img',
      },
    });
  });

  it('rejects an unverified Google email', async () => {
    mocks.verifyGoogleIdToken.mockResolvedValue({
      googleId: 'google-1',
      email: 'anita@example.com',
      emailVerified: false,
      name: 'Anita',
      picture: null,
    });

    await expect(
      authService.loginWithGoogle({ idToken: 'id-token' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects an invalid Google token', async () => {
    mocks.verifyGoogleIdToken.mockRejectedValue(new Error('invalid token'));

    await expect(
      authService.loginWithGoogle({ idToken: 'bad-token' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('mergeGuestCart', () => {
  beforeEach(resetAll);

  it('moves a guest cart into an empty user cart and invalidates the guest', async () => {
    mocks.verifyToken.mockReturnValue({ sub: 'guest-1', type: 'guest' });
    mocks.prisma.user.findUnique.mockResolvedValue(guestUser('guest-1'));
    mocks.prisma.cart.findUnique.mockResolvedValue({
      id: 'cart-g',
      ownerKey: 'guest-1',
      items: [guestItem],
    });
    mocks.prisma.cart.findFirst.mockResolvedValue(null);
    mocks.prisma.cart.create.mockResolvedValue({ id: 'cart-u' });

    const result = await authService.mergeGuestCart('user-1', 'guest-token');

    expect(result).toEqual({ merged: true, itemsMerged: 1 });
    const created = mocks.prisma.cart.create.mock.calls[0][0] as {
      data: { ownerKey: string; userId: string; items: unknown[] };
    };
    expect(created.data.ownerKey).toBe('user-1');
    expect(created.data.userId).toBe('user-1');
    expect(created.data.items).toHaveLength(1);
    expect(mocks.prisma.cart.delete).toHaveBeenCalledWith({
      where: { id: 'cart-g' },
    });
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'guest-1' },
      data: { isActive: false },
    });
  });

  it('merges duplicate lines by summing quantities and keeps the base price snapshot', async () => {
    mocks.verifyToken.mockReturnValue({ sub: 'guest-1', type: 'guest' });
    mocks.prisma.user.findUnique.mockResolvedValue(guestUser('guest-1'));
    mocks.prisma.cart.findUnique.mockResolvedValue({
      id: 'cart-g',
      ownerKey: 'guest-1',
      items: [{ ...guestItem, quantity: 1, unitPrice: 500 }],
    });
    mocks.prisma.cart.findFirst.mockResolvedValue({
      id: 'cart-u',
      ownerKey: 'user-1',
      userId: 'user-1',
      items: [{ ...guestItem, quantity: 2, unitPrice: 480 }],
    });
    mocks.prisma.cart.update.mockResolvedValue({});

    const result = await authService.mergeGuestCart('user-1', 'guest-token');

    expect(result.itemsMerged).toBe(1);
    const update = mocks.prisma.cart.update.mock.calls[0][0] as {
      data: {
        items: Array<{ quantity: number; unitPrice: number }>;
        totalItems: number;
        totalPrice: number;
      };
    };
    expect(update.data.items).toHaveLength(1);
    expect(update.data.items[0].quantity).toBe(3);
    expect(update.data.items[0].unitPrice).toBe(480);
    expect(update.data.totalItems).toBe(3);
    expect(update.data.totalPrice).toBe(1440);
  });

  it('does no cart work when the guest cart is empty', async () => {
    mocks.verifyToken.mockReturnValue({ sub: 'guest-1', type: 'guest' });
    mocks.prisma.user.findUnique.mockResolvedValue(guestUser('guest-1'));
    mocks.prisma.cart.findUnique.mockResolvedValue({
      id: 'cart-g',
      ownerKey: 'guest-1',
      items: [],
    });
    mocks.prisma.cart.findFirst.mockResolvedValue(null);

    const result = await authService.mergeGuestCart('user-1', 'guest-token');

    expect(result).toEqual({ merged: false, itemsMerged: 0 });
    expect(mocks.prisma.cart.create).not.toHaveBeenCalled();
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'guest-1' },
      data: { isActive: false },
    });
  });

  it('rejects a non-guest token type', async () => {
    mocks.verifyToken.mockReturnValue({ sub: 'guest-1', type: 'user' });

    await expect(
      authService.mergeGuestCart('user-1', 'guest-token')
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects an invalid guest token', async () => {
    mocks.verifyToken.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(
      authService.mergeGuestCart('user-1', 'bad-token')
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects a token that does not belong to a guest user', async () => {
    mocks.verifyToken.mockReturnValue({ sub: 'guest-1', type: 'guest' });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: 'guest-1',
      name: 'Real',
      isGuest: false,
    });

    await expect(
      authService.mergeGuestCart('user-1', 'guest-token')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('transfers guest orders to the new account on merge', async () => {
    mocks.verifyToken.mockReturnValue({ sub: 'guest-1', type: 'guest' });
    mocks.prisma.user.findUnique.mockResolvedValue(guestUser('guest-1'));
    mocks.prisma.cart.findUnique.mockResolvedValue({
      id: 'cart-g',
      ownerKey: 'guest-1',
      items: [guestItem],
    });
    mocks.prisma.cart.findFirst.mockResolvedValue(null);
    mocks.prisma.cart.create.mockResolvedValue({ id: 'cart-u' });
    mocks.prisma.order.updateMany.mockResolvedValue({ count: 2 });

    const result = await authService.mergeGuestCart('user-1', 'guest-token');

    expect(result).toEqual({ merged: true, itemsMerged: 1 });
    expect(mocks.prisma.order.updateMany).toHaveBeenCalledWith({
      where: { userId: 'guest-1' },
      data: { userId: 'user-1' },
    });
  });
});