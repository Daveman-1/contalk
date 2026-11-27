const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'contalk_dev_secret_key_change_in_production';
const AUTH_EXPIRES_IN = '7d';
const ANON_EXPIRES_IN = '365d';

const AUTH_COOKIE = 'ct_auth_token';
const ANON_COOKIE = 'ct_anon_token';

function signToken(payload, expiresIn = AUTH_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function signAnonToken({ id, name }) {
  return jwt.sign({ id, name, kind: 'anon' }, JWT_SECRET, { expiresIn: ANON_EXPIRES_IN });
}

function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of String(cookieHeader).split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

function getCookieOptions(maxAgeSeconds) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

function attachAuthCookie(response, token) {
  response.cookies.set(AUTH_COOKIE, token, getCookieOptions(60 * 60 * 24 * 7));
  return response;
}

function clearAuthCookie(response) {
  response.cookies.set(AUTH_COOKIE, '', getCookieOptions(0));
  return response;
}

function attachAnonCookie(response, token) {
  response.cookies.set(ANON_COOKIE, token, getCookieOptions(60 * 60 * 24 * 365));
  return response;
}

/**
 * Extracts verified account + anonymous session from Authorization Bearer header
 * and HttpOnly signed cookies. Never trusts arbitrary client-supplied IDs.
 */
function getSessionFromRequest(request) {
  const cookies = parseCookies(request.headers.get('cookie') || '');
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  const rawAuth = verifyToken(bearerToken || cookies[AUTH_COOKIE]);
  const account =
    rawAuth && rawAuth.id && rawAuth.username && rawAuth.kind !== 'anon'
      ? { id: String(rawAuth.id), name: String(rawAuth.username), isAnon: false }
      : null;

  const rawAnon = verifyToken(cookies[ANON_COOKIE]);
  const anon =
    rawAnon && rawAnon.id && rawAnon.kind === 'anon'
      ? { id: String(rawAnon.id), name: String(rawAnon.name || 'Anon'), isAnon: true }
      : null;

  const active = account || anon;
  const allowedIds = new Set([account?.id, anon?.id].filter(Boolean));

  return { account, anon, active, allowedIds };
}

/**
 * Checks whether a verified session is allowed to read/write to a given roomId.
 * - `chatroom:*`: any verified session
 * - `idA__dm__idB`: caller MUST be one of the two participants
 * - `random_*`: caller's active random session must match this roomId (verified separately when provided)
 */
function isDmParticipant(roomId, session) {
  if (!roomId || !session) return false;
  const parts = String(roomId).split('__dm__');
  if (parts.length !== 2) return false;
  return session.allowedIds.has(parts[0]) || session.allowedIds.has(parts[1]);
}

function getDmOtherParticipant(roomId, callerId) {
  const parts = String(roomId || '').split('__dm__');
  if (parts.length !== 2) return null;
  if (parts[0] === callerId) return parts[1];
  if (parts[1] === callerId) return parts[0];
  return null;
}

module.exports = {
  AUTH_COOKIE,
  ANON_COOKIE,
  signToken,
  signAnonToken,
  verifyToken,
  attachAuthCookie,
  clearAuthCookie,
  attachAnonCookie,
  getSessionFromRequest,
  isDmParticipant,
  getDmOtherParticipant,
};
