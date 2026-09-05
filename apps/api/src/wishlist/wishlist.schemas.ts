import { z } from 'zod';

export const wishlistItemSchema = z.object({ productId: z.string().min(1) });
export type WishlistItemInput = z.infer<typeof wishlistItemSchema>;