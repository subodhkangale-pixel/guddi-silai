import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().max(2000).optional(),
  image: z.string().url('Invalid image URL').optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const categoryUpdateSchema = categorySchema.partial();

export const subCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().max(2000).optional(),
  image: z.string().url('Invalid image URL').optional(),
  categoryId: z.string().min(1, 'Category is required'),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const subCategoryUpdateSchema = subCategorySchema.partial();

export const colorSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  hex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')
    .optional(),
  image: z.string().url('Invalid image URL').optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const colorUpdateSchema = colorSchema.partial();

export const sizeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(40),
  code: z.string().trim().max(20).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const sizeUpdateSchema = sizeSchema.partial();

export const fiberSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  description: z.string().trim().max(2000).optional(),
  price: z.number().nonnegative('Price cannot be negative'),
  image: z.string().url('Invalid image URL').optional(),
  isActive: z.boolean().optional(),
});

export const fiberUpdateSchema = fiberSchema.partial();

export const embroiderySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z.string().trim().max(2000).optional(),
  surcharge: z.number().nonnegative('Surcharge cannot be negative').optional(),
  image: z.string().url('Invalid image URL').optional(),
  productId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const embroideryUpdateSchema = embroiderySchema.partial();

export type CategoryInput = z.infer<typeof categorySchema>;
export type SubCategoryInput = z.infer<typeof subCategorySchema>;
export type ColorInput = z.infer<typeof colorSchema>;
export type SizeInput = z.infer<typeof sizeSchema>;
export type FiberInput = z.infer<typeof fiberSchema>;
export type EmbroideryInput = z.infer<typeof embroiderySchema>;

export { slugFromName };