import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listActive() {
  const now = new Date();
  return prisma.offer.findMany({ where: { isActive: true, OR: [{ startDate: null }, { startDate: { lte: now } }], AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }] }, orderBy: { createdAt: 'desc' } });
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