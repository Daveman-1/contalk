'use client';

import { useState } from 'react';
import UserAvatar from '@/components/UserAvatar';
import { AVATARS } from '@/lib/avatars';
import { getIdentity, setSavedAvatar } from '@/lib/identity';
import { X } from 'lucide-react';

export default function AvatarPickerModal({ currentAvatar, onClose, onSaved }) {
  const [selected, setSelected] = useState(currentAvatar);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      setSavedAvatar(selected);
      const identity = getIdentity();
      if (!identity.isAnon) {
        await fetch('/api/users/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: identity.id, avatar: selected }),
        }).catch(() => {});
      }
      onSaved?.(selected);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="surface-card rounded-2xl p-6 w-full max-w-md animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Choose Your Avatar
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Shown across your chats, rooms, random matches &amp; posts
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-sm rounded-lg hover:bg-[var(--bg-hover)] flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2.5 my-5">
          {AVATARS.map((av) => {
            const isSelected = selected === av.id;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => setSelected(av.id)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all"
                style={{
                  background: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                  borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                <UserAvatar avatar={av.id} size={48} />
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)' }}
                >
                  {av.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2.5">
          <button type="button" onClick={onClose} className="btn-soft flex-1 py-2.5 text-xs sm:text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-indigo flex-1 py-2.5 text-xs sm:text-sm">
            {saving ? 'Saving...' : 'Save Avatar'}
          </button>
        </div>
      </div>
    </div>
  );
}
