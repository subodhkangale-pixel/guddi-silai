import { Router } from 'express';

import * as catalogueController from './catalogue.controller.js';

const router: Router = Router();

router.get('/categories', catalogueController.getCategories);
router.get('/subcategories', catalogueController.getSubCategories);
router.get('/colors', catalogueController.getColors);
router.get('/sizes', catalogueController.getSizes);
router.get('/fibers', catalogueController.getFibers);
router.get('/embroidery', catalogueController.getEmbroideries);

export default router;