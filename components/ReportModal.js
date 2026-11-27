'use client';

import { useState } from 'react';
import { Flag, ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '@/components/NotificationProvider';

const REPORT_REASONS = [
  'Harassment or abuse',
  'Spam or scam links',
  'Hate speech or slurs',
  'Underage / safety concern',
  'Inappropriate behavior',
  'Other',
];

export default function ReportModal({
  isOpen,
  onClose,
  targetId,
  targetName = 'User',
  contextType = 'user', // 'dm' | 'random' | 'room' | 'post'
  contextId = null,
  onBlocked = null,
}) {
  const { refreshBlocked } = useNotifications();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !targetId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/safety/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId,
          targetName,
          contextType,
          contextId,
          reason,
          details: details.trim(),
          alsoBlock,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not submit report.');
      } else {
        setSubmitted(true);
        if (alsoBlock) {
          await refreshBlocked();
          onBlocked?.(targetId);
        }
        setTimeout(() => {
          setSubmitted(false);
          setDetails('');
          onClose?.();
        }, 1200);
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="surface-card rounded-2xl p-5 sm:p-6 w-full max-w-md border shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/15 text-rose-400">
              <Flag size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Report {targetName}
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Help keep ConTalk safe for everyone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2 animate-fadeIn">
            <CheckCircle2 size={38} className="mx-auto text-emerald-400" />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Report received
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {alsoBlock
                ? `${targetName} has also been blocked across chats and feed.`
                : 'Thank you for helping keep ConTalk safe.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Reason
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {REPORT_REASONS.map((r) => {
                  const active = reason === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className="text-left px-3 py-2 rounded-xl border text-xs font-medium transition-colors"
                      style={{
                        background: active ? 'var(--bg-active)' : 'var(--bg-elevated)',
                        borderColor: active ? 'var(--brand-primary)' : 'var(--border-subtle)',
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Extra details (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={400}
                rows={2}
                placeholder="Add any helpful context..."
                className="themed-input py-2 px-3 text-xs resize-none"
              />
            </div>

            <label
              className="flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none text-xs"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
            >
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="w-4 h-4 rounded accent-rose-500"
              />
              <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <ShieldAlert size={14} className="text-rose-400 flex-shrink-0" />
                <span>Also block {targetName} (hide their messages &amp; prevent matches)</span>
              </span>
            </label>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-soft flex-1 py-2 text-xs">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-danger-soft flex-1 py-2 text-xs"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
