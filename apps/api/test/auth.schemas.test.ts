import { describe, expect, it } from 'vitest';

import {
  googleSchema,
  loginSchema,
  mergeSchema,
  registerSchema,
} from '../src/auth/auth.schemas.js';

describe('registerSchema', () => {
  it('accepts a valid payload', () => {
    const result = registerSchema.safeParse({
      name: 'Anita',
      email: 'anita@example.com',
      password: 'password-123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Anita',
      email: 'not-an-email',
      password: 'password-123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a short password', () => {
    const result = registerSchema.safeParse({
      name: 'Anita',
      email: 'anita@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a short name', () => {
    const result = registerSchema.safeParse({
      name: 'A',
      email: 'anita@example.com',
      password: 'password-123',
    });
    expect(result.success).toBe(false);
  });

  it('normalizes email to lowercase', () => {
    const result = registerSchema.safeParse({
      name: 'Anita',
      email: 'ANITA@Example.COM',
      password: 'password-123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('anita@example.com');
    }
  });
});

describe('loginSchema', () => {
  it('accepts a valid payload', () => {
    const result = loginSchema.safeParse({
      email: 'anita@example.com',
      password: 'password-123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password-123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing password', () => {
    const result = loginSchema.safeParse({
      email: 'anita@example.com',
    });
    expect(result.success).toBe(false);
  });
});

describe('googleSchema', () => {
  it('accepts a Google ID token', () => {
    expect(googleSchema.safeParse({ idToken: 'header.payload.sig' }).success).toBe(
      true
    );
  });

  it('rejects a missing ID token', () => {
    expect(googleSchema.safeParse({}).success).toBe(false);
  });
});

describe('mergeSchema', () => {
  it('accepts a guest token', () => {
    expect(mergeSchema.safeParse({ guestToken: 'guest.jwt.token' }).success).toBe(
      true
    );
  });

  it('rejects a missing guest token', () => {
    expect(mergeSchema.safeParse({}).success).toBe(false);
  });
});
