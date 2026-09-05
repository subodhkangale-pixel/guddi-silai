import { z } from 'zod';

export const applyCouponSchema = z.object({ code: z.string().trim().min(1).max(40) });
export const couponSchema = z.object({
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  applicableCategoryIds: z.array(z.string()).default([]),
  applicableProductIds: z.array(z.string()).default([]),
  expiresAt: z.coerce.date().optional(),
});
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
