const GOOGLE_TEST_SECRET_KEY = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

async function callSiteVerify(secret, token) {
  const params = new URLSearchParams({
    secret,
    response: token,
  });

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  return response.json();
}

/**
 * Verifies a Google reCAPTCHA v2 token server-side.
 * In production with a real RECAPTCHA_SECRET_KEY set, the public Google test secret fallback is disabled.
 */
export async function verifyRecaptchaToken(token) {
  if (!token || typeof token !== 'string') {
    return { success: false, error: 'Missing reCAPTCHA verification token.' };
  }

  const configuredSecret = process.env.RECAPTCHA_SECRET_KEY || '';
  const secretToUse = configuredSecret || GOOGLE_TEST_SECRET_KEY;

  let data = await callSiteVerify(secretToUse, token);

  // Allow test-secret fallback ONLY outside production (for local dev on localhost)
  if (
    !data.success &&
    process.env.NODE_ENV !== 'production' &&
    secretToUse !== GOOGLE_TEST_SECRET_KEY
  ) {
    const fallbackData = await callSiteVerify(GOOGLE_TEST_SECRET_KEY, token);
    if (fallbackData.success) {
      data = fallbackData;
    }
  }

  if (data.success) {
    return { success: true, timestamp: data.challenge_ts };
  }

  return {
    success: false,
    error: 'reCAPTCHA verification failed. Please complete the check again.',
    details: data['error-codes'] || [],
  };
}
