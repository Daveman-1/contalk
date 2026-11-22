import { NextResponse } from 'next/server';
import { setTyping } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { roomId, userId, userName, isTyping } = await request.json();
    if (!roomId || !userId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await setTyping({
      roomId: String(roomId),
      userId: String(userId),
      userName: String(userName || 'Someone'),
      isTyping: Boolean(isTyping),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
