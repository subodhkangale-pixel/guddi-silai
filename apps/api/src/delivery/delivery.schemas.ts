import { z } from 'zod';

export const pincodeSchema = z.object({
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode'),
});

export const shippingEstimateSchema = z.object({
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode'),
});

export type PincodeInput = z.infer<typeof pincodeSchema>;