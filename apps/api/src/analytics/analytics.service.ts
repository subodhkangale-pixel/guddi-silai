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

async function ordersRevenue(from?: Date, to?: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to }, status: { notIn: ['CANCELLED', 'FAILED'] } },
    select: { total: true, status: true, createdAt: true },
  });
  const value = orders.reduce((sum, order) => sum + order.total, 0);
  return { revenue: Number(value.toFixed(2)), orders: orders.length, byDay: bucketByDay(orders.map((order) => order.createdAt)) };
}

function bucketByDay(dates: Date[]): Record<string, number> {
  const buckets: Record<string, number> = {};
  for (const date of dates) {
    const key = date.toISOString().slice(0, 10);
    buckets[key] = (buckets[key] ?? 0) + 1;
  }
  return buckets;
}

const FUNNEL_STEPS = ['PAGE_VIEW', 'PRODUCT_VIEW', 'CART_ADD', 'CHECKOUT_START', 'ORDER_PLACED', 'PAYMENT_SUCCESS'] as const;

export async function dashboard(from?: Date, to?: Date) {
  const where = { createdAt: { gte: from, lte: to } };
  const events = await prisma.analyticsEvent.findMany({
    where,
    select: { type: true, sessionId: true, productId: true, createdAt: true },
  });

  const counts = events.reduce<Record<string, number>>((result, event) => {
    result[event.type] = (result[event.type] ?? 0) + 1;
    return result;
  }, {});
  const productActivity: Record<string, { views: number; carts: number; orders: number; likes: number }> = {};
  for (const event of events) {
    if (!event.productId) continue;
    const entry = (productActivity[event.productId] ??= { views: 0, carts: 0, orders: 0, likes: 0 });
    if (event.type === 'PRODUCT_VIEW') entry.views += 1;
    else if (event.type === 'CART_ADD') entry.carts += 1;
    else if (event.type === 'ORDER_PLACED') entry.orders += 1;
    else if (event.type === 'WISHLIST_ADD') entry.likes += 1;
  }

  const activityIds = Object.keys(productActivity);
  const products = activityIds.length
    ? await prisma.product.findMany({
        where: { id: { in: activityIds } },
        select: { id: true, name: true, designId: true, slug: true, images: true },
      })
    : [];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const topProducts = activityIds
    .map((id) => {
      const activity = productActivity[id];
      const product = productMap.get(id);
      return {
        productId: id,
        name: product?.name ?? id,
        designId: product?.designId ?? null,
        slug: product?.slug ?? null,
        image: product?.images[0] ?? null,
        views: activity.views,
        carts: activity.carts,
        orders: activity.orders,
        likes: activity.likes,
        score: activity.views + activity.carts * 3 + activity.orders * 10 + activity.likes * 2,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const viewsByDay = bucketByDay(events.filter((event) => event.type === 'PRODUCT_VIEW').map((event) => event.createdAt));
  const cartsByDay = bucketByDay(events.filter((event) => event.type === 'CART_ADD').map((event) => event.createdAt));

  const funnel = Object.fromEntries(FUNNEL_STEPS.map((step) => [step, counts[step] ?? 0])) as Record<(typeof FUNNEL_STEPS)[number], number>;

  const revenue = await ordersRevenue(from, to);

  const days: string[] = [];
  if (from && to) {
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    while (cursor <= end) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return {
    range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
    visitors: new Set(events.map((event) => event.sessionId)).size,
    productsTracked: new Set(events.map((event) => event.productId).filter(Boolean)).size,
    eventCounts: counts,
    topProducts,
    funnel,
    trend: {
      days,
      views: days.map((day) => viewsByDay[day] ?? 0),
      carts: days.map((day) => cartsByDay[day] ?? 0),
      orders: days.map((day) => revenue.byDay[day] ?? 0),
    },
    revenue: { amount: revenue.revenue, orders: revenue.orders },
  };
}
