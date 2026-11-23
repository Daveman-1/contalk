import { NextResponse } from 'next/server';
import { heartbeatPresence, removePresence, getOnlineState, getStorageInfo } from '@/lib/db';

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
    const body = await request.json();
    if (body?.action === 'leave') {
      const state = await removePresence(body.id);
      return NextResponse.json({ ...state, ...getStorageInfo() }, { headers: NO_STORE_HEADERS });
    }

    const state = await heartbeatPresence({
      id: body.id,
      name: body.name,
      isAnon: body.isAnon,
      avatar: body.avatar,
      activeRoomId: body.activeRoomId || null,
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
