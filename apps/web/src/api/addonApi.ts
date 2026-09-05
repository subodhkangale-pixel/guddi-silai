import { apiRequest } from './client';
import { apiRequestAuth } from './admin';

export interface Addon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  displayOrder: number;
  isActive: boolean;
}

export interface AdminAddonInput {
  name: string;
  description?: string;
  price: number;
  displayOrder?: number;
  isActive?: boolean;
}

export async function getAddons() {
  return apiRequest<{ data: Addon[] }>('/addons');
}

export async function adminListAddons() {
  return apiRequestAuth<{ data: Addon[] }>('/admin/addons');
}

export async function adminCreateAddon(input: AdminAddonInput) {
  return apiRequestAuth<{ data: Addon }>('/admin/addons', { method: 'POST', body: input });
}

export async function adminUpdateAddon(id: string, input: Partial<AdminAddonInput>) {
  return apiRequestAuth<{ data: Addon }>(`/admin/addons/${id}`, { method: 'PATCH', body: input });
}

export async function adminRemoveAddon(id: string) {
  return apiRequestAuth<{ data: Addon }>(`/admin/addons/${id}`, { method: 'DELETE' });
}