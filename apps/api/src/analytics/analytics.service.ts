import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { EventInput } from './analytics.schemas.js';

export async function recordEvent(input: EventInput) {
  const { properties, ...rest } = input;
  return prisma.analyticsEvent.create({
    data: {
      ...rest,
      properties: properties as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function summary(from?: Date, to?: Date) {
  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { type: true, sessionId: true, productId: true },
  });
  const counts = events.reduce<Record<string, number>>((result, event) => {
    result[event.type] = (result[event.type] ?? 0) + 1;
    return result;
  }, {});
  return {
    range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
    visitors: new Set(events.map((event) => event.sessionId)).size,
    productViews: counts.PRODUCT_VIEW ?? 0,
    addToCart: counts.CART_ADD ?? 0,
    wishlistAdds: counts.WISHLIST_ADD ?? 0,
    orders: counts.ORDER_PLACED ?? 0,
    payments: counts.PAYMENT_SUCCESS ?? 0,
    searches: counts.SEARCH ?? 0,
    eventCounts: counts,
    productsTracked: new Set(events.map((event) => event.productId).filter(Boolean)).size,
  };
}
