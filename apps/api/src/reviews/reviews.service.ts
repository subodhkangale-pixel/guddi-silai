import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreateReviewInput } from './reviews.schemas.js';

export async function listApproved(productId: string) {
  return prisma.review.findMany({ where: { productId, status: 'approved' }, orderBy: { createdAt: 'desc' } });
}

export async function createReview(userId: string, input: CreateReviewInput) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product || !product.isActive) throw new AppError(404, 'Product not found');
  if (product.type !== 'READY_MADE') throw new AppError(400, 'Reviews are only available for ready-made products');
  const existing = await prisma.review.findUnique({ where: { userId_productId: { userId, productId: input.productId } } });
  if (existing) throw new AppError(409, 'You have already reviewed this product');
  return prisma.review.create({ data: { ...input, userId, status: 'pending' } });
}

export async function listForAdmin(status?: string) {
  return prisma.review.findMany({ where: status ? { status } : undefined, orderBy: { createdAt: 'desc' } });
}

export async function moderate(id: string, status: 'approved' | 'rejected') {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new AppError(404, 'Review not found');
  return prisma.review.update({ where: { id }, data: { status } });
}
