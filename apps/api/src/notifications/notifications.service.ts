import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listForIdentity(identityId: string, type: 'user' | 'guest') {
  if (type === 'guest') return [];
  return prisma.notification.findMany({ where: { userId: identityId }, orderBy: { createdAt: 'desc' } });
}

export async function markRead(identityId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId: identityId } });
  if (!notification) throw new AppError(404, 'Notification not found');
  return prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
}

export async function createForUser(userId: string, title: string, message: string, type: string) {
  return prisma.notification.create({ data: { userId, title, message, type } });
}

export async function createForAdmins(title: string, message: string, type: string) {
  const admins = await prisma.adminUser.findMany({ where: { isActive: true }, select: { id: true } });
  return Promise.all(admins.map((admin) => prisma.notification.create({ data: { adminUserId: admin.id, title, message, type } })));
}

export async function listForAdmin(adminId: string) {
  return prisma.notification.findMany({ where: { adminUserId: adminId }, orderBy: { createdAt: 'desc' }, take: 100 });
}

export async function markAdminRead(adminId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, adminUserId: adminId } });
  if (!notification) throw new AppError(404, 'Notification not found');
  return prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
}
