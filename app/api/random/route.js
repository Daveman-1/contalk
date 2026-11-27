import { NextResponse } from 'next/server';
import {
  joinRandomQueue,
  leaveRandomChat,
  getRandomStatus,
  getRandomRoomForUser,
  saveMessage,
  setTyping,
} from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { checkContentSafety } from '@/lib/moderation';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json(
        {
          session: { status: 'idle' },
          messages: [],
          isPartnerTyping: false,
          queueCounts: { male: 0, female: 0 },
        },
        { headers: NO_STORE }
      );
    }
    const data = await getRandomStatus(session.active.id);
    return NextResponse.json(data, { headers: NO_STORE });
  } catch (err) {
    console.error('[api/random GET]', err);
    return NextResponse.json({ error: 'Failed to read random chat status' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ error: 'Session required' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;
    const userId = session.active.id;
    const userName = session.active.name;
    const isAnon = session.active.isAnon;

    if (action === 'join') {
      const result = await joinRandomQueue({
        userId,
        name: userName,
        isAnon,
        avatar: body.avatar || null,
        gender: body.gender,
        lookingFor: body.lookingFor,
      });
      return NextResponse.json(result);
    }

    if (action === 'skip') {
      if (body.requeue) {
        const result = await joinRandomQueue({
          userId,
          name: userName,
          isAnon,
          avatar: body.avatar || null,
          gender: body.gender,
          lookingFor: body.lookingFor,
        });
        return NextResponse.json(result);
      }
      const result = await leaveRandomChat(userId);
      return NextResponse.json(result);
    }

    if (action === 'leave') {
      const result = await leaveRandomChat(userId);
      return NextResponse.json(result);
    }

    if (action === 'message') {
      const activeRoomId = await getRandomRoomForUser(userId);
      if (!activeRoomId || (body.roomId && String(body.roomId) !== activeRoomId)) {
        return NextResponse.json({ error: 'No active random chat session' }, { status: 403 });
      }
      const safety = checkContentSafety(body.content, { maxLength: 1000 });
      if (!safety.ok) {
        return NextResponse.json({ error: safety.reason }, { status: 400 });
      }
      const message = await saveMessage({
        id: uuidv4(),
        room_id: activeRoomId,
        sender: userName,
        sender_id: userId,
        sender_avatar: body.senderAvatar ? String(body.senderAvatar).slice(0, 24) : null,
        content: String(body.content).trim(),
      });
      return NextResponse.json({ message }, { status: 201 });
    }

    if (action === 'typing') {
      const activeRoomId = await getRandomRoomForUser(userId);
      if (activeRoomId) {
        await setTyping({
          roomId: activeRoomId,
          userId,
          userName,
          isTyping: Boolean(body.isTyping),
        });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[api/random POST]', err);
    return NextResponse.json({ error: 'Random chat error' }, { status: 500 });
  }
}
