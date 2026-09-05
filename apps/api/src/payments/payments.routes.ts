import { Router } from 'express';

import * as paymentsController from './payments.controller.js';
import { createPaymentSchema, verifyPaymentSchema } from './payments.schemas.js';
import { requireIdentity } from '../middleware/identity.js';
import { validateBody } from '../middleware/validate.js';

const router: Router = Router();
router.post('/webhook', paymentsController.webhook);
router.use(requireIdentity);
router.post('/create', validateBody(createPaymentSchema), paymentsController.createPayment);
router.post('/verify', validateBody(verifyPaymentSchema), paymentsController.verifyPayment);

export default router;
