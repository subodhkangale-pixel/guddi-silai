import { Request, Response, NextFunction } from 'express';

import * as authService from './auth.service.js';
import { AppError } from '../middleware/errorHandler.js';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authentication required');
    const user = await authService.getCurrentUser(userId);
    res.json({ data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  _req: Request,
  res: Response
): Promise<void> {
  res.json({ data: { message: 'Logged out' } });
}
