import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    notification: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    adminUser: { findMany: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import * as notificationsService from '../src/notifications/notifications.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  prisma.notification.create.mockResolvedValue({ id: 'n1' });
  prisma.adminUser.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
});

describe('notifications service', () => {
  it('creates notifications for all active admins', async () => {
    await notificationsService.createForAdmins('New order', 'Order received', 'NEW_ORDER');
    expect(prisma.notification.create).toHaveBeenCalledTimes(2);
  });

  it('lists no notifications for guests', async () => {
    await expect(notificationsService.listForIdentity('guest-1', 'guest')).resolves.toEqual([]);
    expect(prisma.notification.findMany).not.toHaveBeenCalled();
  });

  it('lists notifications for a specific admin', async () => {
    prisma.notification.findMany.mockResolvedValue([{ id: 'n1', adminUserId: 'a1' }]);
    await notificationsService.listForAdmin('a1');
    expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { adminUserId: 'a1' } }));
  });

  it('marks only the admins own notification as read', async () => {
    prisma.notification.findFirst.mockResolvedValue({ id: 'n1', adminUserId: 'a1' });
    await notificationsService.markAdminRead('a1', 'n1');
    expect(prisma.notification.findFirst).toHaveBeenCalledWith({ where: { id: 'n1', adminUserId: 'a1' } });
    expect(prisma.notification.update).toHaveBeenCalledWith({ where: { id: 'n1' }, data: { isRead: true } });
  });

  it('throws 404 when marking a missing admin notification', async () => {
    prisma.notification.findFirst.mockResolvedValue(null);
    await expect(notificationsService.markAdminRead('a1', 'missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});
