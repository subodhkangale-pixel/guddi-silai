export interface JwtPayload {
  sub: string;
  type: 'user';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string | null;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  avatar: string | null;
  createdAt: Date;
}

export interface AuthResult {
  token: string;
  expiresIn: number;
  user: PublicUser;
}
