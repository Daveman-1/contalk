import { NextResponse } from 'next/server';
import { updateUserAvatar } from '@/lib/db';
import { isValidAvatarId } from '@/lib/avatars';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.account) {
      return NextResponse.json({ error: 'Account sign-in required' }, { status: 401 });
    }

    const { avatar } = await request.json();
    if (!isValidAvatarId(avatar)) {
      return NextResponse.json({ error: 'Valid avatar is required' }, { status: 400 });
    }
    const updated = await updateUserAvatar(session.account.id, avatar);
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('[api/users/avatar]', err);
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
  }
}
