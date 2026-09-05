import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  AuthUser,
  clearAuthToken,
  clearGuestToken,
  getAuthToken,
  getGuestToken,
  getMe,
  googleLogin as googleLoginRequest,
  login as loginRequest,
  logout as logoutRequest,
  mergeGuestCart,
  register as registerRequest,
  setAuthToken,
} from '../api/authApi';

interface AuthContextValue {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'guest';
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_AFFECTED_KEYS = ['cart', 'orders', 'notifications', 'fiber-availability'];

async function adoptIdentity(token: string): Promise<AuthUser> {
  const me = await getMe(token);
  const guestToken = getGuestToken();
  if (guestToken) {
    try {
      await mergeGuestCart(guestToken, token);
    } catch {
      // ignore merge failures; guest cart simply stays behind
    } finally {
      clearGuestToken();
    }
  }
  return me.data.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'guest'>('loading');

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const token = getAuthToken();
      if (!token) {
        if (!cancelled) setStatus('guest');
        return;
      }
      try {
        const me = await getMe(token);
        if (!cancelled) {
          setUser(me.data.user);
          setStatus('authenticated');
        }
      } catch {
        clearAuthToken();
        if (!cancelled) setStatus('guest');
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    const result = await loginRequest({ email, password });
    setAuthToken(result.data.token);
    const adopted = await adoptIdentity(result.data.token);
    setUser(adopted);
    setStatus('authenticated');
    invalidateCustomerQueries();
  }

  async function loginWithGoogle(idToken: string) {
    const result = await googleLoginRequest(idToken);
    setAuthToken(result.data.token);
    const adopted = await adoptIdentity(result.data.token);
    setUser(adopted);
    setStatus('authenticated');
    invalidateCustomerQueries();
  }

  async function register(input: { name: string; email: string; password: string }) {
    const result = await registerRequest(input);
    setAuthToken(result.data.token);
    const adopted = await adoptIdentity(result.data.token);
    setUser(adopted);
    setStatus('authenticated');
    invalidateCustomerQueries();
  }

  async function logout() {
    const token = getAuthToken();
    if (token) {
      try {
        await logoutRequest(token);
      } catch {
        // ignore network errors; local session always ends
      }
    }
    clearAuthToken();
    setUser(null);
    setStatus('guest');
    invalidateCustomerQueries();
  }

  function invalidateCustomerQueries() {
    for (const key of AUTH_AFFECTED_KEYS) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  }

  return (
    <AuthContext.Provider value={{ user, status, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}