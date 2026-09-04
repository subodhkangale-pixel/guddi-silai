import { Request, Response, NextFunction } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { signToken } from '../src/auth/auth.utils.js';
import { prisma } from '../src/lib/prisma.js';
import { AppError } from '../src/middleware/errorHandler.js';
import { extractBearerToken, requireAuth } from '../src/middleware/auth.js';

const mockFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;

function makeRequest(header?: string): Request {
  return {
    headers: header ? { authorization: header } : {},
  } as unknown as Request;
}

function makeResponse(): Response {
  return {} as Response;
}

function makeNext() {
  return vi.fn() as unknown as NextFunction;
}

describe('extractBearerToken', () => {
  it('returns the token when the header is well-formed', () => {
    const req = makeRequest('Bearer abc123');
    expect(extractBearerToken(req)).toBe('abc123');
  });

  it('returns null when there is no authorization header', () => {
    expect(extractBearerToken(makeRequest())).toBeNull();
  });

  it('returns null for a non-bearer scheme', () => {
    expect(extractBearerToken(makeRequest('Basic abc123'))).toBeNull();
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it('attaches the authenticated user for a valid token', async () => {
    const token = signToken({ sub: 'user-1', type: 'user' });
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Anita',
      email: 'anita@example.com',
      isActive: true,
      isGuest: false,
    });

    const req = makeRequest(`Bearer ${token}`);
    const next = makeNext();

    await requireAuth(req, makeResponse(), next);

    expect(req.user).toEqual({
      id: 'user-1',
      name: 'Anita',
      email: 'anita@example.com',
    });
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a missing token', async () => {
    const req = makeRequest();
    const next = makeNext();

    await requireAuth(req, makeResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('rejects an invalid token', async () => {
    const req = makeRequest('Bearer not-a-valid-token');
    const next = makeNext();

    await requireAuth(req, makeResponse(), next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('rejects an unknown user', async () => {
    const token = signToken({ sub: 'ghost', type: 'user' });
    mockFindUnique.mockResolvedValue(null);
    const next = makeNext();

    await requireAuth(makeRequest(`Bearer ${token}`), makeResponse(), next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Authentication required');
  });

  it('rejects an inactive or guest user', async () => {
    const token = signToken({ sub: 'user-2', type: 'user' });
    mockFindUnique.mockResolvedValue({
      id: 'user-2',
      name: 'Guest',
      email: null,
      isActive: true,
      isGuest: true,
    });
    const next = makeNext();

    await requireAuth(makeRequest(`Bearer ${token}`), makeResponse(), next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });
});
