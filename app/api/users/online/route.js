import { NextResponse } from 'next/server';
import { getOnlineState } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { onlineUsers } = await getOnlineState();
    return NextResponse.json({ users: onlineUsers });
  } catch (err) {
    console.error('[api/users/online]', err);
    return NextResponse.json({ users: [] });
  }
}
