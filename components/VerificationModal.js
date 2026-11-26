'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  RefreshCw,
  AlertCircle,
  X,
  Shield,
  UserCheck,
} from 'lucide-react';

const VERIFIED_STORAGE_KEY = 'ct_safety_verified_v1';

export function isSafetyVerified() {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(VERIFIED_STORAGE_KEY);
    if (!val) return false;
    const parsed = JSON.parse(val);
    return Boolean(parsed.age && parsed.consent && parsed.captcha);
  } catch {
    return false;
  }
}

export function setSafetyVerified() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      VERIFIED_STORAGE_KEY,
      JSON.stringify({
        age: true,
        consent: true,
        captcha: true,
        timestamp: new Date().toISOString(),
      })
    );
  } catch {}
}

export function CaptchaWidget({ onVerified, verified, compact = false }) {
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [error, setError] = useState('');

  // Sample light challenge icons to ensure real human interaction
  const ICONS_SET = [
    { id: 'shield', label: 'Shield' },
    { id: 'heart', label: 'Heart' },
    { id: 'star', label: 'Star' },
    { id: 'rocket', label: 'Rocket' },
  ];

  const handleInitialClick = () => {
    if (verified || loading) return;
    setLoading(true);
    setError('');

    // Quick verification simulation
    setTimeout(() => {
      setLoading(false);
      // Give a quick micro-challenge: "Select the Shield"
      const target = ICONS_SET[0];
      // Shuffle choices
      const shuffled = [...ICONS_SET].sort(() => Math.random() - 0.5);
      setChallenge({ target, choices: shuffled });
    }, 700);
  };

  const handleSelectChoice = (choiceId) => {
    setSelectedAnswer(choiceId);
    if (challenge && choiceId === challenge.target.id) {
      setChallenge(null);
      onVerified(true);
    } else {
      setError('Incorrect. Please try again.');
      setTimeout(() => {
        setError('');
        // Reshuffle with new target
        const newTarget = ICONS_SET[Math.floor(Math.random() * ICONS_SET.length)];
        const newChoices = [...ICONS_SET].sort(() => Math.random() - 0.5);
        setChallenge({ target: newTarget, choices: newChoices });
      }, 900);
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all select-none ${
        compact ? 'p-3' : 'p-4'
      }`}
      style={{
        background: 'var(--bg-elevated)',
        borderColor: verified ? '#2EE6C5' : 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleInitialClick}
            disabled={verified || loading}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
              verified
                ? 'bg-[#2EE6C5] border-[#2EE6C5] text-[#0C0D18]'
                : 'hover:border-[var(--brand-primary)]'
            }`}
            style={{
              borderColor: verified ? '#2EE6C5' : 'var(--border-strong)',
              background: verified ? '#2EE6C5' : 'var(--bg-surface)',
            }}
            aria-label="Verify you are human"
          >
            {loading ? (
              <RefreshCw size={14} className="animate-spin text-[var(--brand-primary)]" />
            ) : verified ? (
              <CheckCircle2 size={18} strokeWidth={2.8} />
            ) : (
              <span className="w-2.5 h-2.5 rounded-sm bg-transparent" />
            )}
          </button>

          <div>
            <div className="text-xs sm:text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <span>{verified ? 'Human verified' : 'Are you human?'}</span>
              {verified && <span className="text-[#2EE6C5] text-xs">✓</span>}
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {verified ? 'Verification confirmed' : 'Click to verify you are not a bot'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end opacity-60 text-[10px] tracking-tight">
          <div className="flex items-center gap-1 font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>
            <Lock size={10} />
            <span>ConTalk Guard</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>Privacy &amp; Terms</span>
        </div>
      </div>

      {/* Mini Interactive Puzzle Challenge */}
      {challenge && !verified && (
        <div className="mt-3 pt-3 border-t animate-fadeIn" style={{ borderColor: 'var(--border-subtle)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Select the <strong className="text-[var(--brand-mint)] underline">{challenge.target.label}</strong>:
          </p>

          <div className="grid grid-cols-4 gap-2">
            {challenge.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectChoice(c.id)}
                className="py-2 rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-1 hover:border-[var(--brand-primary)] transition-all"
                style={{
                  background: selectedAnswer === c.id ? 'var(--bg-active)' : 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {c.id === 'shield' && <Shield size={16} className="text-[#2EE6C5]" />}
                {c.id === 'heart' && <span className="text-base text-rose-400">♥</span>}
                {c.id === 'star' && <span className="text-base text-amber-400">★</span>}
                {c.id === 'rocket' && <span className="text-base text-indigo-400">▲</span>}
                <span className="text-[10px]">{c.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <p className="text-[11px] text-rose-400 mt-2 flex items-center gap-1">
              <AlertCircle size={12} />
              <span>{error}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function VerificationModal({ isOpen, onClose, onComplete }) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Check if already verified
      if (isSafetyVerified()) {
        setAgeConfirmed(true);
        setConsentConfirmed(true);
        setCaptchaVerified(true);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allChecked = ageConfirmed && consentConfirmed && captchaVerified;

  const handleConfirm = () => {
    if (!allChecked) {
      setErrorMsg('Please complete all 3 requirements to continue.');
      return;
    }
    setSafetyVerified();
    onComplete?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 py-6 overflow-y-auto">
      <div className="surface-card rounded-2xl w-full max-w-lg p-6 sm:p-7 border shadow-2xl animate-fadeIn relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center card-grad-indigo text-white flex-shrink-0 shadow-lg">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Safety &amp; Verification Gate
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Confirm your age, consent, and humanity before entering.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 1. Age Verification */}
          <label
            className="flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-colors"
            style={{
              background: ageConfirmed ? 'var(--bg-active)' : 'var(--bg-elevated)',
              borderColor: ageConfirmed ? 'var(--brand-primary)' : 'var(--border-subtle)',
            }}
          >
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => {
                setAgeConfirmed(e.target.checked);
                setErrorMsg('');
              }}
              className="mt-0.5 w-4 h-4 rounded accent-indigo-500 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                <span>1. Age Confirmation (18+)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-500/20 text-amber-300">
                  Required
                </span>
              </div>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                I confirm that I am at least 18 years of age (or the age of legal majority in my jurisdiction).
              </p>
            </div>
          </label>

          {/* 2. Consent & Community Guidelines */}
          <label
            className="flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-colors"
            style={{
              background: consentConfirmed ? 'var(--bg-active)' : 'var(--bg-elevated)',
              borderColor: consentConfirmed ? 'var(--brand-primary)' : 'var(--border-subtle)',
            }}
          >
            <input
              type="checkbox"
              checked={consentConfirmed}
              onChange={(e) => {
                setConsentConfirmed(e.target.checked);
                setErrorMsg('');
              }}
              className="mt-0.5 w-4 h-4 rounded accent-indigo-500 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                <span>2. Consent &amp; Community Guidelines</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-indigo-500/20 text-indigo-300">
                  Required
                </span>
              </div>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                I agree to the Community Guidelines: no unlawful content, hate speech, harassment, non-consensual sharing, recording, or spamming.
              </p>
            </div>
          </label>

          {/* 3. Captcha — Are you human? */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                3. Bot Check: Are you human?
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-emerald-500/20 text-emerald-300">
                Required
              </span>
            </div>
            <CaptchaWidget
              verified={captchaVerified}
              onVerified={(v) => {
                setCaptchaVerified(v);
                setErrorMsg('');
              }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allChecked}
            className="btn-indigo flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <UserCheck size={16} />
            <span>I Agree &amp; Continue →</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn-soft py-3 px-5 text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
