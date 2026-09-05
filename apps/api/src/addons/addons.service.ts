import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AddonInput } from './addons.schemas.js';

export async function listActive() {
  return prisma.addon.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function adminList() {
  return prisma.addon.findMany({ orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] });
}

export async function adminCreate(input: AddonInput) {
  return prisma.addon.create({ data: input });
}

export async function adminUpdate(id: string, input: Partial<AddonInput>) {
  const addon = await prisma.addon.findUnique({ where: { id } });
  if (!addon) throw new AppError(404, 'Add-on not found');
  return prisma.addon.update({ where: { id }, data: input });
}

export async function adminRemove(id: string) {
  const addon = await prisma.addon.findUnique({ where: { id } });
  if (!addon) throw new AppError(404, 'Add-on not found');
  return prisma.addon.delete({ where: { id } });
}