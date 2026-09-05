import { Router } from 'express';

import * as inventoryController from './inventory.controller.js';
import { fiberInventorySchema, inventoryQuerySchema, stockAdjustmentSchema } from './inventory.schemas.js';
import { requireAdmin, authorize } from '../middleware/adminAuth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

const router: Router = Router();
router.use(requireAdmin);
router.get('/fiber', authorize('inventory:read'), validateQuery(inventoryQuerySchema), inventoryController.listFiberInventory);
router.put('/fiber', authorize('inventory:write'), validateBody(fiberInventorySchema), inventoryController.upsertFiberInventory);
router.patch('/variants/:variantId/stock', authorize('inventory:write'), validateBody(stockAdjustmentSchema), inventoryController.adjustVariantStock);

export default router;
