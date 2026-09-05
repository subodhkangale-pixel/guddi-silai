import { Router } from 'express';

import * as deliveryController from './delivery.controller.js';

const router: Router = Router();

router.get('/pincode/:pincode', deliveryController.checkPincode);
router.get('/pincode/:pincode/shipping', deliveryController.estimateShipping);

export default router;