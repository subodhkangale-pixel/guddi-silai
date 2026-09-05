import { z } from 'zod';

export const styleOptionsSchema = z
  .object({
    neckline: z.string().trim().max(40).optional(),
    sleeveStyle: z.string().trim().max(60).optional(),
    backDesign: z.string().trim().max(60).optional(),
    embroideryPlacement: z.string().trim().max(60).optional(),
    fitting: z.string().trim().max(40).optional(),
  })
  .default({});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  productType: z.enum(['READY_MADE', 'CUSTOMIZE']),
  variantId: z.string().min(1).optional(),
  colorId: z.string().min(1).optional(),
  sizeId: z.string().min(1).optional(),
  fiberId: z.string().min(1).optional(),
  embroideryId: z.string().min(1).optional(),
  quantity: z.number().int().min(1).max(20).default(1),
  styleOptions: styleOptionsSchema.optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(20),
});

export const updateStyleOptionsSchema = z.object({
  styleOptions: styleOptionsSchema,
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type UpdateStyleOptionsInput = z.infer<typeof updateStyleOptionsSchema>;
