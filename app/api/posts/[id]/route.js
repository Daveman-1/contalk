import { NextResponse } from 'next/server';
import { deletePost } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Try each verified ID belonging to the caller (account + anon)
    let lastResult = { status: 'forbidden' };
    for (const allowedId of session.allowedIds) {
      const result = await deletePost(id, allowedId);
      if (result.status === 'deleted') {
        return NextResponse.json({ deleted: true, id });
      }
      if (result.status === 'not_found') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      lastResult = result;
    }

    return NextResponse.json(
      { error: lastResult.status === 'not_found' ? 'Post not found' : 'You can only delete your own posts' },
      { status: lastResult.status === 'not_found' ? 404 : 403 }
    );
  } catch (err) {
    console.error('[api/posts/[id] DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
