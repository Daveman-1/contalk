import { NextResponse } from 'next/server';
import { getAllPosts, createPost } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { checkContentSafety } from '@/lib/moderation';
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
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ error: 'Session required' }, { status: 401 });
    }

    const { authorAvatar, isAnon, content } = await request.json();
    const safety = checkContentSafety(content, { maxLength: 500 });
    if (!safety.ok) {
      return NextResponse.json({ error: safety.reason }, { status: 400 });
    }

    // Preserve signed-in users' "Post anonymously" toggle using their verified anon token
    const effective = Boolean(isAnon) && session.anon ? session.anon : session.active;

    const post = await createPost({
      id: uuidv4(),
      author_id: effective.id,
      author_name: String(effective.name).slice(0, 32),
      author_avatar: authorAvatar ? String(authorAvatar).slice(0, 24) : null,
      is_anon: effective.isAnon,
      content: String(content).trim(),
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error('[api/posts POST]', err);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
