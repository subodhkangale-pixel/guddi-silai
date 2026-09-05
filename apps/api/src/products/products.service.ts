import { Prisma } from '@prisma/client';
import { SortOption } from '@guddi-silai/shared';

import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  ProductInput,
  ProductQueryParams,
  VariantInput,
  slugFromName,
} from './products.schemas.js';

type ProductWhere = Prisma.ProductWhereInput;

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}
// ──────────────────────────────────────────────
// Cursor helpers (keyset pagination)

export interface KeySetCursor {
  sortValue: string;
  id: string;
}

function base64encode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64decode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function encodeCursor(cursor: KeySetCursor): string {
  return base64encode(JSON.stringify(cursor));
}

export function decodeCursor(cursor: string): KeySetCursor {
  try {
    const parsed = JSON.parse(base64decode(cursor)) as Partial<KeySetCursor>;
    if (typeof parsed.sortValue === 'string' && typeof parsed.id === 'string') {
      return { sortValue: parsed.sortValue, id: parsed.id };
    }
  } catch {
    // fall through
  }
  throw new AppError(400, 'Invalid cursor');
}

type OrderClause = Prisma.ProductOrderByWithRelationInput;

const SCORE_SORTS = new Set<SortOption>(['most_popular', 'most_liked', 'most_viewed', 'best_rated']);

function orderFor(sort: SortOption): OrderClause[] {
  switch (sort) {
    case 'price_low_to_high':
      return [{ basePrice: 'asc' }, { id: 'desc' }];
    case 'price_high_to_low':
      return [{ basePrice: 'desc' }, { id: 'desc' }];
    case 'most_popular':
    case 'most_liked':
    case 'most_viewed':
    case 'best_rated':
      return [{ createdAt: 'desc' }, { id: 'desc' }];
    case 'newest':
    default:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
  }
}

type AnalyticsEventType = 'PRODUCT_VIEW' | 'WISHLIST_ADD' | 'CART_ADD' | 'ORDER_PLACED';

async function scoreProducts(productIds: string[], sort: SortOption): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (productIds.length === 0) return map;

  const groupByCount = async (type: AnalyticsEventType): Promise<Map<string, number>> => {
    const events = await prisma.analyticsEvent.groupBy({
      by: ['productId'],
      where: { type, productId: { in: productIds } },
      _count: { _all: true },
    });
    return new Map(events.map((event) => [event.productId!, event._count._all]));
  };

  switch (sort) {
    case 'most_viewed': {
      const counts = await groupByCount('PRODUCT_VIEW');
      for (const [id, value] of counts) map.set(id, value);
      break;
    }
    case 'most_liked': {
      const counts = await groupByCount('WISHLIST_ADD');
      for (const [id, value] of counts) map.set(id, value);
      break;
    }
    case 'most_popular': {
      const [views, likes, carts, orders] = await Promise.all([
        groupByCount('PRODUCT_VIEW'),
        groupByCount('WISHLIST_ADD'),
        groupByCount('CART_ADD'),
        groupByCount('ORDER_PLACED'),
      ]);
      const all = new Set([...views.keys(), ...likes.keys(), ...carts.keys(), ...orders.keys()]);
      for (const id of all) {
        map.set(
          id,
          (views.get(id) ?? 0) +
            (likes.get(id) ?? 0) * 2 +
            (carts.get(id) ?? 0) * 3 +
            (orders.get(id) ?? 0) * 10
        );
      }
      break;
    }
    case 'best_rated': {
      const reviews = await prisma.review.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds }, status: 'approved' },
        _avg: { rating: true },
      });
      for (const review of reviews) map.set(review.productId, review._avg.rating ?? 0);
      break;
    }
    default:
      break;
  }
  return map;
}

