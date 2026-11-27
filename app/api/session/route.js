import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getSessionFromRequest,
  signAnonToken,
  attachAnonCookie,
  attachAuthCookie,
  AUTH_COOKIE,
} from '@/lib/auth';
import { findUserById } from '@/lib/db';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };
const VALID_ANON_ID = /^anon_[0-9a-f-]{12,64}$/i;
const VALID_ANON_NAME = /^Anon-[A-Z0-9]{2,8}$/;

function mintAnon(preferredId, preferredName) {
  const id =
    preferredId && VALID_ANON_ID.test(String(preferredId))
      ? String(preferredId)
      : `anon_${uuidv4()}`;
  const fallbackCode = id.replace(/^anon_/, '').split('-')[0].slice(0, 4).toUpperCase();
  const name =
    preferredName && VALID_ANON_NAME.test(String(preferredName))
      ? String(preferredName)
      : `Anon-${fallbackCode}`;
  return { id, name, isAnon: true };
}

async function resolveResponse(request, preferredId = null, preferredName = null) {
  const session = getSessionFromRequest(request);
  let anon = session.anon;
  let mintedToken = null;

  if (!anon) {
    anon = mintAnon(preferredId, preferredName);
    mintedToken = signAnonToken(anon);
  }

  let account = null;
  if (session.account) {
    const dbUser = await findUserById(session.account.id);
    if (dbUser) {
      account = {
        id: dbUser.id,
        name: dbUser.username,
        avatar: dbUser.avatar || null,
        isAnon: false,
      };
    }
  }

  const res = NextResponse.json(
    {
      account,
      anon,
      active: account || anon,
    },
    { headers: NO_STORE }
  );

  if (mintedToken) {
    attachAnonCookie(res, mintedToken);
  }

  // Upgrade existing Bearer-token clients into HttpOnly auth cookies seamlessly
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const hasAuthCookie = (request.headers.get('cookie') || '').includes(`${AUTH_COOKIE}=`);
  if (account && bearerToken && !hasAuthCookie) {
    attachAuthCookie(res, bearerToken);
  }

  return res;
}

export async function GET(request) {
  try {
    return await resolveResponse(request);
  } catch (err) {
    console.error('[api/session GET]', err);
    return NextResponse.json({ error: 'Session error' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    return await resolveResponse(request, body?.preferredAnonId, body?.preferredAnonName);
  } catch (err) {
    console.error('[api/session POST]', err);
    return NextResponse.json({ error: 'Session error' }, { status: 500, headers: NO_STORE });
  }
}
