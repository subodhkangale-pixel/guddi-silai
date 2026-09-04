import { AuthenticatedUser } from '../auth/auth.types.js';
import { AdminPermission } from '@guddi-silai/shared';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      admin?: {
        id: string;
        name: string;
        email: string;
        roleIds: string[];
        permissions: AdminPermission[];
      };
    }
  }
}

export {};