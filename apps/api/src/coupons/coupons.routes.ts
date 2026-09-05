import { Router } from 'express';

import * as couponsController from './coupons.controller.js';
import { applyCouponSchema } from './coupons.schemas.js';
import { requireIdentity } from '../middleware/identity.js';
import { validateBody } from '../middleware/validate.js';

const router: Router = Router();
router.use(requireIdentity);
router.post('/apply', validateBody(applyCouponSchema), couponsController.apply);
router.delete('/', couponsController.remove);
export default router;
