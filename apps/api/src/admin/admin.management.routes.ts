import { Router } from 'express';

import * as managementController from './admin.management.controller.js';
import {
  adminUserCreateSchema,
  adminUserUpdateSchema,
  roleCreateSchema,
  roleUpdateSchema,
  activityQuerySchema,
} from './admin.management.schemas.js';
import { requireAdmin, authorize } from '../middleware/adminAuth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

const router: Router = Router();
router.use(requireAdmin, authorize('admin:manage'));

router.get('/users', managementController.listUsers);
router.post('/users', validateBody(adminUserCreateSchema), managementController.createUser);
router.patch('/users/:id', validateBody(adminUserUpdateSchema), managementController.updateUser);
router.delete('/users/:id', managementController.removeUser);

router.get('/roles', managementController.listRoles);
router.post('/roles', validateBody(roleCreateSchema), managementController.createRole);
router.patch('/roles/:id', validateBody(roleUpdateSchema), managementController.updateRole);
router.delete('/roles/:id', managementController.removeRole);

router.get('/permissions', managementController.listPermissions);

router.get('/activity', validateQuery(activityQuerySchema), managementController.listActivity);

export default router;