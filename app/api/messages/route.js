import { NextResponse } from 'next/server';
import {
  getMessagesByRoom,
  saveMessage,
  getTypingUsers,
  pushInboxEvent,
  getRandomRoomForUser,
  isBlockedBetween,
} from '@/lib/db';
import {
  getSessionFromRequest,
  isDmParticipant,
  getDmOtherParticipant,
} from '@/lib/auth';
import { checkContentSafety } from '@/lib/moderation';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

async function verifyRoomAccess(roomId, session) {
  const r = String(roomId || '');
  if (!r || !session?.active) return false;
  if (r.startsWith('chatroom:')) return true;
  if (r.includes('__dm__')) return isDmParticipant(r, session);
  if (r.startsWith('random_')) {
    const activeRandomRoom = await getRandomRoomForUser(session.active.id);
    return activeRandomRoom === r;
  }
  return false;
}

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    if (!roomId) {
      return NextResponse.json({ messages: [], typingUsers: [] }, { headers: NO_STORE });
    }

    const allowed = await verifyRoomAccess(roomId, session);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden room access' }, { status: 403, headers: NO_STORE });
    }

    const [messages, typingUsers] = await Promise.all([
      getMessagesByRoom(roomId, 150),
      getTypingUsers(roomId, session.active.id),
    ]);
    return NextResponse.json({ messages, typingUsers }, { headers: NO_STORE });
  } catch (err) {
    console.error('[api/messages GET]', err);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, recipientId, content, senderAvatar } = await request.json();
    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    const allowed = await verifyRoomAccess(roomId, session);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden room access' }, { status: 403 });
    }

    const safety = checkContentSafety(content, { maxLength: 1000 });
    if (!safety.ok) {
      return NextResponse.json({ error: safety.reason }, { status: 400 });
    }

    const trimmed = String(content || '').trim();
    const senderId = session.active.id;
    const senderName = session.active.name;

    // For private DMs, verify neither party has blocked the other
    let resolvedRecipientId = null;
    if (String(roomId).includes('__dm__')) {
      resolvedRecipientId = getDmOtherParticipant(roomId, senderId) || (recipientId ? String(recipientId) : null);
      if (resolvedRecipientId && (await isBlockedBetween(senderId, resolvedRecipientId))) {
        return NextResponse.json(
          { error: 'Unable to send message — one of you has blocked the other.' },
          { status: 403 }
        );
      }
    }

    const message = await saveMessage({
      id: uuidv4(),
      room_id: String(roomId),
      sender: String(senderName).slice(0, 32),
      sender_id: String(senderId),
      sender_avatar: senderAvatar ? String(senderAvatar).slice(0, 24) : null,
      content: trimmed,
    });

    // If this is a direct message, push into recipient's inbox for real-time notifications
    if (resolvedRecipientId && resolvedRecipientId !== senderId) {
      await pushInboxEvent(resolvedRecipientId, {
        id: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        sender: message.sender,
        senderAvatar: message.senderAvatar,
        content: message.content,
        timestamp: message.timestamp,
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error('[api/messages POST]', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
