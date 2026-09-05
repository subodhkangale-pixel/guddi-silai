import { Router } from 'express';

import * as productsController from './products.controller.js';
import { validateQuery } from '../middleware/validate.js';
import { productQuerySchema } from './products.schemas.js';

const router: Router = Router();

router.get('/', validateQuery(productQuerySchema), productsController.listProducts);
router.get('/:slug', productsController.getProductBySlug);

export default router;