import { prisma } from '../lib/prisma.js';
import { fetchActiveOffers } from '../lib/activeOffers.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listActive() {
  const offers = await fetchActiveOffers();
  return offers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function adminList() {
  return prisma.offer.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function adminCreate(input: unknown) {
  return prisma.offer.create({ data: input as Parameters<typeof prisma.offer.create>[0]['data'] });
}

export async function adminDeactivate(id: string) {
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) throw new AppError(404, 'Offer not found');
  return prisma.offer.update({ where: { id }, data: { isActive: false } });
}