import { Router } from 'express';

import {
  createGuest,
  googleAuth,
  login,
  logout,
  merge,
  me,
  register,
} from './auth.controller.js';
import {
  googleSchema,
  loginSchema,
  mergeSchema,
  registerSchema,
} from './auth.schemas.js';
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

router.post('/guest', authLimiter(), createGuest);

router.post('/google', authLimiter(), validateBody(googleSchema), googleAuth);

router.post('/merge', requireAuth, validateBody(mergeSchema), merge);

router.get('/me', requireAuth, me);

router.post('/logout', requireAuth, logout);

export default router;
