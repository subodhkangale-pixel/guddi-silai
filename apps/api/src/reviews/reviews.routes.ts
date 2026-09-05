import { Router } from 'express';

import * as reviewsController from './reviews.controller.js';
import { createReviewSchema, moderateReviewSchema } from './reviews.schemas.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin, authorize } from '../middleware/adminAuth.js';
import { validateBody } from '../middleware/validate.js';

const router: Router = Router();
router.get('/products/:productId/reviews', reviewsController.listApproved);
router.post('/reviews', requireAuth, validateBody(createReviewSchema), reviewsController.createReview);
router.get('/admin/reviews', requireAdmin, authorize('product:write'), reviewsController.listForAdmin);
router.patch('/admin/reviews/:id', requireAdmin, authorize('product:write'), validateBody(moderateReviewSchema), reviewsController.moderate);

export default router;
