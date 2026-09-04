import { describe, expect, it } from 'vitest';

import { JwtPayload } from '../src/auth/auth.types.js';
import {
  comparePassword,
  hashPassword,
  parseExpiresIn,
  signToken,
  verifyToken,
} from '../src/auth/auth.utils.js';

describe('password hashing', () => {
  it('produces a non-plaintext hash', async () => {
    const hash = await hashPassword('password-123');
    expect(hash).not.toContain('password-123');
    expect(hash).not.toBe('password-123');
  });

  it('produces different hashes for different passwords', async () => {
    const h1 = await hashPassword('correct-horse');
    const h2 = await hashPassword('battery-staple');
    expect(h1).not.toBe(h2);
  });

  it('verifies a matching password', async () => {
    const hash = await hashPassword('matching-pass');
    expect(await comparePassword('matching-pass', hash)).toBe(true);
  });

  it('rejects a non-matching password', async () => {
    const hash = await hashPassword('matching-pass');
    expect(await comparePassword('different-pass', hash)).toBe(false);
  });
});

describe('JWT creation and verification', () => {
  it('round-trips a signed token', () => {
    const payload: JwtPayload = { sub: 'unit-user-id', type: 'user' };
    const token = signToken(payload);
    expect(token).toBeTruthy();

    const decoded = verifyToken(token);
    expect(decoded.sub).toBe('unit-user-id');
    expect(decoded.type).toBe('user');
  });

  it('rejects an invalid token', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });
});

describe('parseExpiresIn', () => {
  it('parses day units', () => {
    expect(parseExpiresIn('7d')).toBe(7 * 86400);
  });

  it('parses hour units', () => {
    expect(parseExpiresIn('5h')).toBe(5 * 3600);
  });

  it('falls back to the default when the format is unknown', () => {
    expect(parseExpiresIn('bogus')).toBe(7 * 86400);
  });
});
