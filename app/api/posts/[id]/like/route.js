import { NextResponse } from 'next/server';
import { togglePostLike } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const post = await togglePostLike(id, String(userId));
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (err) {
    console.error('[api/posts/[id]/like POST]', err);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