async function listProductsByScore(where: ProductWhere, params: ProductQueryParams) {
  const limit = params.limit;
  const offset = params.cursor ? Number(decodeCursor(params.cursor).sortValue) || 0 : 0;

  const matches = await prisma.product.findMany({ where, select: { id: true }, orderBy: orderFor('newest') });
  const scores = await scoreProducts(matches.map((product) => product.id), params.sort);
  const sorted = matches
    .map((product) => product.id)
    .sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0) || (a > b ? 1 : -1));

  const hasMore = offset + limit < sorted.length;
  const pageIds = sorted.slice(offset, offset + limit);

  const products = await prisma.product.findMany({
    where: { id: { in: pageIds }, isActive: true },
    orderBy: orderFor('newest'),
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const page = pageIds.map((id) => byId.get(id)).filter((product): product is NonNullable<typeof product> => Boolean(product));
  const data = await summarizeProducts(page);

  const nextCursor = hasMore && page.length > 0 ? encodeCursor({ sortValue: String(offset + limit), id: page[page.length - 1].id }) : null;
  return { data, nextCursor, hasMore };
}

function cursorConditionFor(
  sort: SortOption,
  cursor: KeySetCursor
): ProductWhere {
  const value = cursor.sortValue;
  if (sort === 'price_high_to_low') {
    return {
      OR: [
        { basePrice: { lt: Number(value) } },
        { basePrice: { equals: Number(value) }, id: { lt: cursor.id } },
      ],
    };
  }
  if (sort === 'price_low_to_high') {
    return {
      OR: [
        { basePrice: { gt: Number(value) } },
        { basePrice: { equals: Number(value) }, id: { lt: cursor.id } },
      ],
    };
  }
  return {
    OR: [
      { createdAt: { lt: new Date(value) } },
      { createdAt: { equals: new Date(value) }, id: { lt: cursor.id } },
    ],
  };
}

// ──────────────────────────────────────────────
// Search + filters
// ──────────────────────────────────────────────

const insensitive = (value: string) => ({
  contains: value,
  mode: 'insensitive' as const,
});

type ReferenceKind = 'category' | 'subCategory' | 'color' | 'size' | 'fiber' | 'embroidery';

async function referenceIds(kind: ReferenceKind, q: string): Promise<string[]> {
  const contains = { contains: q, mode: 'insensitive' as const };
  const nameWhere = { name: contains };
  let ids: string[] = [];
  switch (kind) {
    case 'category':
      ids = (
        await prisma.category.findMany({
          where: { OR: [nameWhere, { slug: contains }] },
          select: { id: true },
        })
      ).map((r) => r.id);
      break;
    case 'subCategory':
      ids = (
        await prisma.subCategory.findMany({
          where: { OR: [nameWhere, { slug: contains }] },
          select: { id: true },
        })
      ).map((r) => r.id);
      break;
    case 'color':
      ids = (
        await prisma.color.findMany({
          where: nameWhere,
          select: { id: true },
        })
      ).map((r) => r.id);
      break;
    case 'size':
      ids = (
        await prisma.size.findMany({
          where: { OR: [nameWhere, { code: contains }] },
          select: { id: true },
        })
      ).map((r) => r.id);
      break;
    case 'fiber':
      ids = (
        await prisma.fiber.findMany({
          where: nameWhere,
          select: { id: true },
        })
      ).map((r) => r.id);
      break;
    case 'embroidery':
      ids = (
        await prisma.embroidery.findMany({
          where: nameWhere,
          select: { id: true },
        })
      ).map((r) => r.id);
      break;
  }
  return ids;
}

/** Resolve a search query into reference IDs so the product where clause can match
 *  category / color / size / fiber / embroidery by name (§31). */
async function resolveSearchReferences(q: string) {
  const [categoryIds, subCategoryIds, colorIds, sizeIds, fiberIds, embroideryIds] =
    await Promise.all([
      referenceIds('category', q),
      referenceIds('subCategory', q),
      referenceIds('color', q),
      referenceIds('size', q),
      referenceIds('fiber', q),
      referenceIds('embroidery', q),
    ]);
  return { categoryIds, subCategoryIds, colorIds, sizeIds, fiberIds, embroideryIds };
}

export async function buildSearchWhere(q: string): Promise<ProductWhere> {
  const refs = await resolveSearchReferences(q);
  const or: ProductWhere[] = [
    { name: insensitive(q) },
    { description: insensitive(q) },
    { designId: insensitive(q) },
    { tags: { has: q } },
  ];
  if (refs.categoryIds.length) or.push({ categoryId: { in: refs.categoryIds } });
  if (refs.subCategoryIds.length)
    or.push({ subCategoryId: { in: refs.subCategoryIds } });
  if (refs.colorIds.length)
    or.push({ colors: { some: { colorId: { in: refs.colorIds } } } });
  if (refs.sizeIds.length)
    or.push({ sizes: { some: { sizeId: { in: refs.sizeIds } } } });
  if (refs.fiberIds.length)
    or.push({ fiberOptions: { some: { id: { in: refs.fiberIds } } } });
  if (refs.embroideryIds.length)
    or.push({ embroideryOptions: { some: { id: { in: refs.embroideryIds } } } });
  return { OR: or };
}

async function productIdsWithStock(): Promise<string[]> {
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    select: { productId: true },
  });
  return Array.from(new Set(variants.map((v) => v.productId)));
}

