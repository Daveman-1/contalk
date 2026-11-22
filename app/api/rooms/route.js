import { NextResponse } from 'next/server';
import { getAllRooms, findRoomBySlug, createRoom } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rooms = getAllRooms();
    return NextResponse.json({ rooms });
  } catch (err) {
    console.error('[api/rooms GET]', err);
    return NextResponse.json({ error: 'Failed to load rooms' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, description, icon, createdBy } = await request.json();
    const trimmedName = String(name || '').trim();
    const trimmedDesc = String(description || '').trim().slice(0, 140);

    if (trimmedName.length < 2 || trimmedName.length > 32) {
      return NextResponse.json({ error: 'Room name must be 2–32 characters' }, { status: 400 });
    }

    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      return NextResponse.json({ error: 'Room name must contain letters or numbers' }, { status: 400 });
    }

    if (findRoomBySlug(slug)) {
      return NextResponse.json({ error: 'A room with a similar name already exists' }, { status: 409 });
    }

    const room = createRoom({
      id: `room_${uuidv4().slice(0, 8)}`,
      name: trimmedName,
      slug,
      description: trimmedDesc || 'Public chat room',
      icon: String(icon || '💬').slice(0, 4),
      created_by: String(createdBy || 'Anonymous').slice(0, 32),
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (err) {
    console.error('[api/rooms POST]', err);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
