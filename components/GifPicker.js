'use client';

import { useState, useEffect } from 'react';
import { formatGifMessage } from '@/lib/stickers';

const QUICK_MOODS = [
  { id: '', label: 'Trending' },
  { id: 'hi', label: 'Hi' },
  { id: 'lol', label: 'LOL' },
  { id: 'hype', label: 'Hype' },
  { id: 'love', label: 'Love' },
  { id: 'dance', label: 'Dance' },
  { id: 'shocked', label: 'Shocked' },
];

export default function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [activeMood, setActiveMood] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('starter');

  useEffect(() => {
    let cancelled = false;
    const term = query.trim() || activeMood;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/gifs?q=${encodeURIComponent(term)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setGifs(Array.isArray(data.gifs) ? data.gifs : []);
          setSource(data.source || 'starter');
        }
      } catch {
        if (!cancelled) setGifs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query ? 260 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, activeMood]);

  const handlePick = (gif) => {
    const encoded = formatGifMessage(gif.previewUrl || gif.url);
    if (!encoded) return;
    onSelect(encoded);
    onClose?.();
  };

  return (
    <div
      className="surface-card rounded-2xl w-[min(350px,calc(100vw-2rem))] overflow-hidden animate-fadeIn z-40"
      style={{ borderColor: 'var(--border-strong)' }}
    >
      {/* Header + Search */}
      <div className="px-3 pt-3 pb-2 border-b space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              GIFs
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-active)', color: 'var(--brand-mint)' }}
            >
              GIPHY
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-1.5 py-0.5 rounded-md"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close GIFs"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value) setActiveMood('');
          }}
          placeholder="Search GIPHY..."
          className="themed-input py-1.5 px-3 text-xs"
        />

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {QUICK_MOODS.map((m) => {
            const active = !query && activeMood === m.id;
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => {
                  setQuery('');
                  setActiveMood(m.id);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: active ? 'var(--bg-active)' : 'transparent',
                  color: active ? 'var(--brand-primary)' : 'var(--text-muted)',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* GIF Grid */}
      <div className="p-2.5 h-[245px] overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="spinner"></div>
          </div>
        ) : gifs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
            No GIFs found
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => handlePick(gif)}
                className="relative h-24 rounded-xl overflow-hidden border transition-transform hover:scale-[1.03]"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
                title={gif.title}
              >
                <img
                  src={gif.previewUrl}
                  alt={gif.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-1.5 border-t flex items-center justify-between text-[10px]"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        <span>Powered by GIPHY</span>
        <span>{source === 'giphy' ? 'Live API' : 'Starter Pack'}</span>
      </div>
    </div>
  );
}
