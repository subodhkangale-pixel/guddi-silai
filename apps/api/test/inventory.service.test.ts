import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    fiber: { findUnique: vi.fn() },
    color: { findUnique: vi.fn() },
    fiberInventory: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    stockMovement: { create: vi.fn() },
    productVariant: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as inventoryService from '../src/inventory/inventory.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  prisma.fiber.findUnique.mockResolvedValue({ id: 'f1' });
  prisma.color.findUnique.mockResolvedValue({ id: 'c1' });
  prisma.fiberInventory.findUnique.mockResolvedValue({ id: 'fi-1', stock: 2 });
  prisma.fiberInventory.upsert.mockResolvedValue({ id: 'fi-1', fiberId: 'f1', colorId: 'c1', stock: 5 });
  prisma.stockMovement.create.mockResolvedValue({});
});

describe('inventory service', () => {
  it('upserts fiber-color stock and records the adjustment', async () => {
    const result = await inventoryService.upsertFiberInventory({ fiberId: 'f1', colorId: 'c1', stock: 5 });
    expect(result.stock).toBe(5);
    expect(prisma.stockMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ fiberInventoryId: 'fi-1', quantity: 3, type: 'ADJUSTMENT_IN' }),
    }));
  });

  it('rejects variant stock adjustments that would go below zero', async () => {
    prisma.productVariant.findUnique.mockResolvedValue({ id: 'v1', stock: 1 });
    await expect(inventoryService.adjustVariantStock('v1', { quantity: -2 })).rejects.toMatchObject({ statusCode: 409 });
  });
});
