import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getBlockedUsers, blockUser, unblockUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ blocked: [] }, { headers: NO_STORE });
    }

    // Merge blocks across active + anon IDs so switching auth keeps your blocklist
    const lists = await Promise.all(
      Array.from(session.allowedIds).map((id) => getBlockedUsers(id))
    );
    const byId = new Map();
    for (const list of lists) {
      for (const item of list) {
        if (item?.id && !byId.has(item.id)) byId.set(item.id, item);
      }
    }

    return NextResponse.json({ blocked: Array.from(byId.values()) }, { headers: NO_STORE });
  } catch (err) {
    console.error('[api/safety/block GET]', err);
    return NextResponse.json({ blocked: [] }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ error: 'Session required' }, { status: 401 });
    }
    const { targetId, targetName } = await request.json();
    if (!targetId || session.allowedIds.has(String(targetId))) {
      return NextResponse.json({ error: 'Valid targetId is required' }, { status: 400 });
    }

    const blocked = await blockUser(session.active.id, String(targetId), targetName || 'User');
    return NextResponse.json({ blocked }, { status: 200, headers: NO_STORE });
  } catch (err) {
    console.error('[api/safety/block POST]', err);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ error: 'Session required' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');
    if (!targetId) {
      return NextResponse.json({ error: 'targetId is required' }, { status: 400 });
    }

    // Remove from all caller IDs (account + anon)
    await Promise.all(
      Array.from(session.allowedIds).map((id) => unblockUser(id, String(targetId)))
    );
    const blocked = await getBlockedUsers(session.active.id);
    return NextResponse.json({ blocked }, { headers: NO_STORE });
  } catch (err) {
    console.error('[api/safety/block DELETE]', err);
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
  }
}
