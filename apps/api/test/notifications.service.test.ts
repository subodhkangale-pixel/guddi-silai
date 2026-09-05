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
});
