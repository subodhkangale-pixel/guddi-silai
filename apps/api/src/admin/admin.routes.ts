import { Router } from 'express';

import { login, me } from './admin.controller.js';
import { adminLoginSchema } from './admin.schemas.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import catalogueAdminRouter from '../catalogue/catalogue.admin.routes.js';
import productsAdminRouter from '../products/products.admin.routes.js';
import ordersAdminRouter from '../orders/orders.admin.routes.js';
import inventoryRouter from '../inventory/inventory.routes.js';
import couponsAdminRouter from '../coupons/coupons.admin.routes.js';
import notificationsAdminRouter from '../notifications/notifications.admin.routes.js';
import addonsAdminRouter from '../addons/addons.admin.routes.js';
import managementRouter from './admin.management.routes.js';

const router: Router = Router();

router.post(
  '/auth/login',
  authLimiter(),
  validateBody(adminLoginSchema),
  login
);

router.get('/auth/me', requireAdmin, me);

router.use(managementRouter);

router.use(catalogueAdminRouter);
router.use('/products', productsAdminRouter);
router.use(ordersAdminRouter);
router.use('/inventory', inventoryRouter);
router.use('/coupons', couponsAdminRouter);
router.use('/notifications', notificationsAdminRouter);
router.use('/addons', addonsAdminRouter);

export default router;