import { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  CategoryInput,
  ColorInput,
  EmbroideryInput,
  FiberInput,
  SizeInput,
  SubCategoryInput,
  slugFromName,
} from './catalogue.schemas.js';

export interface ListOptions {
  includeInactive?: boolean;
  search?: string;
  categoryId?: string;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}

function toSlug(input: { slug?: string; name: string }): string {
  return input.slug ? input.slug : slugFromName(input.name);
}

function assertActive(record: { isActive: boolean } | null, label: string): void {
  if (!record || record.isActive === false) {
    throw new AppError(404, `${label} not found`);
  }
}

const nameSearch = (search: string) => ({
  OR: [
    { name: { contains: search, mode: 'insensitive' as const } },
    { slug: { contains: search, mode: 'insensitive' as const } },
  ],
});

// ──────────────────────────────────────────────
// Category
// ──────────────────────────────────────────────

export async function listCategories(options: ListOptions = {}) {
  const where: Prisma.CategoryWhereInput = options.search
    ? nameSearch(options.search)
    : {};
  if (!options.includeInactive) where.isActive = true;
  return prisma.category.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createCategory(input: CategoryInput) {
  const data: Prisma.CategoryCreateInput = {
    name: input.name,
    slug: toSlug(input),
    description: input.description,
    image: input.image,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ?? true,
  };
  try {
    return await prisma.category.create({ data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, 'A category with this slug already exists');
    }
    throw err;
  }
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const data: Prisma.CategoryUpdateInput = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    image: input.image,
    displayOrder: input.displayOrder,
    isActive: input.isActive,
  };
  try {
    return await prisma.category.update({ where: { id }, data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, 'A category with this slug already exists');
    }
    throw err;
  }
}

export async function softDeleteCategory(id: string) {
  await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });
  return { id };
}

// ──────────────────────────────────────────────
// Sub Category
// ──────────────────────────────────────────────

export async function listSubCategories(options: ListOptions = {}) {
  const where: Prisma.SubCategoryWhereInput = options.search
    ? nameSearch(options.search)
    : {};
  if (options.categoryId) where.categoryId = options.categoryId;
  if (!options.includeInactive) where.isActive = true;
  return prisma.subCategory.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createSubCategory(input: SubCategoryInput) {
  const data: Prisma.SubCategoryCreateInput = {
    name: input.name,
    slug: toSlug(input),
    description: input.description,
    image: input.image,
    categoryId: input.categoryId,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ?? true,
  };
  try {
    return await prisma.subCategory.create({ data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, 'A sub-category with this slug already exists');
    }
    throw err;
  }
}

export async function updateSubCategory(id: string, input: Partial<SubCategoryInput>) {
  const data: Prisma.SubCategoryUpdateInput = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    image: input.image,
    categoryId: input.categoryId,
    displayOrder: input.displayOrder,
    isActive: input.isActive,
  };
  try {
    return await prisma.subCategory.update({ where: { id }, data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, 'A sub-category with this slug already exists');
    }
    throw err;
  }
}

export async function softDeleteSubCategory(id: string) {
  await prisma.subCategory.update({
    where: { id },
    data: { isActive: false },
  });
  return { id };
}

// ──────────────────────────────────────────────
// Color
// ──────────────────────────────────────────────

