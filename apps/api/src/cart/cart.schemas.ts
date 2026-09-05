import { z } from 'zod';

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  productType: z.enum(['READY_MADE', 'CUSTOMIZE']),
  variantId: z.string().min(1).optional(),
  colorId: z.string().min(1).optional(),
  sizeId: z.string().min(1).optional(),
  fiberId: z.string().min(1).optional(),
  embroideryId: z.string().min(1).optional(),
  quantity: z.number().int().min(1).max(20).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(20),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
