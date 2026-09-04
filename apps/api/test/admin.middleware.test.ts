import { Request, Response, NextFunction } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    adminUser: { findUnique: vi.fn() },
    adminRole: { findMany: vi.fn() },
    permission: { findMany: vi.fn() },
    adminActivityLog: { create: vi.fn() },
  },
}));

import { signToken } from '../src/auth/auth.utils.js';
import { signAdminToken } from '../src/auth/auth.utils.js';
import { prisma } from '../src/lib/prisma.js';
import { AppError } from '../src/middleware/errorHandler.js';
import { authorize, requireAdmin } from '../src/middleware/adminAuth.js';

import type { AdminPermission } from '@guddi-silai/shared';

const mockAdminFindUnique = prisma.adminUser.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockRoleFindMany = prisma.adminRole.findMany as unknown as ReturnType<typeof vi.fn>;
const mockPermissionFindMany = prisma.permission.findMany as unknown as ReturnType<typeof vi.fn>;

const superAdminRecord = {
  id: 'admin-1',
  name: 'Deepak',
  email: 'deepak@guddisilai.in',
  roleIds: ['role-super'],
  isActive: true,
};

const roleRecords = [
  { id: 'role-super', name: 'SUPER_ADMIN', permissionIds: [] },
];

function makeRequest(auth?: string): Request {
  return {
    headers: auth ? { authorization: `Bearer ${auth}` } : {},
  } as unknown as Request;
}

function makeResponse(): Response {
  return {} as Response;
}

function makeNext() {
  return vi.fn() as unknown as NextFunction;
}

function mockSuperAdminResolution() {
  mockAdminFindUnique.mockResolvedValue(superAdminRecord);
  mockRoleFindMany.mockResolvedValue(roleRecords);
  mockPermissionFindMany.mockResolvedValue([]);
}

describe('requireAdmin', () => {
  beforeEach(() => {
    mockAdminFindUnique.mockReset();
    mockRoleFindMany.mockReset();
    mockPermissionFindMany.mockReset();
  });

  it('attaches the resolved admin for a valid admin token', async () => {
    mockSuperAdminResolution();
    const token = signAdminToken('admin-1');
    const req = makeRequest(token);
    const next = makeNext();

    await requireAdmin(req, makeResponse(), next);

    expect(req.admin?.id).toBe('admin-1');
    expect(req.admin?.permissions).toContain('reports:view');
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a missing token', async () => {
    const req = makeRequest();
    const next = makeNext();

    await requireAdmin(req, makeResponse(), next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const req = makeRequest('not-a-valid-token');
    const next = makeNext();

    await requireAdmin(req, makeResponse(), next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
    expect(mockAdminFindUnique).not.toHaveBeenCalled();
  });

  it('rejects a non-admin token type', async () => {
    const token = signToken({ sub: 'user-1', type: 'user' });
    const req = makeRequest(token);
    const next = makeNext();

    await requireAdmin(req, makeResponse(), next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
    expect(mockAdminFindUnique).not.toHaveBeenCalled();
  });

  it('rejects an inactive admin', async () => {
    mockAdminFindUnique.mockResolvedValue({ ...superAdminRecord, isActive: false });
    const token = signAdminToken('admin-1');
    const req = makeRequest(token);
    const next = makeNext();

    await requireAdmin(req, makeResponse(), next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });
});

describe('authorize', () => {
  const baseReq = {
    admin: {
      id: 'admin-1',
      name: 'Deepak',
      email: 'deepak@guddisilai.in',
      roleIds: ['role-super'],
      permissions: ['reports:view'] as AdminPermission[],
    },
  } as unknown as Request;

  beforeEach(() => {
    mockPermissionFindMany.mockReset();
  });

  it('passes when the admin holds the required permission', () => {
    const next = makeNext();
    authorize('reports:view')(baseReq, makeResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects when the admin lacks the required permission', () => {
    const next = makeNext();
    authorize('admin:manage')(baseReq, makeResponse(), next);
    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Insufficient permissions');
  });

  it('requires all listed permissions when multiple are given', () => {
    const next = makeNext();
    authorize('reports:view', 'order:read')(baseReq, makeResponse(), next);
    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(403);
  });

  it('honors a wildcard permission set', () => {
    const wildcardReq = {
      admin: { permissions: ['*'] as AdminPermission[] },
    } as unknown as Request;
    const next = makeNext();
    authorize('admin:manage')(wildcardReq, makeResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });
});