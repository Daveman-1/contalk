import { NextResponse } from 'next/server';
import { getInboxEvents } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ events: [] }, { headers: NO_STORE });
    }
    const events = await getInboxEvents(session.active.id);
    return NextResponse.json({ events }, { headers: NO_STORE });
  } catch (err) {
    console.error('[api/inbox GET]', err);
    return NextResponse.json({ events: [] }, { headers: NO_STORE });
  }
}
