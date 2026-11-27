'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConTalkLogo from '@/components/ConTalkLogo';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotHelp, setShowForgotHelp] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('ct_token')) {
      router.push('/browse');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
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
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Sign In</h2>

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
                autoComplete="username"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotHelp((v) => !v)}
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--accent-purple)' }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                className="themed-input py-3 px-4 text-sm"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
              {showForgotHelp && (
                <div
                  className="mt-2 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed border"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Password reset isn&apos;t available yet because ConTalk accounts don&apos;t store an email address. You can continue anonymously on{' '}
                  <Link href="/" className="underline font-medium" style={{ color: 'var(--brand-primary)' }}>
                    Home
                  </Link>{' '}
                  or{' '}
                  <Link href="/signup" className="underline font-medium" style={{ color: 'var(--brand-primary)' }}>
                    create a new account
                  </Link>.
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" className="btn-cta w-full py-3 text-sm mt-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold hover:underline" style={{ color: 'var(--accent-purple)' }}>
              Create one
            </Link>
          </p>

          <footer className="mt-4 pt-4 border-t text-center space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <Link href="/" className="block text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
              ← Continue anonymously on Home
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]" style={{ color: 'var(--text-muted)' }} aria-label="Legal and safety links">
              <Link href="/terms" className="hover:underline">Terms</Link>
              <span>·</span>
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              <span>·</span>
              <Link href="/guidelines" className="hover:underline">Community Guidelines</Link>
              <span>·</span>
              <Link href="/guidelines#safety" className="hover:underline">Report a problem</Link>
            </nav>
          </footer>
        </div>
      </div>
    </div>
  );
}
