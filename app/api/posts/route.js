import { NextResponse } from 'next/server';
import { getAllPosts, createPost } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const posts = await getAllPosts();
    return NextResponse.json({ posts });
  } catch (err) {
    console.error('[api/posts GET]', err);
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { authorId, authorName, authorAvatar, isAnon, content } = await request.json();
    const trimmed = String(content || '').trim();

    if (!trimmed) {
      return NextResponse.json({ error: 'Post cannot be empty' }, { status: 400 });
    }
    if (trimmed.length > 500) {
      return NextResponse.json({ error: 'Post cannot exceed 500 characters' }, { status: 400 });
    }
    if (!authorId || !authorName) {
      return NextResponse.json({ error: 'Author identity is required' }, { status: 400 });
    }

    const post = await createPost({
      id: uuidv4(),
      author_id: String(authorId),
      author_name: String(authorName).slice(0, 32),
      author_avatar: authorAvatar ? String(authorAvatar).slice(0, 24) : null,
      is_anon: Boolean(isAnon),
      content: trimmed,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error('[api/posts POST]', err);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
