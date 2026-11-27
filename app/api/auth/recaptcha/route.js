import { NextResponse } from 'next/server';
import { verifyRecaptchaToken } from '@/lib/recaptcha';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { token } = await req.json();
    const result = await verifyRecaptchaToken(token);

    if (result.success) {
      return NextResponse.json({ success: true, timestamp: result.timestamp });
    }
    return NextResponse.json(
      { error: result.error || 'reCAPTCHA verification failed', details: result.details },
      { status: 400 }
    );
  } catch (err) {
    console.error('[api/auth/recaptcha]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
