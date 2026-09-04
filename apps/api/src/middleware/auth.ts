import { Request, Response, NextFunction } from 'express';

import { verifyToken } from '../auth/auth.utils.js';
import { JwtPayload } from '../auth/auth.types.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from './errorHandler.js';

const BEARER_PREFIX = 'Bearer ';

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER_PREFIX)) return null;
  const token = header.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) throw new AppError(401, 'Authentication required');

    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError(401, 'Authentication required');
    }

    if (payload.type !== 'user' || !payload.sub) {
      throw new AppError(401, 'Authentication required');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isActive === false || user.isGuest) {
      throw new AppError(401, 'Authentication required');
    }

    req.user = { id: user.id, name: user.name, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
}
