export const STICKER_PREFIX = '[[sticker:';
export const GIPHY_STICKER_PREFIX = '[[gsticker:';
export const GIF_PREFIX = '[[gif:';
export const STICKER_SUFFIX = ']]';

export const LEGACY_BUILTIN_IDS = new Set([
  'cloud_hey', 'cloud_lol', 'cloud_love', 'cloud_sus', 'cloud_anon', 'cloud_bye',
  'hype_fire', 'hype_100', 'hype_slay', 'hype_dead', 'hype_cooked', 'hype_goat',
  'vibe_bet', 'vibe_heart', 'vibe_music', 'vibe_coffee', 'vibe_party', 'vibe_sleepy',
]);

export function isAllowedGiphyUrl(urlStr) {
  try {
    const parsed = new URL(String(urlStr || '').trim());
    if (parsed.protocol !== 'https:') return false;
    return /^(media[0-4]?|i)\.giphy\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function formatGiphySticker(stickerUrl) {
  if (!isAllowedGiphyUrl(stickerUrl)) return '';
  return `${GIPHY_STICKER_PREFIX}${stickerUrl}${STICKER_SUFFIX}`;
}

export function formatGifMessage(gifUrl) {
  if (!isAllowedGiphyUrl(gifUrl)) return '';
  return `${GIF_PREFIX}${gifUrl}${STICKER_SUFFIX}`;
}

export function parseStickerMessage(content) {
  const str = String(content || '').trim();

  // GIPHY transparent animated sticker
  if (str.startsWith(GIPHY_STICKER_PREFIX) && str.endsWith(STICKER_SUFFIX)) {
    const url = str.slice(GIPHY_STICKER_PREFIX.length, -STICKER_SUFFIX.length);
    if (isAllowedGiphyUrl(url)) {
      return { type: 'giphy', url };
    }
  }

  // Backward compatibility for any legacy built-in stickers in old history
  if (str.startsWith(STICKER_PREFIX) && str.endsWith(STICKER_SUFFIX)) {
    const id = str.slice(STICKER_PREFIX.length, -STICKER_SUFFIX.length);
    if (LEGACY_BUILTIN_IDS.has(id)) {
      return { type: 'builtin', id };
    }
  }

  return null;
}

export function parseGifMessage(content) {
  const str = String(content || '').trim();
  if (str.startsWith(GIF_PREFIX) && str.endsWith(STICKER_SUFFIX)) {
    const url = str.slice(GIF_PREFIX.length, -STICKER_SUFFIX.length);
    if (isAllowedGiphyUrl(url)) {
      return { type: 'gif', url };
    }
  }
  return null;
}

export function getNotificationPreview(content) {
  if (parseStickerMessage(content)) return 'Sent a sticker';
  if (parseGifMessage(content)) return 'Sent a GIF';
  return String(content || '');
}

export function getRecentStickers() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('ct_recent_giphy_stickers');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v) => {
          const p = parseStickerMessage(v);
          return p && p.type === 'giphy';
        })
      : [];
  } catch {
    return [];
  }
}

export function pushRecentSticker(value) {
  const p = parseStickerMessage(value);
  if (typeof window === 'undefined' || !p || p.type !== 'giphy') return [];
  const current = getRecentStickers().filter((v) => v !== value);
  const next = [value, ...current].slice(0, 12);
  try {
    localStorage.setItem('ct_recent_giphy_stickers', JSON.stringify(next));
  } catch {}
  return next;
}
