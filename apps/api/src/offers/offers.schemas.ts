import { z } from 'zod';

export const offerSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENT', 'FIXED', 'FESTIVAL']),
  value: z.number().positive(),
  applicableCategoryIds: z.array(z.string()).default([]),
  applicableProductIds: z.array(z.string()).default([]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});