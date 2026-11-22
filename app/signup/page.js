'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConTalkLogo from '@/components/ConTalkLogo';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('ct_token')) {
      router.push('/browse');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
      } else {
        localStorage.setItem('ct_token', data.token);
        localStorage.setItem('ct_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth_change'));
        router.push('/browse');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-canvas min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <ConTalkLogo variant="full" size={160} showTagline={true} />
          </Link>
        </div>

        <div className="surface-card rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Create Account</h2>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
            Use your username across Messages, Chat Rooms, Random Chat &amp; Posts
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Username</label>
              <input
                type="text"
                className="themed-input py-3 px-4 text-sm"
                placeholder="your_username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
                minLength={3}
                maxLength={20}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password"
                className="themed-input py-3 px-4 text-sm"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
              <input
                type="password"
                className="themed-input py-3 px-4 text-sm"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" className="btn-cta w-full py-3 text-sm mt-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--accent-purple)' }}>
              Sign in
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t text-center" style={{ borderColor: 'var(--border-subtle)' }}>
            <Link href="/" className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
              ← Continue anonymously on Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
