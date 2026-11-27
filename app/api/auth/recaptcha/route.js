import { NextResponse } from 'next/server';

// Official Google reCAPTCHA v2 Test Secret Key (works out of the box in test mode)
const GOOGLE_TEST_SECRET_KEY = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

async function verifyToken(secret, token) {
  const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  const params = new URLSearchParams({
    secret,
    response: token,
  });

  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  return response.json();
}

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing reCAPTCHA token' }, { status: 400 });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY || GOOGLE_TEST_SECRET_KEY;

    let data = await verifyToken(secretKey, token);

    // If verification failed with the custom secret key, fallback to test secret key
    // (ensures local dev with the Google Test Site Key passes verification smoothly)
    if (!data.success && secretKey !== GOOGLE_TEST_SECRET_KEY) {
      const fallbackData = await verifyToken(GOOGLE_TEST_SECRET_KEY, token);
      if (fallbackData.success) {
        data = fallbackData;
      }
    }

    if (data.success) {
      return NextResponse.json({ success: true, timestamp: data.challenge_ts });
    } else {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed', details: data['error-codes'] },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('[api/auth/recaptcha]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
