import { z } from 'zod';

export const fiberInventorySchema = z.object({
  fiberId: z.string().min(1),
  colorId: z.string().min(1),
  stock: z.number().int().min(0),
});

export const stockAdjustmentSchema = z.object({
  quantity: z.number().int().refine((value) => value !== 0, 'Quantity cannot be zero'),
  reason: z.string().max(200).optional(),
});

export const inventoryQuerySchema = z.object({
  lowStockBelow: z.coerce.number().int().min(0).default(5),
});

export type FiberInventoryInput = z.infer<typeof fiberInventorySchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
