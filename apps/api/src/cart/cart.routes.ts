import { Router } from 'express';

import * as cartController from './cart.controller.js';
import { cartItemSchema, updateCartItemSchema } from './cart.schemas.js';
import { measurementSchema } from './measurement.schemas.js';
import { requireIdentity } from '../middleware/identity.js';
import { validateBody } from '../middleware/validate.js';

const router: Router = Router();

router.use(requireIdentity);
router.get('/', cartController.getCart);
router.post('/items', validateBody(cartItemSchema), cartController.addItem);
router.patch('/items/:index', validateBody(updateCartItemSchema), cartController.updateItem);
router.post('/items/:index/measurements', validateBody(measurementSchema), cartController.updateMeasurements);
router.delete('/items/:index', cartController.removeItem);
router.delete('/', cartController.clearCart);

export default router;
