'use client';

function CloudShell({ fill, accent, children, badgeText, badgeBg = '#131226', badgeColor = '#FFFFFF' }) {
  return (
    <svg viewBox="0 0 140 140" className="w-full h-full drop-shadow-md overflow-visible" aria-hidden="true">
      {/* Die-cut white sticker backing */}
      <path
        d="M32 48C32 33 44 22 59 22C66 22 72 25 77 29C82 23 90 20 99 21C113 22 123 34 122 48C132 52 138 62 136 74C135 88 123 98 109 98H103C98 106 89 111 78 111C69 111 61 107 56 101C51 105 44 107 37 105C24 103 15 90 17 77C13 71 12 64 15 57C18 51 24 48 32 48Z"
        fill={fill}
        stroke="#FFFFFF"
        strokeWidth="7"
        paintOrder="stroke"
        strokeLinejoin="round"
      />
      {/* Thought dots */}
      <circle cx="24" cy="117" r="6" fill={fill} stroke="#FFFFFF" strokeWidth="3.5" paintOrder="stroke" />
      <circle cx="13" cy="127" r="3.5" fill={fill} stroke="#FFFFFF" strokeWidth="2.5" paintOrder="stroke" />
      {/* Subtle top highlight */}
      <ellipse cx="64" cy="36" rx="18" ry="6" fill={accent} opacity="0.28" />
      {children}
      {badgeText && (
        <g transform="translate(72 114)">
          <rect
            x="-44"
            y="-14"
            width="88"
            height="27"
            rx="13.5"
            fill={badgeBg}
            stroke="#FFFFFF"
            strokeWidth="3.5"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fill={badgeColor}
            fontSize="13.5"
            fontWeight="900"
            fontFamily="Inter, system-ui, sans-serif"
            letterSpacing="0.5"
          >
            {badgeText}
          </text>
        </g>
      )}
    </svg>
  );
}

function BadgeSticker({ bg1, bg2, rotate = -4, topText, bottomText, symbol }) {
  const gradId = `sg_${topText.replace(/[^a-z0-9]/gi, '')}_${Math.abs(rotate)}`;
  return (
    <svg viewBox="0 0 140 140" className="w-full h-full drop-shadow-md overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor={bg1} />
          <stop offset="1" stopColor={bg2} />
        </linearGradient>
      </defs>
      <g transform={`rotate(${rotate} 70 70)`}>
        <rect
          x="14"
          y="22"
          width="112"
          height="96"
          rx="28"
          fill={`url(#${gradId})`}
          stroke="#FFFFFF"
          strokeWidth="7"
          paintOrder="stroke"
        />
        <text x="70" y="64" textAnchor="middle" fontSize="34">
          {symbol}
        </text>
        <text
          x="70"
          y="92"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="17"
          fontWeight="900"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="0.4"
        >
          {topText}
        </text>
        {bottomText && (
          <text
            x="70"
            y="108"
            textAnchor="middle"
            fill="rgba(255,255,255,0.9)"
            fontSize="10.5"
            fontWeight="800"
            fontFamily="Inter, system-ui, sans-serif"
            letterSpacing="1"
          >
            {bottomText}
          </text>
        )}
      </g>
    </svg>
  );
}

export default function StickerGraphic({ id, size = 116 }) {
  return (
    <div style={{ width: size, height: size }} className="select-none flex-shrink-0">
      {renderBuiltin(id)}
    </div>
  );
}

