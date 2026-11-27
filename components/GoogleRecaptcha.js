'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

// Official Google reCAPTCHA v2 Test Key (Google-approved, works on localhost without domain checks)
const GOOGLE_TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function GoogleRecaptcha({
  onVerify,
  onExpire,
  className = '',
}) {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [renderError, setRenderError] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local')) {
        setIsLocalhost(true);
      }
    }
  }, []);

  // On localhost, default to the official Google Test Key to prevent "Localhost is not in the list of supported domains"
  // On production (e.g. contalk.vercel.app), use the real live key from environment variables
  const siteKey = isLocalhost
    ? (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY_DEV || GOOGLE_TEST_SITE_KEY)
    : (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || GOOGLE_TEST_SITE_KEY);

  // 1. Load the Google reCAPTCHA explicit script once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.grecaptcha && window.grecaptcha.render) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = 'google-recaptcha-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => setScriptLoaded(true));
        } else {
          setScriptLoaded(true);
        }
      };
      script.onerror = () => setRenderError(true);
      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.render) {
          clearInterval(checkInterval);
          setScriptLoaded(true);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, []);

  // 2. Render the reCAPTCHA widget into containerRef
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.grecaptcha) return;

    try {
      // Clear previous widget if any
      containerRef.current.innerHTML = '';

      const widgetId = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        theme: theme === 'dark' ? 'dark' : 'light',
        callback: (token) => {
          if (onVerify) onVerify(token);
        },
        'expired-callback': () => {
          if (onExpire) onExpire();
        },
        'error-callback': () => {
          setRenderError(true);
        },
      });

      widgetIdRef.current = widgetId;
    } catch (err) {
      // If already rendered or error occurred
      console.warn('[reCAPTCHA render]', err);
    }

    return () => {
      widgetIdRef.current = null;
    };
  }, [scriptLoaded, siteKey, theme]);

  return (
    <div className={`flex flex-col items-center justify-center my-1 select-none max-w-full overflow-hidden ${className}`}>
      <div className="w-full flex items-center justify-center overflow-x-auto py-0.5">
        <div
          ref={containerRef}
          className="min-h-[78px] min-w-[304px] flex items-center justify-center rounded-lg origin-center scale-[0.92] sm:scale-100 transition-transform"
        >
          {!scriptLoaded && !renderError && (
            <div
              className="w-[304px] h-[78px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-center text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              Loading reCAPTCHA...
            </div>
          )}
        </div>
      </div>

      {renderError && (
        <p className="text-xs text-rose-400 mt-1">
          Could not load reCAPTCHA. Check your network or site key.
        </p>
      )}
    </div>
  );
}
