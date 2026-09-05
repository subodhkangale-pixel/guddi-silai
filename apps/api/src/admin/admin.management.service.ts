import { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { hashPassword } from '../auth/auth.utils.js';
import {
  ActivityQueryInput,
  AdminUserCreateInput,
  AdminUserUpdateInput,
  RoleCreateInput,
  RoleUpdateInput,
} from './admin.management.schemas.js';

function toUserDto(admin: {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  isActive: boolean;
  createdAt: Date;
}, roles: { id: string; name: string }[]) {
  return {
    ...admin,
    roleNames: roles.map((role) => role.name),
  };
}

async function assertRolesExist(roleIds: string[]) {
  const count = await prisma.adminRole.count({ where: { id: { in: roleIds } } });
  if (count !== roleIds.length) {
    throw new AppError(400, 'One or more roles do not exist');
  }
}

async function resolvePermissionIds(keys: string[]) {
  const permissions = await prisma.permission.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true },
  });
  if (permissions.length !== keys.length) {
    throw new AppError(400, 'One or more permissions do not exist');
  }
  return permissions.map((permission) => permission.id);
}

export async function listUsers() {
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: 'desc' } });
  const roleIds = [...new Set(users.flatMap((user) => user.roleIds))];
  const roles = roleIds.length
    ? await prisma.adminRole.findMany({ where: { id: { in: roleIds } }, select: { id: true, name: true } })
    : [];
  const roleMap = new Map(roles.map((role) => [role.id, role]));
  return users.map((user) =>
    toUserDto(user, user.roleIds.map((roleId) => roleMap.get(roleId)!).filter(Boolean))
  );
}

export async function createUser(input: AdminUserCreateInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(400, 'An admin with this email already exists');
  }
  await assertRolesExist(input.roleIds);

  const user = await prisma.adminUser.create({
    data: {
      name: input.name,
      email,
      passwordHash: await hashPassword(input.password),
      roleIds: input.roleIds,
    },
  });
  const roles = await prisma.adminRole.findMany({
    where: { id: { in: user.roleIds } },
    select: { id: true, name: true },
  });
  return toUserDto(user, roles);
}

export async function updateUser(id: string, input: AdminUserUpdateInput) {
  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Admin user not found');
  }

  const data: Prisma.AdminUserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.password !== undefined) data.passwordHash = await hashPassword(input.password);
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    const duplicate = await prisma.adminUser.findUnique({ where: { email } });
    if (duplicate && duplicate.id !== id) {
      throw new AppError(400, 'An admin with this email already exists');
    }
    data.email = email;
  }
  if (input.roleIds !== undefined) {
    await assertRolesExist(input.roleIds);
    data.roleIds = input.roleIds;
  }

  const user = await prisma.adminUser.update({ where: { id }, data });
  const roles = await prisma.adminRole.findMany({
    where: { id: { in: user.roleIds } },
    select: { id: true, name: true },
  });
  return toUserDto(user, roles);
}

export async function removeUser(id: string, currentAdminId: string) {
  if (id === currentAdminId) {
    throw new AppError(400, 'You cannot delete your own account');
  }
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'Admin user not found');
  }

  const superAdminRoles = await prisma.adminRole.findMany({
    where: { name: 'SUPER_ADMIN' },
    select: { id: true },
  });
  const superAdminRoleIds = new Set(superAdminRoles.map((role) => role.id));
  const userHasSuperAdmin = user.roleIds.some((roleId) => superAdminRoleIds.has(roleId));
  if (userHasSuperAdmin) {
    const superAdmins = await prisma.adminUser.findMany({
      where: { roleIds: { hasSome: [...superAdminRoleIds] } },
      select: { id: true },
    });
    if (superAdmins.length <= 1) {
      throw new AppError(400, 'Cannot remove the last super admin');
    }
  }

  await prisma.adminUser.delete({ where: { id } });
  return { id };
}

export async function listRoles() {
  const roles = await prisma.adminRole.findMany({ orderBy: { createdAt: 'asc' } });
  const permissionIds = [...new Set(roles.flatMap((role) => role.permissionIds))];
  const permissions = permissionIds.length
    ? await prisma.permission.findMany({ where: { id: { in: permissionIds } } })
    : [];
  const permissionMap = new Map(permissions.map((permission) => [permission.id, permission]));
  return roles.map((role) => ({
    ...role,
    permissions: role.permissionIds
      .map((permissionId) => permissionMap.get(permissionId))
      .filter(Boolean),
  }));
}

export async function createRole(input: RoleCreateInput) {
  const name = input.name.trim().toUpperCase();
  const existing = await prisma.adminRole.findUnique({ where: { name } });
  if (existing) {
    throw new AppError(400, 'Role already exists');
  }
  const permissionIds = await resolvePermissionIds(input.permissionKeys);
  return prisma.adminRole.create({
    data: {
      name,
      description: input.description ?? null,
      permissionIds,
      isSystem: false,
    },
  });
}

export async function updateRole(id: string, input: RoleUpdateInput) {
  const role = await prisma.adminRole.findUnique({ where: { id } });
  if (!role) {
    throw new AppError(404, 'Role not found');
  }

  const data: Prisma.AdminRoleUpdateInput = {};
  if (input.name !== undefined) {
    const name = input.name.trim().toUpperCase();
    const duplicate = await prisma.adminRole.findUnique({ where: { name } });
    if (duplicate && duplicate.id !== id) {
      throw new AppError(400, 'Role already exists');
    }
    data.name = name;
  }
  if (input.description !== undefined) data.description = input.description ?? null;
  if (input.permissionKeys !== undefined) {
    data.permissionIds = { set: await resolvePermissionIds(input.permissionKeys) };
  }

  return prisma.adminRole.update({ where: { id }, data });
}

export async function removeRole(id: string) {
  const role = await prisma.adminRole.findUnique({ where: { id } });
  if (!role) {
    throw new AppError(404, 'Role not found');
  }
  if (role.isSystem) {
    throw new AppError(400, 'System roles cannot be deleted');
  }
  await prisma.adminRole.delete({ where: { id } });
  return { id };
}

export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: { name: 'asc' } });
}

export async function listActivity(input: ActivityQueryInput) {
  const where: Prisma.AdminActivityLogWhereInput = {};
  if (input.action) where.action = input.action;
  if (input.adminUserId) where.adminUserId = input.adminUserId;
  if (input.targetType) where.targetType = input.targetType;

  const [logs, total] = await Promise.all([
    prisma.adminActivityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: input.offset ?? 0,
      take: Math.min(input.limit ?? 50, 200),
    }),
    prisma.adminActivityLog.count({ where }),
  ]);

  const adminIds = [...new Set(logs.map((log) => log.adminUserId))];
  const admins = adminIds.length
    ? await prisma.adminUser.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const adminMap = new Map(admins.map((admin) => [admin.id, admin]));

  return {
    logs: logs.map((log) => ({
      ...log,
      admin: adminMap.get(log.adminUserId) ?? null,
    })),
    total,
  };
}