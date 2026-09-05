import { Router } from 'express';

import { login, me } from './admin.controller.js';
import { adminLoginSchema } from './admin.schemas.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import catalogueAdminRouter from '../catalogue/catalogue.admin.routes.js';
import productsAdminRouter from '../products/products.admin.routes.js';

const router: Router = Router();

router.post(
  '/auth/login',
  authLimiter(),
  validateBody(adminLoginSchema),
  login
);

router.get('/auth/me', requireAdmin, me);

router.use(catalogueAdminRouter);
router.use('/products', productsAdminRouter);

export default router;