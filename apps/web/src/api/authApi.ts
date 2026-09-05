import { apiRequest } from './client';

const AUTH_TOKEN_KEY = 'guddi-silai-token';
const GUEST_TOKEN_KEY = 'guddi-silai-guest-token';

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  avatar: string | null;
  isGuest: boolean;
}

export interface AuthResult {
  token: string;
  expiresIn: number;
  user: AuthUser;
}

export function getAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getGuestToken(): string | null {
  return window.localStorage.getItem(GUEST_TOKEN_KEY);
}

export function setGuestToken(token: string): void {
  window.localStorage.setItem(GUEST_TOKEN_KEY, token);
}

export function clearGuestToken(): void {
  window.localStorage.removeItem(GUEST_TOKEN_KEY);
}

export async function ensureGuestToken(): Promise<string> {
  const saved = getGuestToken();
  if (saved) return saved;
  const result = await apiRequest<{ data: { token: string } }>('/auth/guest', {
    method: 'POST',
  });
  setGuestToken(result.data.token);
  return result.data.token;
}

export async function resolveIdentityToken(): Promise<string> {
  const userToken = getAuthToken();
  if (userToken) return userToken;
  return ensureGuestToken();
}

export async function register(input: { name: string; email: string; password: string }) {
  return apiRequest<{ data: AuthResult }>('/auth/register', {
    method: 'POST',
    body: input,
  });
}

export async function login(input: { email: string; password: string }) {
  return apiRequest<{ data: AuthResult }>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export async function googleLogin(idToken: string) {
  return apiRequest<{ data: AuthResult }>('/auth/google', {
    method: 'POST',
    body: { idToken },
  });
}

export async function getMe(token: string) {
  return apiRequest<{ data: { user: AuthUser } }>('/auth/me', { token });
}

export async function logout(token: string) {
  return apiRequest<{ data: { message: string } }>('/auth/logout', {
    method: 'POST',
    token,
  });
}

export async function mergeGuestCart(guestToken: string, token: string) {
  return apiRequest<{ data: { merged: boolean; itemsMerged: number } }>('/auth/merge', {
    method: 'POST',
    token,
    body: { guestToken },
  });
}