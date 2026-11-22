import { NextResponse } from 'next/server';
import {
  joinRandomQueue,
  leaveRandomChat,
  getRandomStatus,
  saveMessage,
  setTyping,
} from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ session: { status: 'idle' }, messages: [], isPartnerTyping: false, queueCounts: { male: 0, female: 0 } });
    }
    const data = await getRandomStatus(userId);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[api/random GET]', err);
    return NextResponse.json({ error: 'Failed to read random chat status' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, userId } = body;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (action === 'join') {
      const result = await joinRandomQueue({
        userId: String(userId),
        name: String(body.name || 'Stranger'),
        isAnon: Boolean(body.isAnon),
        avatar: body.avatar || null,
        gender: body.gender,
        lookingFor: body.lookingFor,
      });
      return NextResponse.json(result);
    }

    if (action === 'skip') {
      if (body.requeue) {
        const result = await joinRandomQueue({
          userId: String(userId),
          name: String(body.name || 'Stranger'),
          isAnon: Boolean(body.isAnon),
          avatar: body.avatar || null,
          gender: body.gender,
          lookingFor: body.lookingFor,
        });
        return NextResponse.json(result);
      }
      const result = await leaveRandomChat(String(userId));
      return NextResponse.json(result);
    }

    if (action === 'leave') {
      const result = await leaveRandomChat(String(userId));
      return NextResponse.json(result);
    }

    if (action === 'message') {
      const trimmed = String(body.content || '').trim();
      if (!trimmed || !body.roomId) {
        return NextResponse.json({ error: 'roomId and content required' }, { status: 400 });
      }
      const message = await saveMessage({
        id: uuidv4(),
        room_id: String(body.roomId),
        sender: String(body.sender || 'Stranger'),
        sender_id: String(userId),
        sender_avatar: body.senderAvatar || null,
        content: trimmed,
      });
      return NextResponse.json({ message }, { status: 201 });
    }

    if (action === 'typing') {
      if (body.roomId) {
        await setTyping({
          roomId: String(body.roomId),
          userId: String(userId),
          userName: String(body.sender || 'Stranger'),
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
