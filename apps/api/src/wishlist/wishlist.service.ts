import { ProductType } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { WishlistItemInput } from './wishlist.schemas.js';

export async function getWishlist(userId: string) {
  return prisma.wishlist.findUnique({ where: { userId } });
}

export async function addItem(userId: string, input: WishlistItemInput) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product || !product.isActive) throw new AppError(404, 'Product not found');
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  const items = [...(wishlist?.items ?? [])];
  if (!items.some((item) => item.productId === product.id)) {
    items.push({ productId: product.id, productName: product.name, productDesignId: product.designId, productImage: product.images[0] ?? null, productType: product.type as ProductType, basePrice: product.basePrice, isActive: true });
  }
  if (wishlist) return prisma.wishlist.update({ where: { id: wishlist.id }, data: { items } });
  return prisma.wishlist.create({ data: { userId, items } });
}

export async function removeItem(userId: string, productId: string) {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return null;
  return prisma.wishlist.update({ where: { id: wishlist.id }, data: { items: wishlist.items.filter((item) => item.productId !== productId) } });
}