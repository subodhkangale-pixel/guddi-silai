import { Router } from 'express';

import * as wishlistController from './wishlist.controller.js';
import { wishlistItemSchema } from './wishlist.schemas.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router: Router = Router();
router.use(requireAuth);
router.get('/', wishlistController.getWishlist);
router.post('/', validateBody(wishlistItemSchema), wishlistController.addItem);
router.delete('/:productId', wishlistController.removeItem);
export default router;