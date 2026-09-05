import { Request, Response } from 'express';

import * as addonsService from './addons.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { logAdminActivity } from '../middleware/adminAuth.js';
import { AddonInput } from './addons.schemas.js';

export const listActive = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await addonsService.listActive() });
});

export const adminList = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await addonsService.adminList() });
});

export const adminCreate = asyncHandler(async (req: Request, res: Response) => {
  const addon = await addonsService.adminCreate(req.body as AddonInput);
  await logAdminActivity(req.admin!.id, req, {
    action: 'ADDON_CREATE',
    targetType: 'Addon',
    targetId: addon.id,
    after: { name: addon.name, price: addon.price },
  });
  res.status(201).json({ data: addon });
});

export const adminUpdate = asyncHandler(async (req: Request, res: Response) => {
  const addon = await addonsService.adminUpdate(req.params.id, req.body as Partial<AddonInput>);
  await logAdminActivity(req.admin!.id, req, {
    action: 'ADDON_UPDATE',
    targetType: 'Addon',
    targetId: addon.id,
    after: { name: addon.name, price: addon.price, isActive: addon.isActive },
  });
  res.json({ data: addon });
});

export const adminRemove = asyncHandler(async (req: Request, res: Response) => {
  const result = await addonsService.adminRemove(req.params.id);
  await logAdminActivity(req.admin!.id, req, {
    action: 'ADDON_REMOVE',
    targetType: 'Addon',
    targetId: result.id,
  });
  res.json({ data: result });
});