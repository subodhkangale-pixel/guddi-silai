import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back to Guddi Silai.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">Email
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" autoComplete="email" />
          </label>
          <label className="block text-sm font-medium text-gray-700">Password
            <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" autoComplete="current-password" />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button disabled={isSubmitting} className="w-full rounded-md bg-pink-600 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-700 disabled:bg-gray-300">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <GoogleSignInButton />
        <p className="mt-6 text-center text-sm text-gray-600">New to Guddi Silai? <Link to="/register" className="font-semibold text-pink-600">Create an account</Link></p>
        <p className="mt-3 text-center text-sm text-gray-600">Or <Link to="/" className="font-semibold text-pink-600">continue as a guest</Link></p>
      </div>
    </div>
  );
}

export default LoginPage;