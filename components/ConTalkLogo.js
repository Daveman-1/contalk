'use client';

import { useTheme } from '@/components/ThemeProvider';

export default function ConTalkLogo({
  variant = 'full',
  size = 42,
  showTagline = false,
  cutoutColor,
  className = '',
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Mark only (clean modern geometric speech bubble C-mark)
  if (variant === 'mark') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`flex-shrink-0 select-none ${className}`}
        aria-label="ConTalk logo"
      >
        <defs>
          <linearGradient id="ct_mark_primary" x1="6" y1="8" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8C7BFF" />
            <stop offset="45%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="ct_mark_accent" x1="18" y1="18" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2EE6C5" />
            <stop offset="55%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="ct_mark_glow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366F1" floodOpacity={isDark ? '0.45' : '0.2'} />
          </filter>
        </defs>

        {/* Ambient back aura */}
        <circle cx="32" cy="32" r="28" fill="#6366F1" fillOpacity={isDark ? '0.12' : '0.06'} />

        {/* Secondary dialogue node (Cyan/Mint) */}
        <path
          d="M26 14C37.0457 14 46 22.9543 46 34C46 38.2 44.7 42.1 42.5 45.3L46 54L37.2 50.8C34.2 52.8 30.2 54 26 54C14.9543 54 6 45.0457 6 34C6 22.9543 14.9543 14 26 14Z"
          fill="url(#ct_mark_accent)"
          fillOpacity={isDark ? '0.88' : '0.92'}
        />

        {/* Primary dialogue vessel (Electric Indigo/Violet) */}
        <path
          d="M38 10C49.0457 10 58 18.9543 58 30C58 35.2 56 39.9 52.7 43.4L55 52L45.4 48.4C42 50.7 37.7 52 33 52C21.9543 52 13 43.0457 13 32C13 20.9543 21.9543 10 33 10H38Z"
          fill="url(#ct_mark_primary)"
          filter="url(#ct_mark_glow)"
          stroke={cutoutColor || (isDark ? '#0C0D18' : '#FFFFFF')}
          strokeWidth="3.2"
          strokeLinejoin="round"
          paintOrder="stroke"
        />

        {/* Modern dialogue wave cutout */}
        <circle cx="28" cy="30" r="3.2" fill="#FFFFFF" fillOpacity="0.95" />
        <circle cx="36" cy="30" r="3.2" fill="#FFFFFF" fillOpacity="0.95" />
        <circle cx="44" cy="30" r="3.2" fill="#2EE6C5" />
      </svg>
    );
  }

  // Full / Horizontal Brand Identity (Icon Mark + Typography + Tagline)
  const markSize = Math.max(34, Math.min(54, Math.round(size * 0.35)));

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div className="flex items-center gap-3">
        {/* Vector Mark */}
        <div className="relative flex-shrink-0 transition-transform duration-200 hover:scale-105">
          <svg
            width={markSize}
            height={markSize}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ct_full_p" x1="6" y1="8" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8C7BFF" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#4F46E5" />
              </linearGradient>
              <linearGradient id="ct_full_m" x1="18" y1="18" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2EE6C5" />
                <stop offset="60%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>

            {/* Back Mint Bubble */}
            <path
              d="M26 14C37.0457 14 46 22.9543 46 34C46 38.2 44.7 42.1 42.5 45.3L46 54L37.2 50.8C34.2 52.8 30.2 54 26 54C14.9543 54 6 45.0457 6 34C6 22.9543 14.9543 14 26 14Z"
              fill="url(#ct_full_m)"
              fillOpacity={isDark ? '0.9' : '0.95'}
            />

            {/* Front Indigo Bubble */}
            <path
              d="M38 10C49.0457 10 58 18.9543 58 30C58 35.2 56 39.9 52.7 43.4L55 52L45.4 48.4C42 50.7 37.7 52 33 52C21.9543 52 13 43.0457 13 32C13 20.9543 21.9543 10 33 10H38Z"
              fill="url(#ct_full_p)"
              stroke={isDark ? '#0C0D18' : '#FFFFFF'}
              strokeWidth="3.2"
              strokeLinejoin="round"
              paintOrder="stroke"
            />

            {/* Pulsing Voice Dots */}
            <circle cx="28" cy="30" r="3.2" fill="#FFFFFF" fillOpacity="0.95" />
            <circle cx="36" cy="30" r="3.2" fill="#FFFFFF" fillOpacity="0.95" />
            <circle cx="44" cy="30" r="3.2" fill="#2EE6C5" />
          </svg>
        </div>

        {/* Typographic Wordmark */}
        <div className="flex flex-col">
          <div className="flex items-center tracking-tight leading-none">
            <span
              className="font-extrabold text-2xl sm:text-3xl"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
            >
              Con
            </span>
            <span
              className="font-extrabold text-2xl sm:text-3xl bg-gradient-to-r from-[#8C7BFF] via-[#7565F2] to-[#2EE6C5] bg-clip-text text-transparent"
              style={{ letterSpacing: '-0.03em' }}
            >
              Talk
            </span>
            <span
              className="inline-block w-2 h-2 rounded-full ml-1.5"
              style={{
                background: '#2EE6C5',
                boxShadow: '0 0 8px rgba(46, 230, 197, 0.8)',
              }}
            />
          </div>
        </div>
      </div>

      {showTagline && (
        <div className="flex items-center gap-2 mt-2 px-3 py-0.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <span className="online-dot" style={{ width: 6, height: 6 }} />
          <span
            className="text-[11px] font-medium tracking-wide uppercase"
            style={{ color: 'var(--text-secondary)' }}
          >
            Real-Time · Anonymous · Public
          </span>
        </div>
      )}
    </div>
  );
}
