import { Router } from 'express';

import * as offersController from './offers.controller.js';
import { offerSchema } from './offers.schemas.js';
import { requireAdmin, authorize } from '../middleware/adminAuth.js';
import { validateBody } from '../middleware/validate.js';

const router: Router = Router();
router.get('/', offersController.listActive);
router.get('/admin', requireAdmin, authorize('offer:write'), offersController.adminList);
router.post('/admin', requireAdmin, authorize('offer:write'), validateBody(offerSchema), offersController.adminCreate);
router.delete('/admin/:id', requireAdmin, authorize('offer:write'), offersController.adminDeactivate);
export default router;