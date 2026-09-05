import { CouponType } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { ApplyCouponInput, couponSchema } from './coupons.schemas.js';

export async function applyCoupon(ownerKey: string, input: ApplyCouponInput) {
  const cart = await prisma.cart.findUnique({ where: { ownerKey } });
  if (!cart || cart.items.length === 0) throw new AppError(400, 'Your cart is empty');
  const subtotal = Number(cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2));
  const coupon = await prisma.coupon.findUnique({ where: { code: input.code.toUpperCase() } });
  if (!coupon || !coupon.isActive || (coupon.expiresAt && coupon.expiresAt < new Date())) throw new AppError(400, 'Coupon is invalid or expired');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw new AppError(400, 'Coupon usage limit reached');
  if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount) throw new AppError(400, `Minimum order value is ₹${coupon.minOrderAmount}`);
  if (coupon.applicableProductIds.length > 0 && !cart.items.some((item) => coupon.applicableProductIds.includes(item.productId))) throw new AppError(400, 'Coupon does not apply to these products');
  const rawDiscount = coupon.type === CouponType.PERCENT ? subtotal * coupon.value / 100 : coupon.value;
  const discount = Number(Math.min(rawDiscount, coupon.maxDiscount ?? rawDiscount, subtotal).toFixed(2));
  const updated = await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: coupon.code, discount, totalPrice: Number((cart.totalPrice - discount).toFixed(2)) } });
  return { cart: updated, discount };
}

export async function removeCoupon(ownerKey: string) {
  const cart = await prisma.cart.findUnique({ where: { ownerKey } });
  if (!cart) throw new AppError(404, 'Cart not found');
  const subtotal = Number(cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2));
  return prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null, discount: 0, totalPrice: subtotal } });
}

export async function adminList() {
  return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function adminCreate(input: ReturnType<typeof couponSchema.parse>) {
  return prisma.coupon.create({ data: input });
}
