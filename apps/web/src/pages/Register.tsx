import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      await register({ name, email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-600">Save your measurements and track orders across devices.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">Name
            <input type="text" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" autoComplete="name" />
          </label>
          <label className="block text-sm font-medium text-gray-700">Email
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" autoComplete="email" />
          </label>
          <label className="block text-sm font-medium text-gray-700">Password
            <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" autoComplete="new-password" />
            <span className="mt-1 block text-xs text-gray-500">At least 8 characters</span>
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button disabled={isSubmitting} className="w-full rounded-md bg-pink-600 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-700 disabled:bg-gray-300">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">Already have an account? <Link to="/login" className="font-semibold text-pink-600">Sign in</Link></p>
      </div>
    </div>
  );
}

export default RegisterPage;