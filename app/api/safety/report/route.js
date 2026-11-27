import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSessionFromRequest } from '@/lib/auth';
import { createReport, blockUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session.active) {
      return NextResponse.json({ error: 'Session required' }, { status: 401 });
    }

    const { targetId, targetName, contextType, contextId, reason, details, alsoBlock } =
      await request.json();

    if (!targetId || !reason) {
      return NextResponse.json({ error: 'targetId and reason are required' }, { status: 400 });
    }
    if (session.allowedIds.has(String(targetId))) {
      return NextResponse.json({ error: 'You cannot report yourself' }, { status: 400 });
    }

    const report = await createReport({
      id: uuidv4(),
      reporterId: session.active.id,
      reporterName: session.active.name,
      targetId: String(targetId),
      targetName: targetName || 'User',
      contextType: contextType || 'user',
      contextId: contextId || null,
      reason: String(reason),
      details: details || '',
    });

    let blocked = null;
    if (alsoBlock) {
      blocked = await blockUser(session.active.id, String(targetId), targetName || 'User');
    }

    return NextResponse.json({ ok: true, reportId: report.id, blocked }, { status: 201 });
  } catch (err) {
    console.error('[api/safety/report POST]', err);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
