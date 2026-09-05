import { Router } from 'express';

import * as couponsController from './coupons.controller.js';
import { couponSchema } from './coupons.schemas.js';
import { requireAdmin, authorize } from '../middleware/adminAuth.js';
import { validateBody } from '../middleware/validate.js';

const router: Router = Router();
router.use(requireAdmin, authorize('coupon:write'));
router.get('/', couponsController.adminList);
router.post('/', validateBody(couponSchema), couponsController.adminCreate);
router.patch('/:id', validateBody(couponSchema.partial()), couponsController.adminUpdate);
router.delete('/:id', couponsController.adminRemove);
export default router;