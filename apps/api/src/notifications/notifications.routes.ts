import { Router } from 'express';

import * as notificationsController from './notifications.controller.js';
import { requireIdentity } from '../middleware/identity.js';

const router: Router = Router();
router.use(requireIdentity);
router.get('/', notificationsController.list);
router.patch('/:id/read', notificationsController.markRead);
export default router;
