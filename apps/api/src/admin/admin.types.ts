import { AdminPermission, AdminRoleName } from '@guddi-silai/shared';

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  permissions: AdminPermission[];
}

export interface AdminAuthResult {
  token: string;
  expiresIn: number;
  admin: AdminSessionUser;
}

export interface ResolvedAdmin extends AdminSessionUser {
  roleNames: AdminRoleName[];
}