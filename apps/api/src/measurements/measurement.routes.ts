import { Router } from 'express';

import * as measurementController from './measurement.controller.js';
import { measurementProfileSchema } from './measurement.schemas.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router: Router = Router();

router.get('/fields', measurementController.listFields);

router.get('/my-profile', requireAuth, measurementController.getMyProfile);
router.put('/my-profile', requireAuth, validateBody(measurementProfileSchema), measurementController.saveMyProfile);

export default router;