export async function listColors(options: ListOptions = {}) {
  const where: Prisma.ColorWhereInput = options.search
    ? { name: { contains: options.search, mode: 'insensitive' } }
    : {};
  if (!options.includeInactive) where.isActive = true;
  return prisma.color.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createColor(input: ColorInput) {
  const data: Prisma.ColorCreateInput = {
    name: input.name,
    hex: input.hex,
    image: input.image,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ?? true,
  };
  return prisma.color.create({ data });
}

export async function updateColor(id: string, input: Partial<ColorInput>) {
  const data: Prisma.ColorUpdateInput = {
    name: input.name,
    hex: input.hex,
    image: input.image,
    displayOrder: input.displayOrder,
    isActive: input.isActive,
  };
  return prisma.color.update({ where: { id }, data });
}

export async function softDeleteColor(id: string) {
  await prisma.color.update({ where: { id }, data: { isActive: false } });
  return { id };
}

// ──────────────────────────────────────────────
// Size
// ──────────────────────────────────────────────

export async function listSizes(options: ListOptions = {}) {
  const where: Prisma.SizeWhereInput = options.search
    ? {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { code: { contains: options.search, mode: 'insensitive' } },
        ],
      }
    : {};
  if (!options.includeInactive) where.isActive = true;
  return prisma.size.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createSize(input: SizeInput) {
  const data: Prisma.SizeCreateInput = {
    name: input.name,
    code: input.code,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ?? true,
  };
  return prisma.size.create({ data });
}

export async function updateSize(id: string, input: Partial<SizeInput>) {
  const data: Prisma.SizeUpdateInput = {
    name: input.name,
    code: input.code,
    displayOrder: input.displayOrder,
    isActive: input.isActive,
  };
  return prisma.size.update({ where: { id }, data });
}

export async function softDeleteSize(id: string) {
  await prisma.size.update({ where: { id }, data: { isActive: false } });
  return { id };
}

// ──────────────────────────────────────────────
// Fiber
// ──────────────────────────────────────────────

export async function listFibers(options: ListOptions = {}) {
  const where: Prisma.FiberWhereInput = options.search
    ? {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }
    : {};
  if (!options.includeInactive) where.isActive = true;
  return prisma.fiber.findMany({
    where,
    orderBy: [{ name: 'asc' }],
  });
}

export async function createFiber(input: FiberInput) {
  const data: Prisma.FiberCreateInput = {
    name: input.name,
    description: input.description,
    price: input.price,
    image: input.image,
    isActive: input.isActive ?? true,
  };
  return prisma.fiber.create({ data });
}

export async function updateFiber(id: string, input: Partial<FiberInput>) {
  const data: Prisma.FiberUpdateInput = {
    name: input.name,
    description: input.description,
    price: input.price,
    image: input.image,
    isActive: input.isActive,
  };
  return prisma.fiber.update({ where: { id }, data });
}

export async function softDeleteFiber(id: string) {
  await prisma.fiber.update({ where: { id }, data: { isActive: false } });
  return { id };
}

// ──────────────────────────────────────────────
// Embroidery
// ──────────────────────────────────────────────

export async function listEmbroideries(options: ListOptions = {}) {
  const where: Prisma.EmbroideryWhereInput = options.search
    ? {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }
    : {};
  if (!options.includeInactive) where.isActive = true;
  return prisma.embroidery.findMany({
    where,
    orderBy: [{ name: 'asc' }],
  });
}

export async function createEmbroidery(input: EmbroideryInput) {
  const data: Prisma.EmbroideryCreateInput = {
    name: input.name,
    description: input.description,
    surcharge: input.surcharge,
    image: input.image,
    productId: input.productId,
    isActive: input.isActive ?? true,
  };
  return prisma.embroidery.create({ data });
}

export async function updateEmbroidery(id: string, input: Partial<EmbroideryInput>) {
  const data: Prisma.EmbroideryUpdateInput = {
    name: input.name,
    description: input.description,
    surcharge: input.surcharge,
    image: input.image,
    productId: input.productId,
    isActive: input.isActive,
  };
  return prisma.embroidery.update({ where: { id }, data });
}

export async function softDeleteEmbroidery(id: string) {
  await prisma.embroidery.update({ where: { id }, data: { isActive: false } });
  return { id };
}

export async function getActiveCategory(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  assertActive(category, 'Category');
  return category;
}

export async function getActiveFiber(fiberId: string) {
  const fiber = await prisma.fiber.findUnique({ where: { id: fiberId } });
  assertActive(fiber, 'Fiber');
  return fiber;
}