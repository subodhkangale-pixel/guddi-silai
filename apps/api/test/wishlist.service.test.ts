import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    wishlist: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    product: { findUnique: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as wishlistService from '../src/wishlist/wishlist.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  prisma.product.findUnique.mockResolvedValue({ id: 'p1', name: 'Blouse', designId: 'GS-1', images: ['image.webp'], type: 'READY_MADE', basePrice: 900, isActive: true });
  prisma.wishlist.findUnique.mockResolvedValue(null);
  prisma.wishlist.create.mockImplementation(async ({ data }) => ({ id: 'w1', ...data }));
});

describe('wishlist service', () => {
  it('creates a database wishlist item for an authenticated user', async () => {
    const result = await wishlistService.addItem('u1', { productId: 'p1' });
    expect(result.items[0]).toMatchObject({ productId: 'p1', productName: 'Blouse', basePrice: 900 });
  });
});
