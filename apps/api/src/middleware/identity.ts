import { NextFunction, Request, Response } from 'express';

import { verifyToken } from '../auth/auth.utils.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from './errorHandler.js';
import { extractBearerToken } from './auth.js';

export async function requireIdentity(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) throw new AppError(401, 'Guest or user session required');

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError(401, 'Guest or user session required');
    }

    if ((payload.type !== 'guest' && payload.type !== 'user') || !payload.sub) {
      throw new AppError(401, 'Guest or user session required');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isActive === false || (payload.type === 'guest') !== user.isGuest) {
      throw new AppError(401, 'Guest or user session required');
    }

    req.identity = { id: user.id, type: payload.type };
    next();
  } catch (error) {
    next(error);
  }
}