export async function buildProductWhere(
  params: ProductQueryParams
): Promise<{ where: ProductWhere; orderBy: OrderClause[] }> {
  const where: ProductWhere = { isActive: true };
  const and: ProductWhere[] = [];

  if (params.q) {
    and.push(await buildSearchWhere(params.q));
  }
  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.subCategoryId) where.subCategoryId = params.subCategoryId;
  if (params.colorId) where.colors = { some: { colorId: params.colorId } };
  if (params.sizeId) where.sizes = { some: { sizeId: params.sizeId } };
  if (params.fiberId) where.fiberOptions = { some: { id: params.fiberId } };
  if (params.embroideryId)
    where.embroideryOptions = { some: { id: params.embroideryId } };
  if (params.occasion) where.occasions = { has: params.occasion.toLowerCase() };
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const price: NonNullable<ProductWhere['basePrice']> = {};
    if (params.minPrice !== undefined) price.gte = params.minPrice;
    if (params.maxPrice !== undefined) price.lte = params.maxPrice;
    where.basePrice = price;
  }

  if (params.availability === 'upcoming') {
    where.expectedAvailability = { not: null };
  } else if (params.availability === 'in_stock' || params.availability === 'out_of_stock') {
    const productIds = await productIdsWithStock();
    if (params.availability === 'in_stock') {
      where.id = { in: productIds };
      where.type = { in: ['READY_MADE', 'CUSTOMIZE'] };
    } else {
      where.id = { notIn: productIds };
      where.type = { in: ['READY_MADE', 'CUSTOMIZE'] };
      where.expectedAvailability = null;
    }
  }

  if (and.length) where.AND = and;

  return { where, orderBy: orderFor(params.sort) };
}

// ──────────────────────────────────────────────
// Public listing + detail
// ──────────────────────────────────────────────

interface ProductWithSummary {
  id: string;
  slug: string;
  name: string;
  type: 'READY_MADE' | 'CUSTOMIZE' | 'SHOWCASE';
  designId: string | null;
  categoryId: string;
  subCategoryId: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  discountPercent: number | null;
  images: string[];
  tags: string[];
  occasions: string[];
  expectedAvailability: Date | null;
  totalStock: number;
  availability: 'in_stock' | 'out_of_stock' | 'upcoming' | 'showcase';
}

function computeAvailability(
  product: { type: string; expectedAvailability: Date | null; isActive: boolean },
  stock: number
): 'in_stock' | 'out_of_stock' | 'upcoming' | 'showcase' {
  if (product.type === 'SHOWCASE') return 'showcase';
  if (stock > 0) return 'in_stock';
  if (product.expectedAvailability) return 'upcoming';
  return 'out_of_stock';
}

