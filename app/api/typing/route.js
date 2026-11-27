import { NextResponse } from 'next/server';
import { setTyping, getRandomRoomForUser } from '@/lib/db';
import { getSessionFromRequest, isDmParticipant } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { roomId, isTyping } = await request.json();
    if (!roomId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const r = String(roomId);
    const allowed =
      r.startsWith('chatroom:') ||
      (r.includes('__dm__') && isDmParticipant(r, session)) ||
      (r.startsWith('random_') && (await getRandomRoomForUser(session.active.id)) === r);

    if (!allowed) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    await setTyping({
      roomId: r,
      userId: session.active.id,
      userName: session.active.name,
      isTyping: Boolean(isTyping),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
