import { z } from 'zod';

export const createOrderSchema = z.object({
  name: z.string().min(2).max(120),
  mobile: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().min(4).max(10),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['COD', 'RAZORPAY']).default('COD'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
