import { Router } from 'express';

import * as addonsController from './addons.controller.js';
import { addonSchema } from './addons.schemas.js';
import { requireAdmin, authorize } from '../middleware/adminAuth.js';
import { validateBody } from '../middleware/validate.js';

const router: Router = Router();
router.use(requireAdmin, authorize('catalogue:write'));

router.get('/', addonsController.adminList);
router.post('/', validateBody(addonSchema), addonsController.adminCreate);
router.patch('/:id', validateBody(addonSchema.partial()), addonsController.adminUpdate);
router.delete('/:id', addonsController.adminRemove);

export default router;