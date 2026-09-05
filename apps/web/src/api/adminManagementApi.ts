import { apiRequestAuth } from './admin';

export interface AdminPermissionItem {
  id: string;
  key: string;
  name: string;
  description?: string | null;
}

export interface AdminRole {
  id: string;
  name: string;
  description?: string | null;
  permissionIds: string[];
  isSystem: boolean;
  createdAt: string;
  permissions: { id: string; key: string; name: string }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  roleNames: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AdminUserInput {
  name: string;
  email: string;
  password: string;
  roleIds: string[];
}

export interface AdminRoleInput {
  name: string;
  description?: string | null;
  permissionKeys: string[];
}

export interface ActivityLogEntry {
  id: string;
  adminUserId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  admin?: { id: string; name: string; email: string } | null;
}

export async function adminListUsers() {
  return apiRequestAuth<{ data: AdminUser[] }>('/admin/users');
}

export async function adminCreateUser(input: AdminUserInput) {
  return apiRequestAuth<{ data: AdminUser }>('/admin/users', {
    method: 'POST',
    body: input,
  });
}

export async function adminUpdateUser(id: string, input: Partial<AdminUserInput> & { isActive?: boolean }) {
  return apiRequestAuth<{ data: AdminUser }>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function adminDeleteUser(id: string) {
  return apiRequestAuth<{ data: { id: string } }>(`/admin/users/${id}`, {
    method: 'DELETE',
  });
}

export async function adminListRoles() {
  return apiRequestAuth<{ data: AdminRole[] }>('/admin/roles');
}

export async function adminCreateRole(input: AdminRoleInput) {
  return apiRequestAuth<{ data: AdminRole }>('/admin/roles', {
    method: 'POST',
    body: input,
  });
}

export async function adminUpdateRole(id: string, input: Partial<AdminRoleInput>) {
  return apiRequestAuth<{ data: AdminRole }>(`/admin/roles/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function adminDeleteRole(id: string) {
  return apiRequestAuth<{ data: { id: string } }>(`/admin/roles/${id}`, {
    method: 'DELETE',
  });
}

export async function adminListPermissions() {
  return apiRequestAuth<{ data: AdminPermissionItem[] }>('/admin/permissions');
}

export interface ActivityQuery {
  action?: string;
  adminUserId?: string;
  limit?: number;
  offset?: number;
}

export async function adminListActivity(query: ActivityQuery = {}) {
  const params: Record<string, string | number | boolean | undefined> = {};
  if (query.action) params.action = query.action;
  if (query.adminUserId) params.adminUserId = query.adminUserId;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.offset !== undefined) params.offset = query.offset;
  return apiRequestAuth<{ data: { logs: ActivityLogEntry[]; total: number } }>('/admin/activity', {
    query: params,
  });
}