export type TokenType = 'user' | 'guest';

export interface JwtPayload {
  sub: string;
  type: TokenType;
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

export interface GuestResult {
  token: string;
  expiresIn: number;
  guest: {
    id: string;
    name: string;
  };
}

export interface GoogleProfile {
  googleId: string;
  email: string | null;
  emailVerified: boolean;
  name: string;
  picture: string | null;
}
