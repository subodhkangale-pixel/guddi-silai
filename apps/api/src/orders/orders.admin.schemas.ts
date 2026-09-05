import { z } from 'zod';

export const adminOrderQuerySchema = z.object({
  status: z.enum(['PLACED', 'CONFIRMED', 'PROCESSING', 'STITCHING', 'QUALITY_CHECK', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'FAILED']).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PLACED', 'CONFIRMED', 'PROCESSING', 'STITCHING', 'QUALITY_CHECK', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'FAILED']),
});
