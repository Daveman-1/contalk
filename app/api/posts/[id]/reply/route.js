import { NextResponse } from 'next/server';
import { addPostReply } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { authorId, authorName, authorAvatar, isAnon, content } = await request.json();
    const trimmed = String(content || '').trim();

    if (!trimmed) {
      return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 });
    }
    if (trimmed.length > 300) {
      return NextResponse.json({ error: 'Reply cannot exceed 300 characters' }, { status: 400 });
    }
    if (!authorId || !authorName) {
      return NextResponse.json({ error: 'Author identity is required' }, { status: 400 });
    }

    const result = addPostReply(id, {
      id: uuidv4(),
      author_id: String(authorId),
      author_name: String(authorName).slice(0, 32),
      author_avatar: authorAvatar ? String(authorAvatar).slice(0, 24) : null,
      is_anon: Boolean(isAnon),
      content: trimmed,
    });

    if (!result) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[api/posts/[id]/reply POST]', err);
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
  }
}
