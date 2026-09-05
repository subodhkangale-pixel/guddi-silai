import { z } from 'zod';

const eventTypes = ['PAGE_VIEW', 'PRODUCT_VIEW', 'PRODUCT_VIEW_START', 'PRODUCT_VIEW_END', 'PRODUCT_IMAGE_VIEW', 'IMAGE_ZOOM', 'SEARCH', 'CATEGORY_VIEW', 'WISHLIST_ADD', 'CART_ADD', 'CART_REMOVE', 'BUY_NOW', 'CHECKOUT_START', 'MEASUREMENT_START', 'MEASUREMENT_COMPLETE', 'WHATSAPP_CLICK', 'SHARE', 'ORDER_PLACED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED'] as const;

export const eventSchema = z.object({
  type: z.enum(eventTypes),
  sessionId: z.string().min(1).max(200),
  userId: z.string().min(1).optional(),
  productId: z.string().min(1).optional(),
  variantId: z.string().min(1).optional(),
  deviceInfo: z.object({ device: z.string().max(80).optional(), browser: z.string().max(80).optional(), os: z.string().max(80).optional(), screen: z.string().max(40).optional() }).optional(),
  trafficSource: z.object({ source: z.string().max(80).optional(), medium: z.string().max(80).optional(), campaign: z.string().max(120).optional() }).optional(),
  properties: z.record(z.unknown()).optional(),
});

export const analyticsRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type EventInput = z.infer<typeof eventSchema>;
