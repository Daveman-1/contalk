'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';
import GoogleRecaptcha from '@/components/GoogleRecaptcha';

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
  return (
    <div
      className={`rounded-xl border transition-all select-none flex flex-col items-center justify-center ${
        compact ? 'p-2' : 'p-3'
      }`}
      style={{
        background: 'var(--bg-elevated)',
        borderColor: verified ? '#2EE6C5' : 'var(--border-subtle)',
      }}
    >
      <GoogleRecaptcha
        onVerify={(token) => {
          if (onVerified) onVerified(Boolean(token));
        }}
        onExpire={() => {
          if (onVerified) onVerified(false);
        }}
      />
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
      setErrorMsg('Please complete all 3 requirements (Age, Consent, and reCAPTCHA).');
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
              Confirm your age, consent, and Google reCAPTCHA before entering.
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

          {/* 3. Google reCAPTCHA v2 Checkbox */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                3. Security Check: Are you human?
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-300">
                Required
              </span>
            </div>

            <div
              className="p-3 rounded-xl border flex flex-col items-center justify-center transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: captchaVerified ? '#2EE6C5' : 'var(--border-subtle)',
              }}
            >
              <GoogleRecaptcha
                onVerify={(token) => {
                  setCaptchaVerified(Boolean(token));
                  setErrorMsg('');
                }}
                onExpire={() => {
                  setCaptchaVerified(false);
                }}
              />
            </div>
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
