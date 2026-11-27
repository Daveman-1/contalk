'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConTalkLogo from '@/components/ConTalkLogo';
import { CaptchaWidget, setSafetyVerified } from '@/components/VerificationModal';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaVerified = Boolean(captchaToken);

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

    if (!ageConfirmed) {
      setError('You must confirm that you are at least 18 years old to join.');
      return;
    }

    if (!consentConfirmed) {
      setError('You must consent to the Community Guidelines.');
      return;
    }

    if (!captchaVerified) {
      setError('Please complete the "Are you human?" verification check.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          captchaToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
      } else {
        localStorage.setItem('ct_token', data.token);
        localStorage.setItem('ct_user', JSON.stringify(data.user));
        setSafetyVerified();
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

        <div className="surface-card rounded-2xl p-6 sm:p-8">
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

            {/* 1. Age (18+) */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none text-xs transition-colors" style={{ background: ageConfirmed ? 'var(--bg-active)' : 'var(--bg-elevated)', borderColor: ageConfirmed ? 'var(--brand-primary)' : 'var(--border-subtle)' }}>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
              <span style={{ color: 'var(--text-secondary)' }}>
                I confirm that I am at least <strong style={{ color: 'var(--text-primary)' }}>18 years of age</strong>.
              </span>
            </label>

            {/* 2. Consent */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none text-xs transition-colors" style={{ background: consentConfirmed ? 'var(--bg-active)' : 'var(--bg-elevated)', borderColor: consentConfirmed ? 'var(--brand-primary)' : 'var(--border-subtle)' }}>
              <input
                type="checkbox"
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
              <span style={{ color: 'var(--text-secondary)' }}>
                I agree to the{' '}
                <Link
                  href="/guidelines"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="underline font-semibold"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Community Guidelines &amp; Terms
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="underline font-semibold"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Privacy Policy
                </Link>{' '}
                (no harassment, hate speech, or recording).
              </span>
            </label>

            {/* 3. Captcha — Are you human? */}
            <CaptchaWidget
              verified={captchaVerified}
              onVerified={(tok) => setCaptchaToken(typeof tok === 'string' ? tok : '')}
              compact={true}
            />

            {error && (
              <div className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" className="btn-cta w-full py-3 text-sm mt-2 shadow-lg disabled:opacity-45" disabled={loading || !ageConfirmed || !consentConfirmed || !captchaVerified}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--accent-purple)' }}>
              Sign in
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t text-center space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <Link href="/" className="block text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
              ← Continue anonymously on Home
            </Link>
            <div className="flex items-center justify-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <Link href="/guidelines" className="hover:underline">Guidelines &amp; Terms</Link>
              <span>·</span>
              <Link href="/privacy" className="hover:underline">Privacy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
