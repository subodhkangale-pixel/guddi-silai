import { z } from 'zod';

export const addonSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  description: z.string().trim().max(300).optional().nullable(),
  price: z.number().min(0, 'Price cannot be negative'),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type AddonInput = z.infer<typeof addonSchema>;