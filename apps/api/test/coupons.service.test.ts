import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    cart: { findUnique: vi.fn(), update: vi.fn() },
    coupon: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
    offer: { findMany: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as couponsService from '../src/coupons/coupons.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  prisma.cart.findUnique.mockResolvedValue({ id: 'c1', items: [{ productId: 'p1', unitPrice: 1000, quantity: 2 }], totalPrice: 2000 });
  prisma.coupon.findUnique.mockResolvedValue({ code: 'WELCOME10', type: 'PERCENT', value: 10, maxDiscount: null, minOrderAmount: null, usageLimit: null, usedCount: 0, isActive: true, expiresAt: null, applicableCategoryIds: [], applicableProductIds: [] });
  prisma.product.findMany.mockResolvedValue([{ id: 'p1', categoryId: 'cat-1' }]);
  prisma.offer.findMany.mockResolvedValue([]);
  prisma.cart.update.mockImplementation(async ({ data }) => ({ id: 'c1', ...data }));
});

describe('coupon service', () => {
  it('applies a percentage discount from the server cart total', async () => {
    const result = await couponsService.applyCoupon('guest-1', { code: 'welcome10' });
    expect(result.discount).toBe(200);
    expect(result.cart.totalPrice).toBe(1800);
  });

  it('is idempotent when re-applied so discounts never stack', async () => {
    prisma.cart.findUnique.mockResolvedValue({ id: 'c1', items: [{ productId: 'p1', unitPrice: 1000, quantity: 2 }], totalPrice: 1800, couponCode: 'WELCOME10', discount: 200 });
    const result = await couponsService.applyCoupon('guest-1', { code: 'welcome10' });
    expect(result.discount).toBe(200);
    expect(result.cart.totalPrice).toBe(1800);
  });

  it('rejects a coupon that does not match the cart category', async () => {
    prisma.coupon.findUnique.mockResolvedValue({ code: 'BRIDAL20', type: 'PERCENT', value: 20, maxDiscount: null, minOrderAmount: null, usageLimit: null, usedCount: 0, isActive: true, expiresAt: null, applicableCategoryIds: ['cat-9'], applicableProductIds: [] });
    prisma.product.findMany.mockResolvedValue([{ id: 'p1', categoryId: 'cat-1' }]);
    await expect(couponsService.applyCoupon('guest-1', { code: 'BRIDAL20' })).rejects.toMatchObject({ statusCode: 400 });
  });
});
