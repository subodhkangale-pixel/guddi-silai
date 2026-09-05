import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    offer: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as offersService from '../src/offers/offers.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  prisma.offer.findMany.mockResolvedValue([]);
  prisma.offer.findUnique.mockResolvedValue({ id: 'o1' });
  prisma.offer.create.mockImplementation(async ({ data }) => ({ id: 'o1', ...data }));
  prisma.offer.update.mockImplementation(async ({ data }) => ({ id: 'o1', ...data }));
});

describe('offers service', () => {
  it('lists currently active offers', async () => {
    await offersService.listActive();
    expect(prisma.offer.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }));
  });

  it('deactivates an offer', async () => {
    const result = await offersService.adminDeactivate('o1');
    expect(result).toMatchObject({ id: 'o1', isActive: false });
  });
});
