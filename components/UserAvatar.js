'use client';

import { AVATARS, resolveAvatarId } from '@/lib/avatars';

export default function UserAvatar({
  avatar,
  seed,
  name,
  size = 36,
  online = null,
  className = '',
}) {
  const avatarId = resolveAvatarId(avatar, seed || name || 'contalk');
  const meta = AVATARS.find((a) => a.id === avatarId) || AVATARS[0];
  const gradId = `av_${avatarId}_${size}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full flex-shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-full overflow-hidden"
        aria-label={name ? `${name} avatar` : meta.label}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor={meta.bg} />
            <stop offset="1" stopColor={meta.bg2} />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="32" fill={`url(#${gradId})`} />
        {renderCharacter(avatarId)}
      </svg>

      {online !== null && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2"
          style={{
            width: Math.max(9, Math.round(size * 0.28)),
            height: Math.max(9, Math.round(size * 0.28)),
            background: online ? '#2EE6C5' : 'var(--text-muted)',
            borderColor: 'var(--bg-panel)',
          }}
        />
      )}
    </div>
  );
}

function renderCharacter(id) {
  switch (id) {
    case 'fox':
      return (
        <g>
          {/* Ears */}
          <path d="M14 14L28 24L16 32Z" fill="#FB923C" />
          <path d="M50 14L36 24L48 32Z" fill="#FB923C" />
          <path d="M17 18L24 24L18 28Z" fill="#FFF7ED" />
          <path d="M47 18L40 24L46 28Z" fill="#FFF7ED" />
          {/* Head */}
          <ellipse cx="32" cy="36" rx="18" ry="15" fill="#FFEDD5" />
          <path d="M14 34C14 23 22 19 32 19C42 19 50 23 50 34C44 33 38 35 32 42C26 35 20 33 14 34Z" fill="#F97316" />
          {/* Eyes & Nose */}
          <circle cx="24" cy="34" r="2.7" fill="#1E1B2E" />
          <circle cx="40" cy="34" r="2.7" fill="#1E1B2E" />
          <circle cx="25" cy="33" r="0.9" fill="#FFFFFF" />
          <circle cx="41" cy="33" r="0.9" fill="#FFFFFF" />
          <ellipse cx="32" cy="41.5" rx="3.2" ry="2.2" fill="#1E1B2E" />
          <path d="M29 45Q32 47.5 35 45" stroke="#1E1B2E" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );

    case 'cat':
      return (
        <g>
          <path d="M15 15L26 23L16 33Z" fill="#EDE9FE" />
          <path d="M49 15L38 23L48 33Z" fill="#EDE9FE" />
          <path d="M18 19L24 24L18 29Z" fill="#F472B6" />
          <path d="M46 19L40 24L46 29Z" fill="#F472B6" />
          <circle cx="32" cy="36" r="17" fill="#F5F3FF" />
          <circle cx="25" cy="34" r="2.8" fill="#1E1B4B" />
          <circle cx="39" cy="34" r="2.8" fill="#1E1B4B" />
          <circle cx="26" cy="33" r="1" fill="#FFFFFF" />
          <circle cx="40" cy="33" r="1" fill="#FFFFFF" />
          <polygon points="32,40 29.5,37.5 34.5,37.5" fill="#F472B6" />
          <path d="M28 42.5Q32 45 36 42.5" stroke="#1E1B4B" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="12" y1="37" x2="20" y2="38" stroke="#A78BFA" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="12" y1="41" x2="20" y2="41" stroke="#A78BFA" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="52" y1="37" x2="44" y2="38" stroke="#A78BFA" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="52" y1="41" x2="44" y2="41" stroke="#A78BFA" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );

    case 'panda':
      return (
        <g>
          <circle cx="17" cy="20" r="7" fill="#18181B" />
          <circle cx="47" cy="20" r="7" fill="#18181B" />
          <circle cx="32" cy="36" r="18" fill="#FFFFFF" />
          <ellipse cx="24" cy="35" rx="5.5" ry="6.5" transform="rotate(-14 24 35)" fill="#18181B" />
          <ellipse cx="40" cy="35" rx="5.5" ry="6.5" transform="rotate(14 40 35)" fill="#18181B" />
          <circle cx="24.5" cy="34" r="2" fill="#FFFFFF" />
          <circle cx="39.5" cy="34" r="2" fill="#FFFFFF" />
          <ellipse cx="32" cy="41.5" rx="3" ry="2" fill="#18181B" />
          <path d="M28.5 45Q32 47.5 35.5 45" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="19" cy="42" rx="3" ry="1.8" fill="#FDA4AF" opacity="0.7" />
          <ellipse cx="45" cy="42" rx="3" ry="1.8" fill="#FDA4AF" opacity="0.7" />
        </g>
      );

    case 'alien':
      return (
        <g>
          <line x1="25" y1="19" x2="20" y2="11" stroke="#A7F3D0" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="39" y1="19" x2="44" y2="11" stroke="#A7F3D0" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="20" cy="11" r="3" fill="#2EE6C5" />
          <circle cx="44" cy="11" r="3" fill="#2EE6C5" />
          <path d="M15 33C15 22 22.5 17 32 17C41.5 17 49 22 49 33C49 44 40 52 32 52C24 52 15 44 15 33Z" fill="#A7F3D0" />
          <ellipse cx="24.5" cy="34" rx="4.5" ry="6" transform="rotate(-15 24.5 34)" fill="#0F172A" />
          <ellipse cx="39.5" cy="34" rx="4.5" ry="6" transform="rotate(15 39.5 34)" fill="#0F172A" />
          <circle cx="26" cy="32" r="1.4" fill="#FFFFFF" />
          <circle cx="41" cy="32" r="1.4" fill="#FFFFFF" />
          <path d="M27 44Q32 47 37 44" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
        </g>
      );

    case 'robot':
      return (
        <g>
          <line x1="32" y1="18" x2="32" y2="11" stroke="#DBEAFE" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="10" r="3" fill="#FACC15" />
          <rect x="14" y="19" width="36" height="31" rx="10" fill="#E2E8F0" />
          <rect x="20" y="26" width="24" height="12" rx="6" fill="#0F172A" />
          <circle cx="26.5" cy="32" r="3" fill="#38BDF8" />
          <circle cx="37.5" cy="32" r="3" fill="#38BDF8" />
          <rect x="24" y="42" width="16" height="3.5" rx="1.75" fill="#64748B" />
          <rect x="10" y="29" width="4" height="10" rx="2" fill="#94A3B8" />
          <rect x="50" y="29" width="4" height="10" rx="2" fill="#94A3B8" />
        </g>
      );

    case 'ghost':
      return (
        <g>
          <path
            d="M17 50V31C17 21.5 23.8 15 32 15C40.2 15 47 21.5 47 31V50L42 46L37 50L32 46L27 50L22 46L17 50Z"
            fill="#FFFFFF"
          />
          <circle cx="26" cy="31" r="3" fill="#1E1B4B" />
          <circle cx="38" cy="31" r="3" fill="#1E1B4B" />
          <ellipse cx="21" cy="36" rx="2.8" ry="1.8" fill="#F472B6" opacity="0.6" />
          <ellipse cx="43" cy="36" rx="2.8" ry="1.8" fill="#F472B6" opacity="0.6" />
          <ellipse cx="32" cy="38" rx="3" ry="3.5" fill="#1E1B4B" />
        </g>
      );

    case 'astro':
      return (
        <g>
          <circle cx="14" cy="18" r="1.2" fill="#F8FAFC" opacity="0.7" />
          <circle cx="51" cy="15" r="1.5" fill="#2EE6C5" />
          <circle cx="32" cy="35" r="19" fill="#F8FAFC" />
          <rect x="19" y="23" width="26" height="19" rx="9.5" fill="#312E81" />
          <path d="M23 28Q27 25 31 27" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
          <circle cx="26.5" cy="33" r="2.2" fill="#2EE6C5" />
          <circle cx="37.5" cy="33" r="2.2" fill="#2EE6C5" />
          <path d="M28.5 38Q32 40.5 35.5 38" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="24" y="48" width="16" height="5" rx="2.5" fill="#8C7BFF" />
        </g>
      );

    case 'owl':
      return (
        <g>
          <path d="M16 18L24 23L18 30Z" fill="#78350F" />
          <path d="M48 18L40 23L46 30Z" fill="#78350F" />
          <ellipse cx="32" cy="37" rx="17" ry="17" fill="#92400E" />
          <circle cx="24.5" cy="33" r="7.5" fill="#FEF3C7" />
          <circle cx="39.5" cy="33" r="7.5" fill="#FEF3C7" />
          <circle cx="25" cy="33" r="3.4" fill="#1C1917" />
          <circle cx="39" cy="33" r="3.4" fill="#1C1917" />
          <circle cx="26" cy="32" r="1.1" fill="#FFFFFF" />
          <circle cx="40" cy="32" r="1.1" fill="#FFFFFF" />
          <polygon points="32,43 28.5,37.5 35.5,37.5" fill="#F59E0B" />
        </g>
      );

    case 'frog':
      return (
        <g>
          <circle cx="21" cy="23" r="7" fill="#86EFAC" />
          <circle cx="43" cy="23" r="7" fill="#86EFAC" />
          <circle cx="21" cy="23" r="3.5" fill="#14532D" />
          <circle cx="43" cy="23" r="3.5" fill="#14532D" />
          <circle cx="22" cy="22" r="1.2" fill="#FFFFFF" />
          <circle cx="44" cy="22" r="1.2" fill="#FFFFFF" />
          <ellipse cx="32" cy="38" rx="19" ry="14" fill="#86EFAC" />
          <ellipse cx="20" cy="40" rx="3.2" ry="2" fill="#FDA4AF" opacity="0.7" />
          <ellipse cx="44" cy="40" rx="3.2" ry="2" fill="#FDA4AF" opacity="0.7" />
          <path d="M23 39Q32 46 41 39" stroke="#14532D" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );

    case 'bear':
      return (
        <g>
          <circle cx="17" cy="21" r="7" fill="#D97706" />
          <circle cx="47" cy="21" r="7" fill="#D97706" />
          <circle cx="17" cy="21" r="3.8" fill="#FDE68A" />
          <circle cx="47" cy="21" r="3.8" fill="#FDE68A" />
          <circle cx="32" cy="36" r="18" fill="#D97706" />
          <ellipse cx="32" cy="42" rx="8.5" ry="6.5" fill="#FEF3C7" />
          <circle cx="24.5" cy="33" r="2.7" fill="#1C1917" />
          <circle cx="39.5" cy="33" r="2.7" fill="#1C1917" />
          <ellipse cx="32" cy="39.5" rx="3.4" ry="2.2" fill="#1C1917" />
          <path d="M29 43.5Q32 45.8 35 43.5" stroke="#1C1917" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );

    case 'bunny':
      return (
        <g>
          <ellipse cx="23" cy="18" rx="5.5" ry="13" transform="rotate(-8 23 18)" fill="#FFFFFF" />
          <ellipse cx="41" cy="18" rx="5.5" ry="13" transform="rotate(8 41 18)" fill="#FFFFFF" />
          <ellipse cx="23" cy="18" rx="2.8" ry="8.5" transform="rotate(-8 23 18)" fill="#F9A8D4" />
          <ellipse cx="41" cy="18" rx="2.8" ry="8.5" transform="rotate(8 41 18)" fill="#F9A8D4" />
          <circle cx="32" cy="39" r="16" fill="#FFFFFF" />
          <circle cx="25.5" cy="37" r="2.6" fill="#1E1B2E" />
          <circle cx="38.5" cy="37" r="2.6" fill="#1E1B2E" />
          <ellipse cx="21" cy="41.5" rx="3" ry="1.8" fill="#F9A8D4" opacity="0.7" />
          <ellipse cx="43" cy="41.5" rx="3" ry="1.8" fill="#F9A8D4" opacity="0.7" />
          <ellipse cx="32" cy="41" rx="2.5" ry="1.8" fill="#EC4899" />
          <path d="M29 44.5Q32 46.8 35 44.5" stroke="#1E1B2E" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );

    case 'cloud':
    default:
      return (
        <g>
          <path
            d="M17 36C17 29 22 24 29 24C32 24 34.5 25 36.5 27C39 24.5 42.5 23.5 46 24.5C51.5 26 54.5 31 53.5 36.5C56 38.5 57 42.5 55 46C53.2 49.2 49.5 50.5 45.5 50.5H20C14.5 50.5 10.5 46.5 11.5 41C12.2 38 14.3 36.5 17 36Z"
            fill="#FFFFFF"
          />
          <circle cx="26.5" cy="38" r="2.6" fill="#131226" />
          <circle cx="39.5" cy="38" r="2.6" fill="#131226" />
          <path d="M29 43Q33 46.5 37 43" stroke="#131226" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
  }
}
