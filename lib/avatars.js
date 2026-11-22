export const AVATARS = [
  { id: 'fox', label: 'Fox', bg: '#F97316', bg2: '#EA580C' },
  { id: 'cat', label: 'Cat', bg: '#8B5CF6', bg2: '#6366F1' },
  { id: 'panda', label: 'Panda', bg: '#10B981', bg2: '#059669' },
  { id: 'alien', label: 'Alien', bg: '#12B89A', bg2: '#0D9488' },
  { id: 'robot', label: 'Robot', bg: '#3B82F6', bg2: '#2563EB' },
  { id: 'ghost', label: 'Ghost', bg: '#5B4AE3', bg2: '#4338CA' },
  { id: 'astro', label: 'Astro', bg: '#1E293B', bg2: '#0F172A' },
  { id: 'owl', label: 'Owl', bg: '#D97706', bg2: '#B45309' },
  { id: 'frog', label: 'Frog', bg: '#22C55E', bg2: '#16A34A' },
  { id: 'bear', label: 'Bear', bg: '#B45309', bg2: '#78350F' },
  { id: 'bunny', label: 'Bunny', bg: '#EC4899', bg2: '#DB2777' },
  { id: 'cloud', label: 'Cloud', bg: '#6366F1', bg2: '#2EE6C5' },
];

export const AVATAR_IDS = AVATARS.map((a) => a.id);

export function isValidAvatarId(id) {
  return AVATAR_IDS.includes(id);
}

export function getDefaultAvatarForId(seed) {
  const str = String(seed || 'contalk');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATARS[Math.abs(hash) % AVATARS.length].id;
}

export function resolveAvatarId(avatar, fallbackSeed) {
  if (isValidAvatarId(avatar)) return avatar;
  return getDefaultAvatarForId(fallbackSeed);
}
