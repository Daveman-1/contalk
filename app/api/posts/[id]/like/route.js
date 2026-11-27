import { NextResponse } from 'next/server';
import { togglePostLike } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const post = await togglePostLike(id, session.active.id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (err) {
    console.error('[api/posts/[id]/like POST]', err);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