function renderBuiltin(id) {
  switch (id) {
    case 'cloud_hey':
      return (
        <CloudShell fill="#7B6BFF" accent="#FFFFFF" badgeText="HEY!" badgeBg="#2EE6C5" badgeColor="#0C2622">
          <circle cx="57" cy="60" r="5" fill="#131226" />
          <circle cx="88" cy="60" r="5" fill="#131226" />
          <circle cx="59" cy="58" r="1.8" fill="#FFFFFF" />
          <circle cx="90" cy="58" r="1.8" fill="#FFFFFF" />
          <ellipse cx="47" cy="69" rx="5.5" ry="3" fill="#FF85B3" opacity="0.7" />
          <ellipse cx="98" cy="69" rx="5.5" ry="3" fill="#FF85B3" opacity="0.7" />
          <path d="M62 72Q72.5 84 83 72" fill="none" stroke="#131226" strokeWidth="4.2" strokeLinecap="round" />
        </CloudShell>
      );

    case 'cloud_lol':
      return (
        <CloudShell fill="#2EE6C5" accent="#FFFFFF" badgeText="LMAO" badgeBg="#5B4AE3" badgeColor="#FFFFFF">
          <path d="M48 58L58 63L48 68" fill="none" stroke="#0D2622" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M97 58L87 63L97 68" fill="none" stroke="#0D2622" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M58 72C60 85 85 85 87 72Z" fill="#0D2622" />
          <path d="M65 80Q72.5 85 80 80" fill="#FF7EA5" />
          <circle cx="38" cy="70" r="4" fill="#38BDF8" />
          <circle cx="107" cy="70" r="4" fill="#38BDF8" />
        </CloudShell>
      );

    case 'cloud_love':
      return (
        <CloudShell fill="#FF6B9D" accent="#FFFFFF" badgeText="LOVE IT" badgeBg="#131226" badgeColor="#FFE4EC">
          <text x="55" y="68" textAnchor="middle" fontSize="20">❤️</text>
          <text x="90" y="68" textAnchor="middle" fontSize="20">❤️</text>
          <path d="M64 76Q72.5 85 81 76" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        </CloudShell>
      );

    case 'cloud_sus':
      return (
        <CloudShell fill="#5B4AE3" accent="#FFFFFF" badgeText="SUS..." badgeBg="#FACC15" badgeColor="#131226">
          <rect x="46" y="55" width="20" height="8" rx="4" fill="#FFFFFF" />
          <rect x="78" y="55" width="20" height="8" rx="4" fill="#FFFFFF" />
          <circle cx="61" cy="59" r="3.2" fill="#131226" />
          <circle cx="93" cy="59" r="3.2" fill="#131226" />
          <line x1="60" y1="77" x2="86" y2="75" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        </CloudShell>
      );

    case 'cloud_anon':
      return (
        <CloudShell fill="#1E1F38" accent="#8C7BFF" badgeText="ANON" badgeBg="#8C7BFF" badgeColor="#131226">
          {/* Shades */}
          <rect x="43" y="54" width="24" height="14" rx="4" fill="#2EE6C5" stroke="#FFFFFF" strokeWidth="2.5" />
          <rect x="76" y="54" width="24" height="14" rx="4" fill="#2EE6C5" stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1="67" y1="60" x2="76" y2="60" stroke="#FFFFFF" strokeWidth="3" />
          <path d="M62 79Q72 84 82 78" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
        </CloudShell>
      );

    case 'cloud_bye':
      return (
        <CloudShell fill="#12B89A" accent="#FFFFFF" badgeText="PEACE!" badgeBg="#131226" badgeColor="#2EE6C5">
          <path d="M51 62Q57 54 63 62" fill="none" stroke="#0C2622" strokeWidth="4" strokeLinecap="round" />
          <path d="M82 62Q88 54 94 62" fill="none" stroke="#0C2622" strokeWidth="4" strokeLinecap="round" />
          <path d="M62 73Q72.5 83 83 73" fill="none" stroke="#0C2622" strokeWidth="4" strokeLinecap="round" />
          <text x="108" y="45" fontSize="22">✌️</text>
        </CloudShell>
      );

    case 'hype_fire':
      return <BadgeSticker bg1="#F97316" bg2="#EF4444" rotate={-5} symbol="🔥" topText="NO CAP" bottomText="FOR REAL" />;
    case 'hype_100':
      return <BadgeSticker bg1="#5B4AE3" bg2="#8C7BFF" rotate={4} symbol="💯" topText="100% REAL" bottomText="FACTS" />;
    case 'hype_slay':
      return <BadgeSticker bg1="#EC4899" bg2="#A855F7" rotate={-4} symbol="✨" topText="SLAY" bottomText="ICONIC" />;
    case 'hype_dead':
      return <BadgeSticker bg1="#1E293B" bg2="#475569" rotate={5} symbol="💀" topText="I'M DEAD" bottomText="CRYING" />;
    case 'hype_cooked':
      return <BadgeSticker bg1="#EA580C" bg2="#FACC15" rotate={-3} symbol="🍳" topText="COOKED" bottomText="LET HIM COOK" />;
    case 'hype_goat':
      return <BadgeSticker bg1="#0D9488" bg2="#2EE6C5" rotate={4} symbol="👑" topText="GOAT" bottomText="LEGEND" />;

    case 'vibe_bet':
      return <BadgeSticker bg1="#12B89A" bg2="#0EA5E9" rotate={-4} symbol="👍" topText="BET!" bottomText="SAY LESS" />;
    case 'vibe_heart':
      return <BadgeSticker bg1="#F43F5E" bg2="#FB7185" rotate={4} symbol="💖" topText="MUCH LOVE" bottomText="APPRECIATE U" />;
    case 'vibe_music':
      return <BadgeSticker bg1="#6366F1" bg2="#2EE6C5" rotate={-5} symbol="🎧" topText="VIBING" bottomText="GOOD ENERGY" />;
    case 'vibe_coffee':
      return <BadgeSticker bg1="#92400E" bg2="#D97706" rotate={3} symbol="☕" topText="COFFEE" bottomText="SEND HELP" />;
    case 'vibe_party':
      return <BadgeSticker bg1="#8B5CF6" bg2="#F472B6" rotate={-4} symbol="🎉" topText="LET'S GO!" bottomText="W MOMENT" />;
    case 'vibe_sleepy':
      return <BadgeSticker bg1="#312E81" bg2="#6366F1" rotate={4} symbol="😴" topText="SLEEPY" bottomText="BRB ZZZ" />;

    default:
      return <BadgeSticker bg1="#5B4AE3" bg2="#12B89A" rotate={0} symbol="✨" topText="CONTALK" />;
  }
}
