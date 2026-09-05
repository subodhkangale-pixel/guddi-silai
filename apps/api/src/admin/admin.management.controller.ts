import { Request, Response } from 'express';

import * as managementService from './admin.management.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { logAdminActivity } from '../middleware/adminAuth.js';
import { AdminUserUpdateInput, ActivityQueryInput, RoleUpdateInput } from './admin.management.schemas.js';

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await managementService.listUsers() });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await managementService.createUser(req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'ADMIN_USER_CREATE',
    targetType: 'AdminUser',
    targetId: user.id,
    after: { email: user.email },
  });
  res.status(201).json({ data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await managementService.updateUser(req.params.id, req.body as AdminUserUpdateInput);
  await logAdminActivity(req.admin!.id, req, {
    action: 'ADMIN_USER_UPDATE',
    targetType: 'AdminUser',
    targetId: user.id,
    after: { email: user.email, isActive: user.isActive },
  });
  res.json({ data: user });
});

export const removeUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await managementService.removeUser(req.params.id, req.admin!.id);
  await logAdminActivity(req.admin!.id, req, {
    action: 'ADMIN_USER_REMOVE',
    targetType: 'AdminUser',
    targetId: result.id,
  });
  res.json({ data: result });
});

export const listRoles = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await managementService.listRoles() });
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await managementService.createRole(req.body);
  await logAdminActivity(req.admin!.id, req, {
    action: 'ADMIN_ROLE_CREATE',
    targetType: 'AdminRole',
    targetId: role.id,
    after: { name: role.name },
  });
  res.status(201).json({ data: role });
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await managementService.updateRole(req.params.id, req.body as RoleUpdateInput);
  await logAdminActivity(req.admin!.id, req, {
    action: 'ADMIN_ROLE_UPDATE',
    targetType: 'AdminRole',
    targetId: role.id,
    after: { name: role.name },
  });
  res.json({ data: role });
});

export const removeRole = asyncHandler(async (req: Request, res: Response) => {
  const result = await managementService.removeRole(req.params.id);
  await logAdminActivity(req.admin!.id, req, {
    action: 'ADMIN_ROLE_REMOVE',
    targetType: 'AdminRole',
    targetId: result.id,
  });
  res.json({ data: result });
});

export const listPermissions = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await managementService.listPermissions() });
});

export const listActivity = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await managementService.listActivity(req.query as ActivityQueryInput) });
});