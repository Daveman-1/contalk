import { NextResponse } from 'next/server';
import { updateUserAvatar } from '@/lib/db';
import { isValidAvatarId } from '@/lib/avatars';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { userId, avatar } = await request.json();
    if (!userId || !isValidAvatarId(avatar)) {
      return NextResponse.json({ error: 'Valid userId and avatar are required' }, { status: 400 });
    }
    const updated = updateUserAvatar(String(userId), avatar);
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('[api/users/avatar]', err);
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
  }
}
