import { Request, Response, NextFunction } from 'express';

import * as adminService from './admin.service.js';
import { AppError } from '../middleware/errorHandler.js';

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await adminService.login(req.body);
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
    const adminId = req.admin?.id;
    if (!adminId) throw new AppError(401, 'Authentication required');
    const admin = await adminService.getCurrentAdmin(adminId);
    res.json({ data: { admin } });
  } catch (err) {
    next(err);
  }
}