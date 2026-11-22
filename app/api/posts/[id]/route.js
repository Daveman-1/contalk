import { NextResponse } from 'next/server';
import { deletePost } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');

    if (!authorId) {
      return NextResponse.json({ error: 'Author ID is required' }, { status: 400 });
    }

    const result = deletePost(id, authorId);
    if (result.status === 'not_found') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (result.status === 'forbidden') {
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 });
    }

    return NextResponse.json({ deleted: true, id });
  } catch (err) {
    console.error('[api/posts/[id] DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
