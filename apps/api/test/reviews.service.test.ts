import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    product: { findUnique: vi.fn() },
    review: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as reviewsService from '../src/reviews/reviews.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  prisma.product.findUnique.mockResolvedValue({ id: 'p1', type: 'READY_MADE', isActive: true });
  prisma.review.findUnique.mockResolvedValue(null);
  prisma.review.create.mockImplementation(async ({ data }) => ({ id: 'r1', ...data }));
  prisma.review.update.mockImplementation(async ({ data }) => ({ id: 'r1', ...data }));
});

describe('reviews service', () => {
  it('creates a pending review for a ready-made product', async () => {
    const result = await reviewsService.createReview('u1', { productId: 'p1', rating: 5, images: [] });
    expect(result).toMatchObject({ userId: 'u1', productId: 'p1', rating: 5, status: 'pending' });
  });

  it('rejects reviews for custom products', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p1', type: 'CUSTOMIZE', isActive: true });
    await expect(reviewsService.createReview('u1', { productId: 'p1', rating: 5, images: [] })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('moderates a review', async () => {
    prisma.review.findUnique.mockResolvedValue({ id: 'r1' });
    const result = await reviewsService.moderate('r1', 'approved');
    expect(result.status).toBe('approved');
  });
});
