import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = getAllUsers();
    return NextResponse.json({ users });
  } catch (err) {
    console.error('[api/users]', err);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}
