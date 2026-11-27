// Lightweight server-side spam & profanity guard (skips allowlisted GIPHY tokens)

const BLOCKED_TERMS = [
  /\bn[i1!|]gg[e3a@4]r?s?\b/i,
  /\bf[a@4]gg?[o0]ts?\b/i,
  /\bk[i1!]ke?s?\b/i,
  /\bch[i1!]nks?\b/i,
  /\bret[a@4]rd(?:ed|s)?\b/i,
  /\bkill\s+your\s*self\b/i,
  /\bkys\b/i,
  /\bchild\s*porn\b/i,
  /\bcp\s*links?\b/i,
];

const URL_REGEX = /https?:\/\/[^\s]+/gi;

export function isGiphyMediaToken(text) {
  const str = String(text || '').trim();
  return (
    (/^\[sticker:giphy:https:\/\/(media[0-4]?|i)\.giphy\.com\/[^\]]+\]$/i.test(str)) ||
    (/^\[gif:https:\/\/(media[0-4]?|i)\.giphy\.com\/[^\]]+\]$/i.test(str)) ||
    (/^\[sticker:[a-z0-9_-]{1,32}\]$/i.test(str))
  );
}

/**
 * Validates text content for length, spam patterns, and severe abusive terms.
 */
export function checkContentSafety(content, { maxLength = 1000 } = {}) {
  const text = String(content || '').trim();
  if (!text) {
    return { ok: false, reason: 'Message cannot be empty.' };
  }

  if (isGiphyMediaToken(text)) {
    return { ok: true };
  }

  if (text.length > maxLength) {
    return { ok: false, reason: `Text cannot exceed ${maxLength} characters.` };
  }

  // Block excessive URL spam (3+ links in one message)
  const urls = text.match(URL_REGEX) || [];
  if (urls.length >= 3) {
    return { ok: false, reason: 'Too many links in a single message.' };
  }

  // Block extreme character-flooding spam (e.g., 16+ identical chars in a row)
  if (/(.)\1{15,}/.test(text)) {
    return { ok: false, reason: 'Please avoid repeating the same character excessively.' };
  }

  // Block severe slurs / self-harm incitement / illegal content
  for (const pattern of BLOCKED_TERMS) {
    if (pattern.test(text)) {
      return {
        ok: false,
        reason: 'Message blocked by ConTalk safety filter (harassment or hate speech is not allowed).',
      };
    }
  }

  return { ok: true };
}
