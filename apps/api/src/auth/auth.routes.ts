import { Router } from 'express';

import { login, logout, me, register } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';

const router: Router = Router();

router.post(
  '/register',
  authLimiter(),
  validateBody(registerSchema),
  register
);

router.post('/login', authLimiter(), validateBody(loginSchema), login);

router.get('/me', requireAuth, me);

router.post('/logout', requireAuth, logout);

export default router;
