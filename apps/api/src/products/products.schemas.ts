import { z } from 'zod';

import {
  AVAILABILITY_FILTERS,
  SORT_OPTIONS,
} from '@guddi-silai/shared';
import { slugFromName } from '../catalogue/catalogue.schemas.js';

export { slugFromName };

const productTypeSchema = z.enum(['READY_MADE', 'CUSTOMIZE', 'SHOWCASE']);

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');

const idArray = z
  .array(z.string().min(1))
  .max(100, 'Too many options');

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  designId: z.string().trim().max(50).optional(),
  slug: slugSchema.optional(),
  description: z.string().trim().max(5000).optional(),
  type: productTypeSchema,
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().optional(),
  basePrice: z.number().nonnegative('Price cannot be negative'),
  compareAtPrice: z.number().nonnegative().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  colors: idArray.optional(),
  sizes: idArray.optional(),
  fiberIds: idArray.optional(),
  embroideryIds: idArray.optional(),
  images: z.array(z.string().url('Invalid image URL')).max(30).optional(),
  videos: z.array(z.string().url('Invalid video URL')).max(10).optional(),
  tags: z.array(z.string().trim().min(1)).max(30).optional(),
  seo: z
    .object({
      title: z.string().trim().max(200).optional(),
      description: z.string().trim().max(500).optional(),
      keywords: z.array(z.string().trim().min(1)).optional(),
      ogImage: z.string().url('Invalid image URL').optional(),
    })
    .optional(),
  expectedAvailability: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const productUpdateSchema = productSchema.partial();

export const variantSchema = z.object({
  sku: z.string().trim().max(80).optional(),
  colorId: z.string().min(1, 'Color is required'),
  sizeId: z.string().min(1, 'Size is required'),
  price: z.number().nonnegative('Price cannot be negative'),
  discount: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().optional(),
});

export const variantUpdateSchema = variantSchema.partial();

export const productQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  colorId: z.string().optional(),
  sizeId: z.string().optional(),
  fiberId: z.string().optional(),
  embroideryId: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  availability: z.enum(AVAILABILITY_FILTERS).optional(),
  sort: z.enum(SORT_OPTIONS).default('newest'),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminProductQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeInactive: z.coerce.boolean().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
export type AdminProductQueryParams = z.infer<
  typeof adminProductQuerySchema
>;