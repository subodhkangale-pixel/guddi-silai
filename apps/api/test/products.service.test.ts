import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    category: { findMany: vi.fn(), findUnique: vi.fn() },
    subCategory: { findMany: vi.fn(), findUnique: vi.fn() },
    color: { findMany: vi.fn() },
    size: { findMany: vi.fn() },
    fiber: { findMany: vi.fn() },
    embroidery: { findMany: vi.fn() },
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    productVariant: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as productsService from '../src/products/products.service.js';

const mockProduct = vi.mocked(prisma.product);
const mockVariant = vi.mocked(prisma.productVariant);
const mockFiber = vi.mocked(prisma.fiber);
const mockCategory = vi.mocked(prisma.category);

const baseProduct = {
  id: 'p1',
  name: 'Bridal Lehenga Blouse',
  slug: 'bridal-lehenga-blouse',
  designId: 'GS-206',
  description: 'A rich silk blouse',
  type: 'READY_MADE',
  categoryId: 'cat-1',
  subCategoryId: 'sub-1',
  basePrice: 1500,
  compareAtPrice: 2000,
  discountPercent: 25,
  colors: [{ colorId: 'red-1', sizeId: null }],
  sizes: [{ colorId: null, sizeId: 'm-1' }],
  fiberOptions: [{ id: 'fiber-1', name: 'Raw Silk', price: 299 }],
  embroideryOptions: [],
  images: ['https://cdn.example.com/a.webp'],
  videos: [],
  tags: ['bridal', 'silk'],
  seo: null,
  expectedAvailability: null,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const baseVariant = {
  id: 'v1',
  productId: 'p1',
  sku: 'GS-206-RED-M',
  colorId: 'red-1',
  sizeId: 'm-1',
  price: 1500,
  discount: null,
  stock: 5,
  isActive: true,
};

function resetAll() {
  vi.clearAllMocks();
  prisma.category.findMany.mockResolvedValue([]);
  prisma.subCategory.findMany.mockResolvedValue([]);
  prisma.color.findMany.mockResolvedValue([]);
  prisma.size.findMany.mockResolvedValue([]);
  prisma.fiber.findMany.mockResolvedValue([]);
  prisma.embroidery.findMany.mockResolvedValue([]);
  mockProduct.findMany.mockResolvedValue([]);
  mockVariant.findMany.mockResolvedValue([]);
}

describe('cursor helpers', () => {
  it('round-trips a keyset cursor', () => {
    const cursor = { sortValue: '2024-01-01T00:00:00.000Z', id: 'p1' };
    const encoded = productsService.encodeCursor(cursor);
    expect(productsService.decodeCursor(encoded)).toEqual(cursor);
  });

  it('rejects malformed cursors with a 400', () => {
    expect(() => productsService.decodeCursor('not-base64!!')).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
  });
});

describe('buildProductWhere', () => {
  beforeEach(resetAll);

  it('defaults to active products only', async () => {
    const { where } = await productsService.buildProductWhere({
      sort: 'newest',
      limit: 20,
    });
    expect(where.isActive).toBe(true);
  });

  it('filters by category, size and color', async () => {
    const { where } = await productsService.buildProductWhere({
      categoryId: 'cat-1',
      sizeId: 'm-1',
      colorId: 'red-1',
      sort: 'newest',
      limit: 20,
    });
    expect(where.categoryId).toBe('cat-1');
    expect(where.sizes).toEqual({ some: { sizeId: 'm-1' } });
    expect(where.colors).toEqual({ some: { colorId: 'red-1' } });
  });

  it('applies a price range', async () => {
    const { where } = await productsService.buildProductWhere({
      minPrice: 500,
      maxPrice: 2000,
      sort: 'newest',
      limit: 20,
    });
    expect(where.basePrice).toEqual({ gte: 500, lte: 2000 });
  });

  it('includes search OR terms that reference catalogue names', async () => {
    mockCategory.findMany.mockResolvedValue([{ id: 'cat-1' }]);
    mockFiber.findMany.mockResolvedValue([{ id: 'fiber-1' }]);
    const { where } = await productsService.buildProductWhere({
      q: 'silk',
      sort: 'newest',
      limit: 20,
    });
    const and = where.AND as Prisma.ProductWhereInput[];
    expect(and).toBeDefined();
    const searchOr = and[0].OR as Prisma.ProductWhereInput[];
    expect(searchOr).toEqual(
      expect.arrayContaining([
        { name: { contains: 'silk', mode: 'insensitive' } },
        { fiberOptions: { some: { id: { in: ['fiber-1'] } } } },
        { categoryId: { in: ['cat-1'] } },
      ])
    );
    expect(mockCategory.findMany).toHaveBeenCalled();
  });

  it('filters upcoming by expectedAvailability', async () => {
    const { where } = await productsService.buildProductWhere({
      availability: 'upcoming',
      sort: 'newest',
      limit: 20,
    });
    expect(where.expectedAvailability).toEqual({ not: null });
  });

  it('filters in-stock using variant stock', async () => {
    mockVariant.findMany.mockResolvedValue([{ productId: 'p1' }]);
    const { where } = await productsService.buildProductWhere({
      availability: 'in_stock',
      sort: 'newest',
      limit: 20,
    });
    expect(where.id).toEqual({ in: ['p1'] });
    expect(where.type).toEqual({ in: ['READY_MADE', 'CUSTOMIZE'] });
  });

  it('filters out-of-stock as active products without stock and not upcoming', async () => {
    mockVariant.findMany.mockResolvedValue([{ productId: 'p1' }]);
    const { where } = await productsService.buildProductWhere({
      availability: 'out_of_stock',
      sort: 'newest',
      limit: 20,
    });
    expect(where.id).toEqual({ notIn: ['p1'] });
    expect(where.expectedAvailability).toBeNull();
  });
});

describe('listProducts', () => {
  beforeEach(resetAll);

  it('returns a page with a nextCursor when more results exist', async () => {
    mockProduct.findMany.mockResolvedValue([baseProduct, baseProduct]);
    mockVariant.findMany.mockResolvedValue([
      { productId: 'p1', stock: 5, isActive: true },
      { productId: 'p1', stock: 2, isActive: true },
    ]);
    const result = await productsService.listProducts({
      sort: 'newest',
      limit: 1,
    });
    expect(result.data).toHaveLength(1);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeTruthy();
    const decoded = productsService.decodeCursor(result.nextCursor!);
    expect(decoded.id).toBe('p1');
  });

  it('orders price low-to-high by basePrice', async () => {
    mockProduct.findMany.mockResolvedValue([baseProduct]);
    await productsService.listProducts({ sort: 'price_low_to_high', limit: 20 });
    expect(mockProduct.findMany.mock.calls[0][0].orderBy).toEqual([
      { basePrice: 'asc' },
      { id: 'desc' },
    ]);
  });

  it('returns no nextCursor on the last page', async () => {
    mockProduct.findMany.mockResolvedValue([baseProduct]);
    const result = await productsService.listProducts({
      sort: 'newest',
      limit: 20,
    });
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });
});

describe('getProductBySlug', () => {
  beforeEach(resetAll);

  it('resolves category, colors, sizes and variants', async () => {
    mockProduct.findUnique.mockResolvedValue(baseProduct);
    mockCategory.findUnique.mockResolvedValue({
      id: 'cat-1',
      name: 'Bridal',
      slug: 'bridal',
    });
    prisma.subCategory.findUnique.mockResolvedValue(
      { id: 'sub-1', name: 'Lehenga', slug: 'lehenga' } as never
    );
    prisma.color.findMany.mockResolvedValue([
      { id: 'red-1', name: 'Red', hex: '#ff0000' },
    ] as never);
    prisma.size.findMany.mockResolvedValue([{ id: 'm-1', name: 'M' }] as never);
    mockVariant.findMany.mockResolvedValue([baseVariant]);

    const product = await productsService.getProductBySlug('bridal-lehenga-blouse');
    expect(product.name).toBe('Bridal Lehenga Blouse');
    expect(product.availability).toBe('in_stock');
    expect(product.category).toEqual({ id: 'cat-1', name: 'Bridal', slug: 'bridal' });
    expect(product.variants).toHaveLength(1);
  });

  it('throws 404 when the product is inactive', async () => {
    mockProduct.findUnique.mockResolvedValue({ ...baseProduct, isActive: false });
    await expect(
      productsService.getProductBySlug('hidden')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('admin product CRUD', () => {
  beforeEach(resetAll);

  it('creates a product resolving fiber prices into fiberOptions', async () => {
    mockFiber.findMany.mockResolvedValue([
      { id: 'fiber-1', name: 'Raw Silk', price: 299, image: null, isActive: true },
    ]);
    mockProduct.create.mockResolvedValue(baseProduct);
    const created = await productsService.createProduct({
      name: 'Bridal Lehenga Blouse',
      type: 'READY_MADE',
      categoryId: 'cat-1',
      basePrice: 1500,
      fiberIds: ['fiber-1'],
    });
    const data = mockProduct.create.mock.calls[0][0].data;
    expect(data.fiberOptions).toEqual([
      { id: 'fiber-1', name: 'Raw Silk', price: 299, image: null, isActive: true },
    ]);
    expect(data.slug).toBe('bridal-lehenga-blouse');
    expect(created.name).toBe('Bridal Lehenga Blouse');
  });

  it('maps slug/designId conflicts to a 409', async () => {
    mockFiber.findMany.mockResolvedValue([]);
    mockProduct.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );
    await expect(
      productsService.createProduct({
        name: 'X',
        type: 'SHOWCASE',
        categoryId: 'cat-1',
        basePrice: 0,
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('soft-deletes a product', async () => {
    mockProduct.update.mockResolvedValue(baseProduct);
    const result = await productsService.softDeleteProduct('p1');
    expect(mockProduct.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { isActive: false },
    });
    expect(result).toEqual({ id: 'p1' });
  });

  it('adds a variant with default active state', async () => {
    mockProduct.findUnique.mockResolvedValue(baseProduct);
    mockVariant.create.mockResolvedValue(baseVariant);
    await productsService.addVariant('p1', {
      colorId: 'red-1',
      sizeId: 'm-1',
      price: 1500,
      stock: 5,
    });
    const data = mockVariant.create.mock.calls[0][0].data;
    expect(data.isActive).toBe(true);
    expect(data.stock).toBe(5);
  });
});