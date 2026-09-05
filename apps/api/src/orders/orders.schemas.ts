import { z } from 'zod';

export const createOrderSchema = z.object({
  name: z.string().min(2).max(120),
  mobile: z.string().trim().regex(/^(?:\+91[ -]?)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit Indian PIN code'),
  notes: z.string().max(500).optional(),
  shipping: z.number().nonnegative().max(1000).optional(),
  paymentMethod: z.enum(['COD', 'UPI', 'NET_BANKING', 'RAZORPAY']).default('COD'),
  addonIds: z.array(z.string().min(1)).default([]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
