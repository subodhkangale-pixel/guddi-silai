import 'dotenv/config';

import {
  ADMIN_ROLES,
  ADMIN_PERMISSIONS,
  ROLE_PERMISSIONS,
} from '@guddi-silai/shared';
import bcrypt from 'bcryptjs';

import { prisma } from '../src/lib/prisma.js';

const roleDescriptions: Record<string, string> = {
  SUPER_ADMIN: 'Full access to every admin area.',
  ORDER_MANAGER: 'Manage orders and customer enquiries.',
  PRODUCT_MANAGER: 'Manage products, catalogue reference data, and inventory.',
  STITCHING_MANAGER: 'Manage customized orders and measurements.',
  ANALYST: 'View analytics reports and dashboards.',
};

async function seedPermissions(): Promise<Record<string, string>> {
  const keyToId: Record<string, string> = {};
  for (const key of ADMIN_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, name: key },
    });
    keyToId[key] = record.id;
  }
  return keyToId;
}

async function seedRoles(keyToId: Record<string, string>): Promise<void> {
  for (const name of ADMIN_ROLES) {
    const permissionIds = ROLE_PERMISSIONS[name].map((perm) => keyToId[perm]);
    await prisma.adminRole.upsert({
      where: { name },
      update: { permissionIds },
      create: {
        name,
        description: roleDescriptions[name] ?? null,
        permissionIds,
        isSystem: true,
      },
    });
  }
}

async function seedSuperAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn(
      'ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping bootstrap SUPER_ADMIN creation.'
    );
    return;
  }

  const superRole = await prisma.adminRole.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });
  if (!superRole) {
    throw new Error('SUPER_ADMIN role not found during seed');
  }

  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || '12'));
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    await prisma.adminUser.update({
      where: { email },
      data: { passwordHash, roleIds: [superRole.id], isActive: true },
    });
  } else {
    await prisma.adminUser.create({
      data: {
        name: email.split('@')[0] ?? 'Super Admin',
        email,
        passwordHash,
        roleIds: [superRole.id],
      },
    });
  }
}

async function main(): Promise<void> {
  const keyToId = await seedPermissions();
  await seedRoles(keyToId);
  await seedSuperAdmin();
}

main()
  .then(() => {
    console.log('Seeding complete.');
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });