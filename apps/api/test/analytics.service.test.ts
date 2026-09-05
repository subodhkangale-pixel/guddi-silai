import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    analyticsEvent: { create: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as analyticsService from '../src/analytics/analytics.service.js';

beforeEach(() => vi.clearAllMocks());

describe('analytics service', () => {
  it('accepts a storefront event', async () => {
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });
    await analyticsService.recordEvent({ type: 'PRODUCT_VIEW', sessionId: 'session-1', productId: 'product-1' });
    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'PRODUCT_VIEW', sessionId: 'session-1' }) }));
  });

  it('summarizes unique visitors and event counts', async () => {
    prisma.analyticsEvent.findMany.mockResolvedValue([
      { type: 'PAGE_VIEW', sessionId: 's1', productId: null },
      { type: 'PRODUCT_VIEW', sessionId: 's1', productId: 'p1' },
      { type: 'PRODUCT_VIEW', sessionId: 's2', productId: 'p1' },
      { type: 'CART_ADD', sessionId: 's2', productId: 'p1' },
    ]);
    await expect(analyticsService.summary()).resolves.toMatchObject({ visitors: 2, productViews: 2, addToCart: 1, productsTracked: 1 });
  });
});
