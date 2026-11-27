'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import VerificationModal, { isSafetyVerified } from '@/components/VerificationModal';

// Pages that should remain directly readable/usable without the entry gate overlay
const EXEMPT_PATHS = ['/guidelines', '/privacy', '/login', '/signup'];

export default function GlobalSafetyGate() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isExempt = EXEMPT_PATHS.some(
    (p) => pathname === p || pathname?.startsWith(`${p}/`)
  );

  useEffect(() => {
    if (isExempt) {
      setOpen(false);
      return;
    }

    const sync = () => {
      setOpen(!isSafetyVerified());
    };
    sync();

    window.addEventListener('auth_change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth_change', sync);
      window.removeEventListener('storage', sync);
    };
  }, [isExempt, pathname]);

  if (!open || isExempt) return null;

  return (
    <VerificationModal
      isOpen={open}
      onComplete={() => {
        setOpen(false);
      }}
    />
  );
}
