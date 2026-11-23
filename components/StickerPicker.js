'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  formatGiphySticker,
  parseStickerMessage,
  getRecentStickers,
  pushRecentSticker,
} from '@/lib/stickers';

const STICKER_CATEGORIES = [
  { id: 'recent', label: 'Recent' },
  { id: '', label: 'Trending' },
  { id: 'hi', label: 'Hi' },
  { id: 'lol', label: 'LOL' },
  { id: 'love', label: 'Love' },
  { id: 'fire', label: 'Fire' },
  { id: 'dance', label: 'Dance' },
  { id: 'wow', label: 'Wow' },
];

export default function StickerPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('');
  const [stickers, setStickers] = useState([]);
  const [recentValues, setRecentValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('starter');

  useEffect(() => {
    setRecentValues(getRecentStickers());
  }, []);

  useEffect(() => {
    if (!query && activeCat === 'recent') {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const term = query.trim() || activeCat;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stickers?q=${encodeURIComponent(term)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setStickers(Array.isArray(data.stickers) ? data.stickers : []);
          setSource(data.source || 'starter');
        }
      } catch {
        if (!cancelled) setStickers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query ? 260 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, activeCat]);

  const handlePickUrl = (url) => {
    const encoded = formatGiphySticker(url);
    if (!encoded) return;
    setRecentValues(pushRecentSticker(encoded));
    onSelect(encoded);
    onClose?.();
  };

  const showingRecent = !query && activeCat === 'recent';

  return (
    <div
      className="surface-card rounded-2xl w-[min(350px,calc(100vw-2rem))] overflow-hidden animate-fadeIn z-40"
      style={{ borderColor: 'var(--border-strong)' }}
    >
      {/* Header + Search + Category Tabs */}
      <div className="px-3 pt-3 pb-2 border-b space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              Stickers
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-active)', color: 'var(--brand-primary)' }}
            >
              GIPHY
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs p-1 rounded-md hover:bg-[var(--bg-hover)] flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close stickers"
          >
            <X size={14} />
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value && activeCat === 'recent') setActiveCat('');
          }}
          placeholder="Search GIPHY stickers..."
          className="themed-input py-1.5 px-3 text-xs"
        />

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {STICKER_CATEGORIES.map((cat) => {
            const active = !query && activeCat === cat.id;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => {
                  setQuery('');
                  setActiveCat(cat.id);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: active ? 'var(--bg-active)' : 'transparent',
                  color: active ? 'var(--brand-primary)' : 'var(--text-muted)',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transparent Animated Sticker Grid */}
      <div className="p-2.5 h-[245px] overflow-y-auto">
        {showingRecent ? (
          recentValues.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center px-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              Stickers you send will appear here for quick reuse.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {recentValues.map((val, idx) => {
                const parsed = parseStickerMessage(val);
                if (!parsed || parsed.type !== 'giphy') return null;
                return (
                  <button
                    key={`${idx}_${parsed.url}`}
                    type="button"
                    onClick={() => handlePickUrl(parsed.url)}
                    className="h-24 p-1.5 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <img
                      src={parsed.url}
                      alt="Recent sticker"
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                  </button>
                );
              })}
            </div>
          )
        ) : loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="spinner"></div>
          </div>
        ) : stickers.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
            No stickers found
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {stickers.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handlePickUrl(st.previewUrl || st.url)}
                className="h-24 p-1.5 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: 'var(--bg-hover)' }}
                title={st.title}
              >
                <img
                  src={st.previewUrl}
                  alt={st.title}
                  loading="lazy"
                  className="w-full h-full object-contain"
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
        <span>Powered by GIPHY Stickers</span>
        <span>{source === 'giphy' ? 'Live API' : 'Starter Pack'}</span>
      </div>
    </div>
  );
}
