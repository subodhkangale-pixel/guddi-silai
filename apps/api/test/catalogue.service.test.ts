import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    category: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    subCategory: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    color: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    size: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    fiber: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    embroidery: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as catalogueService from '../src/catalogue/catalogue.service.js';

const mockCategory = vi.mocked(prisma.category);
const mockFiber = vi.mocked(prisma.fiber);
const mockEmbroidery = vi.mocked(prisma.embroidery);

function uniqueViolation(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

describe('catalogue list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists only active categories by default', async () => {
    mockCategory.findMany.mockResolvedValue([]);
    await catalogueService.listCategories();
    expect(mockCategory.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  });

  it('sorts categories by displayOrder then name', async () => {
    mockCategory.findMany.mockResolvedValue([]);
    await catalogueService.listCategories();
    const args = mockCategory.findMany.mock.calls[0][0] as {
      orderBy: Array<Record<string, string>>;
    };
    expect(args.orderBy).toEqual([
      { displayOrder: 'asc' },
      { name: 'asc' },
    ]);
  });

  it('searches categories by name/slug when q is provided', async () => {
    mockCategory.findMany.mockResolvedValue([]);
    await catalogueService.listCategories({ search: 'bridal' });
    const args = mockCategory.findMany.mock.calls[0][0] as {
      where: { OR: Array<Record<string, unknown>> };
    };
    expect(args.where.OR.length).toBeGreaterThan(0);
    expect(args.where.isActive).toBe(true);
  });

  it('includes inactive entities when requested', async () => {
    mockFiber.findMany.mockResolvedValue([]);
    await catalogueService.listFibers({ includeInactive: true });
    expect(mockFiber.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: undefined } })
    );
  });
});

describe('catalogue create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('auto-generates a slug from the name when missing', async () => {
    mockCategory.create.mockResolvedValue({
      id: 'c1',
      name: 'Bridal Blouses',
      slug: 'bridal-blouses',
    } as never);
    const result = await catalogueService.createCategory({
      name: 'Bridal Blouses',
    });
    const data = mockCategory.create.mock.calls[0][0] as { data: { slug: string } };
    expect(data.data.slug).toBe('bridal-blouses');
    expect(result.slug).toBe('bridal-blouses');
  });

  it('maps a unique slug violation to a 409 conflict', async () => {
    mockCategory.create.mockRejectedValue(uniqueViolation());
    await expect(
      catalogueService.createCategory({ name: 'Dup' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('creates a fiber with its price', async () => {
    mockFiber.create.mockResolvedValue({ id: 'f1' } as never);
    const result = await catalogueService.createFiber({
      name: 'Raw Silk',
      price: 299,
    });
    const data = mockFiber.create.mock.calls[0][0] as { data: { price: number } };
    expect(data.data.price).toBe(299);
    expect(result).toEqual({ id: 'f1' });
  });

  it('creates fiber with explicit slug ignored (fibers have no slug)', async () => {
    mockEmbroidery.create.mockResolvedValue({ id: 'e1' } as never);
    await catalogueService.createEmbroidery({ name: 'Zardosi' });
    const data = mockEmbroidery.create.mock.calls[0][0] as { data: { name: string } };
    expect(data.data.name).toBe('Zardosi');
  });
});

describe('catalogue delete (soft)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('soft-deletes a category by flipping isActive', async () => {
    mockCategory.update.mockResolvedValue({ id: 'c1' } as never);
    const result = await catalogueService.softDeleteCategory('c1');
    expect(mockCategory.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { isActive: false },
    });
    expect(result).toEqual({ id: 'c1' });
  });
});