async function summarizeProducts(
  products: Array<{
    id: string;
    slug: string;
    name: string;
    type: ProductInput['type'];
    designId: string | null;
    categoryId: string;
    subCategoryId: string | null;
    basePrice: number;
    compareAtPrice: number | null;
    discountPercent: number | null;
    images: string[];
    tags: string[];
    occasions: string[];
    expectedAvailability: Date | null;
    isActive: boolean;
  }>
): Promise<ProductWithSummary[]> {
  if (products.length === 0) return [];
  const variantRows = await prisma.productVariant.findMany({
    where: { productId: { in: products.map((p) => p.id) }, isActive: true },
    select: { productId: true, stock: true },
  });
  const stockById = new Map<string, number>();
  for (const variant of variantRows) {
    stockById.set(
      variant.productId,
      (stockById.get(variant.productId) ?? 0) + variant.stock
    );
  }
  return products.map((product) => {
    const totalStock = stockById.get(product.id) ?? 0;
    const finalPrice =
      product.discountPercent && product.discountPercent > 0
        ? Math.round(product.basePrice * (1 - product.discountPercent / 100))
        : product.basePrice;
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      type: product.type as ProductInput['type'],
      designId: product.designId,
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId,
      basePrice: finalPrice,
      compareAtPrice: product.compareAtPrice,
      discountPercent: product.discountPercent,
      images: product.images,
      tags: product.tags,
      occasions: product.occasions ?? [],
      expectedAvailability: product.expectedAvailability,
      totalStock,
      availability: computeAvailability(product, totalStock),
    };
  });
}

export async function listProducts(params: ProductQueryParams) {
  const { where, orderBy } = await buildProductWhere(params);
  const limit = params.limit;

  if (SCORE_SORTS.has(params.sort)) {
    return listProductsByScore(where, params);
  }

  if (params.cursor) {
    const cursor = decodeCursor(params.cursor);
    const cursorCondition = cursorConditionFor(params.sort, cursor);
    where.AND = [...(where.AND ? [where.AND as ProductWhere] : []), cursorCondition];
  }

  const records = await prisma.product.findMany({
    where,
    orderBy,
    take: limit + 1,
  });

  const hasMore = records.length > limit;
  const page = records.slice(0, limit);
  const data = await summarizeProducts(page);

  const nextCursor =
    hasMore && page.length > 0
      ? encodeCursor({
          sortValue: sortCursorValue(params.sort, page[page.length - 1]),
          id: page[page.length - 1].id,
        })
      : null;

  return { data, nextCursor, hasMore };
}

function sortCursorValue(sort: SortOption, product: { basePrice: number; createdAt: Date }): string {
  if (sort === 'price_low_to_high' || sort === 'price_high_to_low') {
    return String(product.basePrice);
  }
  return product.createdAt.toISOString();
}

