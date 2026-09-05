import { Router } from 'express';

import * as catalogueController from './catalogue.controller.js';
import { requireAdmin, authorize } from '../middleware/adminAuth.js';
import { validateBody } from '../middleware/validate.js';
import {
  categorySchema,
  categoryUpdateSchema,
  subCategorySchema,
  subCategoryUpdateSchema,
  colorSchema,
  colorUpdateSchema,
  sizeSchema,
  sizeUpdateSchema,
  fiberSchema,
  fiberUpdateSchema,
  embroiderySchema,
  embroideryUpdateSchema,
} from './catalogue.schemas.js';

const router: Router = Router();

const catalogueWrite = authorize('catalogue:write');
const catalogueRead = authorize('catalogue:read');

// Categories
router.get(
  '/categories',
  requireAdmin,
  catalogueRead,
  catalogueController.adminListCategories
);
router.post(
  '/categories',
  requireAdmin,
  catalogueWrite,
  validateBody(categorySchema),
  catalogueController.createCategory
);
router.patch(
  '/categories/:id',
  requireAdmin,
  catalogueWrite,
  validateBody(categoryUpdateSchema),
  catalogueController.updateCategory
);
router.delete(
  '/categories/:id',
  requireAdmin,
  catalogueWrite,
  catalogueController.deleteCategory
);

// Sub-categories
router.get(
  '/subcategories',
  requireAdmin,
  catalogueRead,
  catalogueController.adminListSubCategories
);
router.post(
  '/subcategories',
  requireAdmin,
  catalogueWrite,
  validateBody(subCategorySchema),
  catalogueController.createSubCategory
);
router.patch(
  '/subcategories/:id',
  requireAdmin,
  catalogueWrite,
  validateBody(subCategoryUpdateSchema),
  catalogueController.updateSubCategory
);
router.delete(
  '/subcategories/:id',
  requireAdmin,
  catalogueWrite,
  catalogueController.deleteSubCategory
);

// Colors
router.get('/colors', requireAdmin, catalogueRead, catalogueController.adminListColors);
router.post(
  '/colors',
  requireAdmin,
  catalogueWrite,
  validateBody(colorSchema),
  catalogueController.createColor
);
router.patch(
  '/colors/:id',
  requireAdmin,
  catalogueWrite,
  validateBody(colorUpdateSchema),
  catalogueController.updateColor
);
router.delete('/colors/:id', requireAdmin, catalogueWrite, catalogueController.deleteColor);

// Sizes
router.get('/sizes', requireAdmin, catalogueRead, catalogueController.adminListSizes);
router.post(
  '/sizes',
  requireAdmin,
  catalogueWrite,
  validateBody(sizeSchema),
  catalogueController.createSize
);
router.patch(
  '/sizes/:id',
  requireAdmin,
  catalogueWrite,
  validateBody(sizeUpdateSchema),
  catalogueController.updateSize
);
router.delete('/sizes/:id', requireAdmin, catalogueWrite, catalogueController.deleteSize);

// Fibers
router.get('/fibers', requireAdmin, catalogueRead, catalogueController.adminListFibers);
router.post(
  '/fibers',
  requireAdmin,
  catalogueWrite,
  validateBody(fiberSchema),
  catalogueController.createFiber
);
router.patch(
  '/fibers/:id',
  requireAdmin,
  catalogueWrite,
  validateBody(fiberUpdateSchema),
  catalogueController.updateFiber
);
router.delete('/fibers/:id', requireAdmin, catalogueWrite, catalogueController.deleteFiber);

// Embroidery
router.get(
  '/embroidery',
  requireAdmin,
  catalogueRead,
  catalogueController.adminListEmbroideries
);
router.post(
  '/embroidery',
  requireAdmin,
  catalogueWrite,
  validateBody(embroiderySchema),
  catalogueController.createEmbroidery
);
router.patch(
  '/embroidery/:id',
  requireAdmin,
  catalogueWrite,
  validateBody(embroideryUpdateSchema),
  catalogueController.updateEmbroidery
);
router.delete(
  '/embroidery/:id',
  requireAdmin,
  catalogueWrite,
  catalogueController.deleteEmbroidery
);

export default router;