import { NextResponse } from 'next/server';
import { findUserByUsername } from '@/lib/db';
import { signToken, attachAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = signToken({ id: user.id, username: user.username, kind: 'account' });

    const res = NextResponse.json({
      token,
      user: { id: user.id, username: user.username, avatar: user.avatar || null },
    });
    attachAuthCookie(res, token);
    return res;
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
