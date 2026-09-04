import {
  AdminPermission,
  AdminRoleName,
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
} from '@guddi-silai/shared';

import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { comparePassword } from '../auth/auth.utils.js';
import { signAdminToken } from '../auth/auth.utils.js';
import { parseExpiresIn } from '../auth/auth.utils.js';
import { AdminLoginInput } from './admin.schemas.js';
import {
  AdminAuthResult,
  AdminSessionUser,
  ResolvedAdmin,
} from './admin.types.js';

export async function login(input: AdminLoginInput): Promise<AdminAuthResult> {
  const admin = await prisma.adminUser.findUnique({
    where: { email: input.email },
  });
  if (!admin) {
    throw new AppError(401, 'Invalid credentials');
  }

  const valid = await comparePassword(input.password, admin.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid credentials');
  }

  if (admin.isActive === false) {
    throw new AppError(403, 'Account is disabled');
  }

  const resolved = await resolveAdmin(admin.id);
  const token = signAdminToken(admin.id);

  return {
    token,
    expiresIn: parseExpiresIn(env.jwt.expiresIn),
    admin: toSessionAdmin(resolved),
  };
}

export async function getCurrentAdmin(adminId: string): Promise<AdminSessionUser> {
  const resolved = await resolveAdmin(adminId);
  return toSessionAdmin(resolved);
}

export async function resolvePermissions(adminId: string): Promise<AdminPermission[]> {
  const resolved = await resolveAdmin(adminId);
  return resolved.permissions;
}

function toSessionAdmin(admin: ResolvedAdmin): AdminSessionUser {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    roleIds: admin.roleIds,
    permissions: admin.permissions,
  };
}

export async function resolveAdmin(adminId: string): Promise<ResolvedAdmin> {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin || admin.isActive === false) {
    throw new AppError(401, 'Authentication required');
  }

  const roles = await prisma.adminRole.findMany({
    where: { id: { in: admin.roleIds } },
  });

  const roleNames = roles
    .map((role) => role.name as AdminRoleName)
    .filter((name) => ADMIN_ROLES.includes(name));

  const permissionIds = roles.flatMap((role) => role.permissionIds);
  const permissionRecords = permissionIds.length
    ? await prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      })
    : [];

  const seededPermissions = new Set<AdminPermission>();
  for (const name of roleNames) {
    for (const perm of ROLE_PERMISSIONS[name]) {
      seededPermissions.add(perm);
    }
  }
  for (const record of permissionRecords) {
    seededPermissions.add(record.key as AdminPermission);
  }

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    roleIds: admin.roleIds,
    roleNames,
    permissions: Array.from(seededPermissions),
  };
}