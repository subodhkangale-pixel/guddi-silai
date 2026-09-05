import { z } from 'zod';

import { ADMIN_PERMISSIONS } from '@guddi-silai/shared';

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  roleIds: z.array(z.string().min(1)).min(1, 'Select at least one role'),
});

export const adminUserUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128).optional(),
    roleIds: z.array(z.string().min(1)).min(1, 'Select at least one role').optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const roleCreateSchema = z.object({
  name: z.string().trim().min(1, 'Role name is required').max(40),
  description: z.string().trim().max(200).optional().nullable(),
  permissionKeys: z
    .array(z.enum(ADMIN_PERMISSIONS))
    .default([]),
});

export const roleUpdateSchema = roleCreateSchema.partial();

export const activityQuerySchema = z.object({
  action: z.string().trim().optional(),
  adminUserId: z.string().trim().optional(),
  targetType: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
export type ActivityQueryInput = z.infer<typeof activityQuerySchema>;