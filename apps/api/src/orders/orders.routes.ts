import { Router } from 'express';

import * as ordersController from './orders.controller.js';
import { createOrderSchema } from './orders.schemas.js';
import { requireIdentity } from '../middleware/identity.js';
import { validateBody } from '../middleware/validate.js';

const router: Router = Router();
router.use(requireIdentity);
router.post('/', validateBody(createOrderSchema), ordersController.createOrder);
router.get('/', ordersController.listOrders);
router.get('/:orderNumber', ordersController.getOrder);

export default router;
