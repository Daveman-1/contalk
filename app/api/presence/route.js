import { NextResponse } from 'next/server';
import { heartbeatPresence, getOnlineState, getStorageInfo } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getOnlineState();
    return NextResponse.json({ ...state, ...getStorageInfo() });
  } catch (err) {
    console.error('[api/presence GET]', err);
    return NextResponse.json({ onlineUsers: [], roomPresence: {}, ...getStorageInfo() });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const state = await heartbeatPresence({
      id: body.id,
      name: body.name,
      isAnon: body.isAnon,
      avatar: body.avatar,
      activeRoomId: body.activeRoomId || null,
    });
    return NextResponse.json({ ...state, ...getStorageInfo() });
  } catch (err) {
    console.error('[api/presence POST]', err);
    return NextResponse.json({ onlineUsers: [], roomPresence: {}, ...getStorageInfo() }, { status: 500 });
  }
}
