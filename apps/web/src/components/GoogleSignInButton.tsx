import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number; text?: string }
          ) => void;
        };
      };
    };
  }
}

function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const host = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || loading) return;
    const loadScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              setLoading(true);
              setError(null);
              try {
                await loginWithGoogle(response.credential);
                navigate('/', { replace: true });
              } catch {
                setError('Google sign in failed. Please try another method.');
              } finally {
                setLoading(false);
              }
            },
          });
          const parent = document.getElementById('guddi-google-button');
          if (parent) {
            window.google.accounts.id.renderButton(parent, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with',
            });
          }
        }
      };
      document.body.appendChild(script);
    };
    loadScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GOOGLE_CLIENT_ID]);

  if (!GOOGLE_CLIENT_ID) {
    return <p className="text-xs text-gray-400">Google sign in will appear once VITE_GOOGLE_CLIENT_ID is configured ({host}).</p>;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <div id="guddi-google-button" className="mt-4 flex justify-center" />
      {error && <p className="mt-2 text-center text-sm text-red-700">{error}</p>}
    </div>
  );
}

export default GoogleSignInButton;