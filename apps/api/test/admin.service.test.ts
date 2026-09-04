import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    adminUser: { findUnique: vi.fn() },
    adminRole: { findMany: vi.fn() },
    permission: { findMany: vi.fn() },
    adminActivityLog: { create: vi.fn() },
  },
}));

vi.mock('../src/auth/auth.utils.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../src/auth/auth.utils.js')>();
  return { ...mod, comparePassword: vi.fn() };
});

import { comparePassword } from '../src/auth/auth.utils.js';
import { prisma } from '../src/lib/prisma.js';
import * as adminService from '../src/admin/admin.service.js';

const mockAdminFindUnique = vi.mocked(prisma.adminUser.findUnique);
const mockRoleFindMany = vi.mocked(prisma.adminRole.findMany);
const mockPermissionFindMany = vi.mocked(prisma.permission.findMany);
const mockComparePassword = vi.mocked(comparePassword);

const adminRecord = {
  id: 'admin-1',
  name: 'Deepak',
  email: 'deepak@guddisilai.in',
  passwordHash: 'hashed',
  roleIds: ['role-order'],
  isActive: true,
};

const orderManagerRoles = [
  { id: 'role-order', name: 'ORDER_MANAGER', permissionIds: ['perm-order-read'] },
];

const orderReadPermission = [{ id: 'perm-order-read', key: 'order:read' }];

function resetAll() {
  mockAdminFindUnique.mockReset();
  mockRoleFindMany.mockReset();
  mockPermissionFindMany.mockReset();
  mockComparePassword.mockReset();
}

describe('admin login', () => {
  beforeEach(resetAll);

  it('returns a token and resolved permissions for valid credentials', async () => {
    mockComparePassword.mockResolvedValue(true);
    mockAdminFindUnique.mockResolvedValue(adminRecord);
    mockRoleFindMany.mockResolvedValue(orderManagerRoles);
    mockPermissionFindMany.mockResolvedValue(orderReadPermission);

    const result = await adminService.login({
      email: 'deepak@guddisilai.in',
      password: 'correct-password',
    });

    expect(result.token).toBeTruthy();
    expect(result.admin.id).toBe('admin-1');
    expect(result.admin.permissions).toContain('order:read');
    expect(result.admin.permissions).toContain('order:write');
    expect(mockAdminFindUnique).toHaveBeenCalledWith({
      where: { email: 'deepak@guddisilai.in' },
    });
  });

  it('rejects an unknown email', async () => {
    mockAdminFindUnique.mockResolvedValue(null);

    await expect(
      adminService.login({ email: 'ghost@guddisilai.in', password: 'x' })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(mockComparePassword).not.toHaveBeenCalled();
  });

  it('rejects a wrong password', async () => {
    mockComparePassword.mockResolvedValue(false);
    mockAdminFindUnique.mockResolvedValue(adminRecord);

    await expect(
      adminService.login({ email: 'deepak@guddisilai.in', password: 'wrong' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects a disabled admin account', async () => {
    mockComparePassword.mockResolvedValue(true);
    mockAdminFindUnique.mockResolvedValue({ ...adminRecord, isActive: false });

    await expect(
      adminService.login({ email: 'deepak@guddisilai.in', password: 'correct' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns a token whose payload is the admin id', async () => {
    mockComparePassword.mockResolvedValue(true);
    mockAdminFindUnique.mockResolvedValue(adminRecord);
    mockRoleFindMany.mockResolvedValue(orderManagerRoles);
    mockPermissionFindMany.mockResolvedValue(orderReadPermission);

    const { token } = await adminService.login({
      email: 'deepak@guddisilai.in',
      password: 'correct-password',
    });

    const decoded = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
    );
    expect(decoded.sub).toBe('admin-1');
    expect(decoded.type).toBe('admin');
  });
});

describe('getCurrentAdmin', () => {
  beforeEach(resetAll);

  it('resolves the current admin with role-derived permissions', async () => {
    mockAdminFindUnique.mockResolvedValue(adminRecord);
    mockRoleFindMany.mockResolvedValue(orderManagerRoles);
    mockPermissionFindMany.mockResolvedValue([]);

    const admin = await adminService.getCurrentAdmin('admin-1');

    expect(admin.permissions).toContain('order:read');
    expect(admin.permissions).toContain('order:write');
    expect(admin.permissions).not.toContain('admin:manage');
  });

  it('throws when the admin does not exist', async () => {
    mockAdminFindUnique.mockResolvedValue(null);

    await expect(adminService.getCurrentAdmin('ghost')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});