export async function getFiberAvailability(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.isActive === false) throw new AppError(404, 'Product not found');

  const [inventory, colors] = await Promise.all([
    prisma.fiberInventory.findMany({
      where: { fiberId: { in: product.fiberOptions.map((option) => option.id) } },
    }),
    prisma.color.findMany({ where: { isActive: true } }),
  ]);
  const colorMap = new Map(colors.map((color) => [color.id, color.name]));
  const stockByFiberColor = new Map<string, number>();
  for (const item of inventory) stockByFiberColor.set(`${item.fiberId}:${item.colorId}`, item.stock);

  return product.fiberOptions.map((option) => ({
    fiberId: option.id,
    fiberName: option.name,
    fiberPrice: option.price ?? 0,
    colors: product.colors
      .map((entry) => entry.colorId)
      .filter((colorId): colorId is string => colorId !== null)
      .map((colorId) => ({
        colorId,
        colorName: colorMap.get(colorId) ?? colorId,
        stock: stockByFiberColor.get(`${option.id}:${colorId}`) ?? 0,
      })),
  }));
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product || product.isActive === false) {
    throw new AppError(404, 'Product not found');
  }

  const [variants, category, subCategory, colors, sizes] = await Promise.all([
    prisma.productVariant.findMany({
      where: { productId: product.id, isActive: true },
      orderBy: [{ colorId: 'asc' }, { sizeId: 'asc' }],
    }),
    prisma.category.findUnique({ where: { id: product.categoryId } }),
    product.subCategoryId
      ? prisma.subCategory.findUnique({ where: { id: product.subCategoryId } })
      : Promise.resolve(null),
    prisma.color.findMany({
      where: {
        id: {
          in: product.colors
            .map((c) => c.colorId)
            .filter((id): id is string => id !== null),
        },
      },
    }),
    prisma.size.findMany({
      where: {
        id: {
          in: product.sizes
            .map((s) => s.sizeId)
            .filter((id): id is string => id !== null),
        },
      },
    }),
  ]);

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return {
    ...product,
    availability: computeAvailability(product, totalStock),
    totalStock,
    finalPrice:
      product.discountPercent && product.discountPercent > 0
        ? Math.round(product.basePrice * (1 - product.discountPercent / 100))
        : product.basePrice,
    category: category
      ? { id: category.id, name: category.name, slug: category.slug }
      : null,
    subCategory: subCategory
      ? { id: subCategory.id, name: subCategory.name, slug: subCategory.slug }
      : null,
    colors,
    sizes,
    variants,
  };
}

// ──────────────────────────────────────────────
// Admin: product CRUD
// ──────────────────────────────────────────────

function slugFor(input: { slug?: string; name: string }): string {
  return input.slug ? input.slug : slugFromName(input.name);
}

async function resolveFiberOptions(fiberIds: string[]) {
  const fibers = await prisma.fiber.findMany({ where: { id: { in: fiberIds } } });
  return fibers.map((fiber) => ({
    id: fiber.id,
    name: fiber.name,
    price: fiber.price,
    image: fiber.image,
    isActive: fiber.isActive,
  }));
}

async function resolveEmbroideryOptions(embroideryIds: string[]) {
  const embroideries = await prisma.embroidery.findMany({
    where: { id: { in: embroideryIds } },
  });
  return embroideries.map((record) => ({
    id: record.id,
    name: record.name,
    surcharge: record.surcharge ?? null,
    image: record.image,
    isActive: record.isActive,
  }));
}

export async function createProduct(input: ProductInput) {
  const data: Prisma.ProductCreateInput = {
    name: input.name,
    designId: input.designId,
    slug: slugFor(input),
    description: input.description,
    type: input.type,
    categoryId: input.categoryId,
    subCategoryId: input.subCategoryId,
    basePrice: input.basePrice,
    compareAtPrice: input.compareAtPrice,
    discountPercent: input.discountPercent,
    colors: input.colors?.map((colorId) => ({ colorId, sizeId: null })) ?? [],
    sizes: input.sizes?.map((sizeId) => ({ colorId: null, sizeId })) ?? [],
    fiberOptions: input.fiberIds
      ? await resolveFiberOptions(input.fiberIds)
      : [],
    embroideryOptions: input.embroideryIds
      ? await resolveEmbroideryOptions(input.embroideryIds)
      : [],
    images: input.images ?? [],
    videos: input.videos ?? [],
    tags: input.tags ?? [],
    occasions: input.occasions ?? [],
    seo: input.seo,
    expectedAvailability: input.expectedAvailability,
  };
  if (input.isActive !== undefined) data.isActive = input.isActive;
  try {
    return await prisma.product.create({ data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, 'A product with this slug or design ID already exists');
    }
    throw err;
  }
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const data: Prisma.ProductUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.designId !== undefined) data.designId = input.designId;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.type !== undefined) data.type = input.type;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.subCategoryId !== undefined) data.subCategoryId = input.subCategoryId;
  if (input.basePrice !== undefined) data.basePrice = input.basePrice;
  if (input.compareAtPrice !== undefined) data.compareAtPrice = input.compareAtPrice;
  if (input.discountPercent !== undefined) data.discountPercent = input.discountPercent;
  if (input.colors !== undefined)
    data.colors = input.colors.map((colorId) => ({ colorId, sizeId: null }));
  if (input.sizes !== undefined)
    data.sizes = input.sizes.map((sizeId) => ({ colorId: null, sizeId }));
  if (input.fiberIds !== undefined)
    data.fiberOptions = await resolveFiberOptions(input.fiberIds);
  if (input.embroideryIds !== undefined)
    data.embroideryOptions = await resolveEmbroideryOptions(input.embroideryIds);
  if (input.images !== undefined) data.images = input.images;
  if (input.videos !== undefined) data.videos = input.videos;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.occasions !== undefined) data.occasions = input.occasions;
  if (input.seo !== undefined) data.seo = input.seo;
  if (input.expectedAvailability !== undefined)
    data.expectedAvailability = input.expectedAvailability;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  try {
    return await prisma.product.update({ where: { id }, data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, 'A product with this slug or design ID already exists');
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError(404, 'Product not found');
    }
    throw err;
  }
}

