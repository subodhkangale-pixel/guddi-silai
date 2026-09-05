import { apiRequest } from './client';
import { AdminLoginResult } from './types';
import { Order } from './orderApi';

const TOKEN_KEY = 'guddi_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function loginAsAdmin(email: string, password: string) {
  const result = await apiRequest<{ data: AdminLoginResult }>('/admin/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setAdminToken(result.data.token);
  return result.data;
}

export async function getAdminMe(token: string) {
  return apiRequest<{ data: { id: string; name: string; permissions: string[] } }>(
    '/admin/auth/me',
    { token }
  );
}

export async function apiRequestAuth<T>(
  path: string,
  options: Parameters<typeof apiRequest>[1] = {}
): Promise<T> {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Admin authentication required');
  }
  return apiRequest<T>(path, { ...options, token });
}

export async function adminListOrders(status?: string) {
  return apiRequestAuth<{ data: Order[] }>('/admin/orders', { query: { status } });
}

export async function adminGetOrder(id: string) {
  return apiRequestAuth<{ data: Order }>(`/admin/orders/${id}`);
}

export async function adminUpdateOrderStatus(id: string, status: string) {
  return apiRequestAuth<{ data: Order }>(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}