import { Request, Response, NextFunction } from 'express';

import { AdminPermission, WILDCARD_PERMISSION } from '@guddi-silai/shared';

import { verifyToken } from '../auth/auth.utils.js';
import { JwtPayload } from '../auth/auth.types.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from './errorHandler.js';
import { extractBearerToken } from './auth.js';
import { resolveAdmin } from '../admin/admin.service.js';

export async function requireAdmin(
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

    if (payload.type !== 'admin' || !payload.sub) {
      throw new AppError(401, 'Authentication required');
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });
    if (!admin || admin.isActive === false) {
      throw new AppError(401, 'Authentication required');
    }

    const resolved = await resolveAdmin(admin.id);
    req.admin = {
      id: resolved.id,
      name: resolved.name,
      email: resolved.email,
      roleIds: resolved.roleIds,
      permissions: resolved.permissions,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(
  ...required: AdminPermission[]
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const permissions = req.admin?.permissions ?? [];
    const isSuperAdmin = (permissions as string[]).includes(WILDCARD_PERMISSION);
    const allowed = isSuperAdmin || required.every((perm) => permissions.includes(perm));

    if (!allowed) {
      return next(new AppError(403, 'Insufficient permissions'));
    }
    return next();
  };
}

interface LogAdminActivityOptions {
  action: string;
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
}

export async function logAdminActivity(
  adminId: string,
  req: Request,
  options: LogAdminActivityOptions
): Promise<void> {
  await prisma.adminActivityLog.create({
    data: {
      adminUserId: adminId,
      action: options.action,
      targetType: options.targetType,
      targetId: options.targetId,
      before: options.before ?? undefined,
      after: options.after ?? undefined,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
}