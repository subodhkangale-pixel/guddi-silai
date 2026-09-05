import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  text: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).default([]),
});

export const moderateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
