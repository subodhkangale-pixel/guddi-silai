import { Router } from 'express';

import * as ordersController from './orders.controller.js';
import { adminOrderQuerySchema, updateOrderStatusSchema } from './orders.admin.schemas.js';
import { requireAdmin, authorize, logAdminActivity } from '../middleware/adminAuth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as ordersService from './orders.service.js';
import * as notificationsService from '../notifications/notifications.service.js';

const router: Router = Router();
router.use(requireAdmin);
router.get('/orders', authorize('order:read'), validateQuery(adminOrderQuerySchema), ordersController.adminListOrders);
router.get('/orders/:id', authorize('order:read'), ordersController.getAdminOrder);
router.patch(
  '/orders/:id/status',
  authorize('order:write'),
  validateBody(updateOrderStatusSchema),
  asyncHandler(async (req, res) => {
    const updated = await ordersService.adminUpdateStatus(req.params.id, req.body.status);
    if (updated.userId) {
      await notificationsService.createForUser(updated.userId, 'Order status updated', `Your order ${updated.orderNumber} is now ${updated.status}.`, 'ORDER_STATUS_UPDATED');
    }
    await logAdminActivity(req.admin!.id, req, {
      action: 'order.status_update',
      targetType: 'order',
      targetId: req.params.id,
      after: { status: req.body.status },
    });
    res.json({ data: updated });
  })
);

export default router;