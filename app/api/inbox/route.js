import { NextResponse } from 'next/server';
import { getInboxEvents } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ events: [] });
    const events = await getInboxEvents(userId);
    return NextResponse.json({ events });
  } catch (err) {
    console.error('[api/inbox GET]', err);
    return NextResponse.json({ events: [] });
  }
}
