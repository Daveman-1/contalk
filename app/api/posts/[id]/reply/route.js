import { NextResponse } from 'next/server';
import { addPostReply } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { checkContentSafety } from '@/lib/moderation';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ error: 'Session required' }, { status: 401 });
    }

    const { id } = params;
    const { authorAvatar, isAnon, content } = await request.json();
    const safety = checkContentSafety(content, { maxLength: 300 });
    if (!safety.ok) {
      return NextResponse.json({ error: safety.reason }, { status: 400 });
    }

    const effective = Boolean(isAnon) && session.anon ? session.anon : session.active;

    const result = await addPostReply(id, {
      id: uuidv4(),
      author_id: effective.id,
      author_name: String(effective.name).slice(0, 32),
      author_avatar: authorAvatar ? String(authorAvatar).slice(0, 24) : null,
      is_anon: effective.isAnon,
      content: String(content).trim(),
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
