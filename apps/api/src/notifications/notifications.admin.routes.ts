import { Router } from 'express';

import { requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as notificationsService from './notifications.service.js';

const router: Router = Router();
router.use(requireAdmin);
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const list = await notificationsService.listForAdmin(req.admin!.id);
    res.json({ data: list });
  })
);
router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const updated = await notificationsService.markAdminRead(req.admin!.id, req.params.id);
    res.json({ data: updated });
  })
);

export default router;