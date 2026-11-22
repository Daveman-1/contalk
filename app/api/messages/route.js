import { NextResponse } from 'next/server';
import { getMessagesByRoom } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    if (!roomId) {
      return NextResponse.json({ messages: [] });
    }
    const messages = getMessagesByRoom(roomId, 150);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[api/messages]', err);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}
