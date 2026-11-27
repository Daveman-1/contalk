import { NextResponse } from 'next/server';
import { findUserByUsername, createUser } from '@/lib/db';
import { signToken, attachAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      return NextResponse.json({ error: 'Username must be 3–20 characters' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const sanitized = trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized !== trimmed) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' }, { status: 400 });
    }

    if (sanitized.toLowerCase().startsWith('anon-')) {
      return NextResponse.json({ error: 'Username cannot start with "Anon-"' }, { status: 400 });
    }

    const existing = await findUserByUsername(sanitized);
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const user = await createUser({ id, username: sanitized, password_hash });
    const token = signToken({ id: user.id, username: user.username, kind: 'account' });

    const res = NextResponse.json(
      { token, user: { id: user.id, username: user.username, avatar: user.avatar || null } },
      { status: 201 }
    );
    attachAuthCookie(res, token);
    return res;
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
