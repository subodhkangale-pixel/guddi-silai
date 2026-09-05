import { Router } from 'express';

import * as productsController from './products.controller.js';
import { requireAdmin, authorize } from '../middleware/adminAuth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  productSchema,
  productUpdateSchema,
  variantSchema,
  variantUpdateSchema,
  adminProductQuerySchema,
} from './products.schemas.js';

const router: Router = Router();

const productWrite = authorize('product:write');
const productRead = authorize('product:read');

router.get(
  '/',
  requireAdmin,
  productRead,
  validateQuery(adminProductQuerySchema),
  productsController.adminListProducts
);

router.post(
  '/',
  requireAdmin,
  productWrite,
  validateBody(productSchema),
  productsController.adminCreateProduct
);

router.get('/:id', requireAdmin, productRead, productsController.adminGetProduct);

router.patch(
  '/:id',
  requireAdmin,
  productWrite,
  validateBody(productUpdateSchema),
  productsController.adminUpdateProduct
);

router.delete(
  '/:id',
  requireAdmin,
  productWrite,
  productsController.adminDeleteProduct
);

router.post(
  '/:id/variants',
  requireAdmin,
  productWrite,
  validateBody(variantSchema),
  productsController.adminAddVariant
);

router.patch(
  '/variants/:id',
  requireAdmin,
  productWrite,
  validateBody(variantUpdateSchema),
  productsController.adminUpdateVariant
);

router.delete(
  '/variants/:id',
  requireAdmin,
  productWrite,
  productsController.adminDeleteVariant
);

export default router;