'use client';

import { useTheme } from '@/components/ThemeProvider';

export default function ConTalkLogo({
  variant = 'full',
  size = 160,
  showTagline = false,
  cutoutColor,
  className = '',
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const conFill = isDark ? '#8C7BFF' : '#5B4AE3';
  const talkFill = isDark ? '#2EE6C5' : '#12B89A';
  const cutout = cutoutColor || (isDark ? '#0C0D18' : '#FFFFFF');

  if (variant === 'mark') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="ConTalk logo"
      >
        {/* Back-right Talk cloud */}
        <path
          d="M27.5 18.5C27.5 13.8 31.3 10.5 36 10.5C38.4 10.5 40.5 11.4 42 12.8C43.5 11.7 45.4 11.2 47.4 11.5C51.4 12.1 54.3 15.6 54 19.6C56.6 21 58.2 23.7 57.8 26.8C57.3 30.7 53.9 33.4 50 33.4H48.6C47.3 35.6 44.8 37 42 37C39.6 37 37.5 35.9 36.1 34.2C34.8 35.2 33.2 35.7 31.4 35.5C27.5 35 24.8 31.5 25.4 27.6C24.2 25.9 23.8 23.8 24.4 21.8C25 20 26.1 19 27.5 18.5Z"
          fill={talkFill}
        />
        {/* Talk thought dots */}
        <circle cx="52.5" cy="40.5" r="2.7" fill={talkFill} />
        <circle cx="56.5" cy="45.5" r="1.6" fill={talkFill} />

        {/* Front-left Con cloud with clean cutout */}
        <path
          d="M11 33.5C11 29.1 14.5 25.8 18.9 25.8C20.9 25.8 22.8 26.5 24.2 27.8C25.9 26.2 28.4 25.5 30.9 26.1C34.4 27 36.8 30.1 36.7 33.6C39.5 34.8 41.3 37.6 40.9 40.8C40.4 44.6 37.1 47.4 33.2 47.4H31.8C30.4 49.5 28 50.8 25.3 50.8C23 50.8 20.9 49.7 19.5 48.1C18.1 49.1 16.3 49.5 14.5 49.2C10.6 48.5 8 44.9 8.7 41C7.6 39.4 7.3 37.3 8 35.4C8.5 34.2 9.6 33.7 11 33.5Z"
          fill={conFill}
          stroke={cutout}
          strokeWidth="2.8"
          paintOrder="stroke"
          strokeLinejoin="round"
        />
        {/* Con thought dots */}
        <circle cx="11.5" cy="54.2" r="2.7" fill={conFill} />
        <circle cx="7.4" cy="58.6" r="1.6" fill={conFill} />

        {/* 3 chat dots inside front cloud */}
        <circle cx="18.1" cy="38.3" r="2.3" fill="#FFFFFF" fillOpacity="0.95" />
        <circle cx="24.3" cy="38.3" r="2.3" fill="#FFFFFF" fillOpacity="0.95" />
        <circle cx="30.5" cy="38.3" r="2.3" fill="#2EE6C5" />
      </svg>
    );
  }

  const height = Math.round(size * 0.54);

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={size}
        height={height}
        viewBox="0 0 280 152"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ConTalk"
      >
        {/* Back-right thought cloud */}
        <path
          d="M123 36C123 22 135 12 149 12C156 12 162.5 14.8 167 19.2C172 14 179.4 11 187.5 11.5C201 12.4 211 23.2 210.5 36.2C222 39.2 230.5 49.8 229.5 62.5C228.4 76.2 217 86.5 203.2 86.5H197.5C192.5 94.5 183.4 99.8 173 99.8C164.2 99.8 156.4 95.8 151.4 89.5C146.5 93.2 140 94.8 133.2 93.8C119.5 91.6 110.2 79 112.4 65.4C108.5 60 107.2 52.8 109.4 46.2C111.5 40 116.5 36.8 123 36Z"
          fill={talkFill}
        />
        {/* Back cloud trailing dots */}
        <circle cx="215" cy="108" r="6.5" fill={talkFill} />
        <circle cx="228" cy="122" r="3.8" fill={talkFill} />

        {/* Front-left thought cloud with cutout stroke */}
        <path
          d="M49 69C49 55.5 60.5 45.5 74.5 45.5C81.2 45.5 87.2 48 91.6 52.2C96.8 47.2 104.2 44.5 112.2 45.2C125 46.4 134.8 56.8 134.4 69.5C145.2 72.5 153 82.8 152 95C150.9 108.2 139.8 118 126.5 118H121C116 125.8 107.2 130.8 97 130.8C88.5 130.8 81 127 76.2 121C71.4 124.4 65 126 58.4 124.8C45.2 122.4 36.4 110 38.6 96.8C34.8 91.6 33.6 84.6 35.8 78.2C37.8 72.4 42.8 69.5 49 69Z"
          fill={conFill}
          stroke={cutout}
          strokeWidth="6.5"
          paintOrder="stroke"
          strokeLinejoin="round"
        />
        {/* Front cloud trailing dots */}
        <circle cx="48" cy="136" r="6.5" fill={conFill} />
        <circle cx="35" cy="147" r="3.8" fill={conFill} />

        {/* 3 chat dots replacing "Con Talk" */}
        <circle cx="74" cy="88" r="7.2" fill="#FFFFFF" fillOpacity="0.95" />
        <circle cx="93.5" cy="88" r="7.2" fill="#FFFFFF" fillOpacity="0.95" />
        <circle cx="113" cy="88" r="7.2" fill="#2EE6C5" />
      </svg>

      {showTagline && (
        <span
          className="mt-2 text-xs sm:text-sm font-mono tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          Say it. Stay anonymous.
        </span>
      )}
    </div>
  );
}