export async function softDeleteProduct(id: string) {
  try {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError(404, 'Product not found');
    }
    throw err;
  }
  return { id };
}

export async function getAdminProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError(404, 'Product not found');
  const variants = await prisma.productVariant.findMany({
    where: { productId: product.id },
    orderBy: [{ colorId: 'asc' }, { sizeId: 'asc' }],
  });
  return { ...product, variants };
}

export async function adminListProducts(params: {
  q?: string;
  page: number;
  limit: number;
  includeInactive?: boolean;
}) {
  const where: ProductWhere = {};
  if (params.q) {
    where.AND = await buildSearchWhere(params.q);
  }
  if (!params.includeInactive) where.isActive = true;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
  ]);

  const variants = await prisma.productVariant.findMany({
    where: { productId: { in: products.map((p) => p.id) }, isActive: true },
    select: { productId: true, stock: true },
  });
  const stockById = new Map<string, number>();
  for (const variant of variants) {
    stockById.set(
      variant.productId,
      (stockById.get(variant.productId) ?? 0) + variant.stock
    );
  }

  const data = products.map((product) => ({
    ...product,
    totalStock: stockById.get(product.id) ?? 0,
  }));

  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}

// ──────────────────────────────────────────────
// Admin: variants
// ──────────────────────────────────────────────

export async function addVariant(productId: string, input: VariantInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');
  try {
    return await prisma.productVariant.create({
      data: {
        productId,
        sku: input.sku,
        colorId: input.colorId,
        sizeId: input.sizeId,
        price: input.price,
        discount: input.discount,
        stock: input.stock,
        isActive: input.isActive ?? true,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, 'A variant with this SKU already exists');
    }
    throw err;
  }
}

export async function updateVariant(variantId: string, input: Partial<VariantInput>) {
  const data: Prisma.ProductVariantUpdateInput = {};
  if (input.sku !== undefined) data.sku = input.sku;
  if (input.colorId !== undefined) data.colorId = input.colorId;
  if (input.sizeId !== undefined) data.sizeId = input.sizeId;
  if (input.price !== undefined) data.price = input.price;
  if (input.discount !== undefined) data.discount = input.discount;
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  try {
    return await prisma.productVariant.update({ where: { id: variantId }, data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, 'A variant with this SKU already exists');
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError(404, 'Variant not found');
    }
    throw err;
  }
}

export async function deleteVariant(variantId: string) {
  try {
    await prisma.productVariant.delete({ where: { id: variantId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError(404, 'Variant not found');
    }
    throw err;
  }
  return { id: variantId };
}