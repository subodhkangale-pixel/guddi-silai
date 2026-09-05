import { Request, Response } from 'express';

import * as inventoryService from './inventory.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { logAdminActivity } from '../middleware/adminAuth.js';

export const listFiberInventory = asyncHandler(async (req: Request, res: Response) => {
  const lowStockBelow = Number(req.query.lowStockBelow ?? 5);
  const data = await inventoryService.listFiberInventory(lowStockBelow);
  res.json({ data });
});

export const upsertFiberInventory = asyncHandler(async (req: Request, res: Response) => {
  const data = await inventoryService.upsertFiberInventory(req.body);
  await logAdminActivity(req.admin!.id, req, { action: 'inventory.fiber_update', targetType: 'fiber_inventory', targetId: data.id, after: data });
  res.json({ data });
});

export const adjustVariantStock = asyncHandler(async (req: Request, res: Response) => {
  const data = await inventoryService.adjustVariantStock(req.params.variantId, req.body);
  await logAdminActivity(req.admin!.id, req, { action: 'inventory.variant_adjust', targetType: 'variant', targetId: data.id, after: { stock: data.stock } });
  res.json({ data });
});
