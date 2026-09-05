import { z } from 'zod';

export const createPaymentSchema = z.object({
  orderNumber: z.string().min(1),
});

export const verifyPaymentSchema = z.object({
  orderNumber: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
