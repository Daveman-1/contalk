import { NextResponse } from 'next/server';
import { getMessagesByRoom, saveMessage, getTypingUsers, pushInboxEvent } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const myId = searchParams.get('myId') || '';
    if (!roomId) {
      return NextResponse.json({ messages: [], typingUsers: [] });
    }
    const [messages, typingUsers] = await Promise.all([
      getMessagesByRoom(roomId, 150),
      getTypingUsers(roomId, myId),
    ]);
    return NextResponse.json(
      { messages, typingUsers },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err) {
    console.error('[api/messages GET]', err);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { roomId, recipientId, content, sender, senderId, senderAvatar } = await request.json();
    const trimmed = String(content || '').trim();
    if (!trimmed || !roomId || !senderId) {
      return NextResponse.json({ error: 'roomId, senderId, and content are required' }, { status: 400 });
    }

    const message = await saveMessage({
      id: uuidv4(),
      room_id: String(roomId),
      sender: String(sender || 'Anonymous').slice(0, 32),
      sender_id: String(senderId),
      sender_avatar: senderAvatar ? String(senderAvatar).slice(0, 24) : null,
      content: trimmed,
    });

    // If this is a direct message, push into recipient's inbox for real-time notifications
    if (recipientId && String(recipientId) !== String(senderId)) {
      await pushInboxEvent(String(recipientId), {
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
