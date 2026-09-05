import { Router } from 'express';

import * as analyticsController from './analytics.controller.js';
import { analyticsRangeSchema, eventSchema } from './analytics.schemas.js';
import { requireAdmin, authorize } from '../middleware/adminAuth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

const router: Router = Router();
router.post('/events', validateBody(eventSchema), analyticsController.recordEvent);
router.get('/summary', requireAdmin, authorize('reports:view'), validateQuery(analyticsRangeSchema), analyticsController.summary);
router.get('/dashboard', requireAdmin, authorize('reports:view'), validateQuery(analyticsRangeSchema), analyticsController.dashboard);

export default router;
