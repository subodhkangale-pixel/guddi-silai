import { CouponType } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { fetchActiveOffers } from '../lib/activeOffers.js';
import { AppError } from '../middleware/errorHandler.js';
import { ApplyCouponInput, couponSchema } from './coupons.schemas.js';

function cartSubtotal(items: { unitPrice: number; quantity: number }[]) {
  return Number(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2));
}

async function computeOfferDiscount(items: { unitPrice: number; quantity: number; productId: string }[]): Promise<number> {
  const subtotal = cartSubtotal(items);
  const productIds = items.map((item) => item.productId).filter(Boolean);
  if (productIds.length === 0) return 0;

  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, categoryId: true } });
  const offers = await fetchActiveOffers();

  let discount = 0;
  for (const offer of offers) {
    let applies = false;
    if (offer.applicableProductIds.length > 0 && productIds.some((id) => offer.applicableProductIds.includes(id))) applies = true;
    if (offer.applicableCategoryIds.length > 0 && products.some((product) => offer.applicableCategoryIds.includes(product.categoryId))) applies = true;
    if (offer.applicableProductIds.length === 0 && offer.applicableCategoryIds.length === 0) applies = true;
    if (!applies) continue;
    const value = offer.type === 'PERCENT' ? subtotal * offer.value / 100 : offer.value;
    discount += value;
  }
  return Number(Math.min(discount, subtotal).toFixed(2));
}

export async function applyCoupon(ownerKey: string, input: ApplyCouponInput) {
  const cart = await prisma.cart.findUnique({ where: { ownerKey } });
  if (!cart || cart.items.length === 0) throw new AppError(400, 'Your cart is empty');
  const subtotal = cartSubtotal(cart.items);
  const coupon = await prisma.coupon.findUnique({ where: { code: input.code.toUpperCase() } });
  if (!coupon || !coupon.isActive || (coupon.expiresAt && coupon.expiresAt < new Date())) throw new AppError(400, 'Coupon is invalid or expired');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw new AppError(400, 'Coupon usage limit reached');
  if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount) throw new AppError(400, `Minimum order value is ₹${coupon.minOrderAmount}`);

  const itemProductIds = cart.items.map((item) => item.productId).filter(Boolean);
  if (coupon.applicableProductIds.length > 0 && !cart.items.some((item) => item.productId && coupon.applicableProductIds.includes(item.productId))) {
    throw new AppError(400, 'Coupon does not apply to these products');
  }
  if (coupon.applicableCategoryIds.length > 0) {
    const products = await prisma.product.findMany({ where: { id: { in: itemProductIds } }, select: { id: true, categoryId: true } });
    const matchesCategory = products.some((product) => coupon.applicableCategoryIds.includes(product.categoryId));
    if (!matchesCategory) throw new AppError(400, 'Coupon does not apply to these products');
  }

  const rawDiscount = coupon.type === CouponType.PERCENT ? subtotal * coupon.value / 100 : coupon.value;
  const couponDiscount = Number(Math.min(rawDiscount, coupon.maxDiscount ?? rawDiscount, subtotal).toFixed(2));
  const offerDiscount = await computeOfferDiscount(cart.items);
  const totalDiscount = Number(Math.min(couponDiscount + offerDiscount, subtotal).toFixed(2));
  const updated = await prisma.cart.update({
    where: { id: cart.id },
    data: {
      couponCode: coupon.code,
      discount: totalDiscount,
      offerDiscount,
      totalPrice: Number((subtotal - totalDiscount).toFixed(2)),
    },
  });
  return { cart: updated, discount: totalDiscount };
}

export async function removeCoupon(ownerKey: string) {
  const cart = await prisma.cart.findUnique({ where: { ownerKey } });
  if (!cart) throw new AppError(404, 'Cart not found');
  const subtotal = cartSubtotal(cart.items);
  const offerDiscount = await computeOfferDiscount(cart.items);
  return prisma.cart.update({
    where: { id: cart.id },
    data: { couponCode: null, discount: offerDiscount, offerDiscount, totalPrice: Number((subtotal - offerDiscount).toFixed(2)) },
  });
}

export async function adminList() {
  return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function adminCreate(input: ReturnType<typeof couponSchema.parse>) {
  return prisma.coupon.create({ data: input });
}

export async function adminUpdate(id: string, input: Partial<ReturnType<typeof couponSchema.parse>>) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new AppError(404, 'Coupon not found');
  return prisma.coupon.update({ where: { id }, data: input });
}

export async function adminRemove(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new AppError(404, 'Coupon not found');
  return prisma.coupon.delete({ where: { id } });
}
