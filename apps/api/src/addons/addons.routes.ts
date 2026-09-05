import { Router } from 'express';

import * as addonsController from './addons.controller.js';

const router: Router = Router();

router.get('/', addonsController.listActive);

export default router;