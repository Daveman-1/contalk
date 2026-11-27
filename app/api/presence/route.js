import { NextResponse } from 'next/server';
import { heartbeatPresence, removePresence, getOnlineState, getStorageInfo } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    const state = await getOnlineState();
    return NextResponse.json({ ...state, ...getStorageInfo() }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error('[api/presence GET]', err);
    return NextResponse.json(
      { onlineUsers: [], roomPresence: {}, ...getStorageInfo() },
      { headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    const body = await request.json().catch(() => ({}));

    if (body?.action === 'leave') {
      const targetId = body.id ? String(body.id) : session.active?.id;
      // Only allow removing IDs belonging to the caller's verified session
      if (targetId && session.allowedIds.has(targetId)) {
        const state = await removePresence(targetId);
        return NextResponse.json({ ...state, ...getStorageInfo() }, { headers: NO_STORE_HEADERS });
      }
      const state = await getOnlineState();
      return NextResponse.json({ ...state, ...getStorageInfo() }, { headers: NO_STORE_HEADERS });
    }

    if (!session.active) {
      const state = await getOnlineState();
      return NextResponse.json({ ...state, ...getStorageInfo() }, { headers: NO_STORE_HEADERS });
    }

    const state = await heartbeatPresence({
      id: session.active.id,
      name: session.active.name,
      isAnon: session.active.isAnon,
      avatar: body.avatar ? String(body.avatar).slice(0, 24) : null,
      activeRoomId: body.activeRoomId ? String(body.activeRoomId).slice(0, 64) : null,
    });
    return NextResponse.json({ ...state, ...getStorageInfo() }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error('[api/presence POST]', err);
    return NextResponse.json(
      { onlineUsers: [], roomPresence: {}, ...getStorageInfo() },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
