import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service',
  description: 'ConTalk Terms of Service (draft placeholder pending legal review).',
};

export default function TermsPage() {
  return (
    <div className="hero-canvas min-h-screen px-4 sm:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link href="/" className="btn-soft px-3.5 py-2 text-xs">
            ← Back to ConTalk
          </Link>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/guidelines" className="hover:underline" style={{ color: 'var(--brand-primary)' }}>
              Community Guidelines
            </Link>
            <Link href="/privacy" className="hover:underline" style={{ color: 'var(--brand-primary)' }}>
              Privacy Policy
            </Link>
          </div>
        </div>

        <article className="surface-card rounded-2xl p-6 sm:p-8 space-y-6">
          <header className="border-b pb-5" style={{ borderColor: 'var(--border-subtle)' }}>
            <span
              className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
              style={{ background: 'rgba(245, 158, 11, 0.16)', color: '#F59E0B' }}
            >
              Draft Placeholder — Pending Legal Review
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Last updated: November 2026 · Placeholder terms for review before general public launch.
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              1. Eligibility &amp; Acceptance
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              By accessing or using ConTalk, you confirm that you are at least 18 years old (or the age of majority in your jurisdiction) and agree to follow these Terms of Service and our{' '}
              <Link href="/guidelines" className="underline" style={{ color: 'var(--brand-primary)' }}>
                Community Guidelines
              </Link>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              2. Acceptable Use
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              You agree not to use ConTalk for illegal activity, harassment, hate speech, spam, automated scraping/botting, or impersonation. Accounts and anonymous sessions violating these rules may be restricted or blocked.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              3. User Content &amp; Availability
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              You are responsible for any messages or posts you submit. ConTalk is provided &ldquo;as is&rdquo; without warranties of uninterrupted uptime or permanent message storage.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              4. Reporting Problems
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Use the in-app Report &amp; Block buttons across chats, rooms, random matches, and feed posts, or review our{' '}
              <Link href="/guidelines#safety" className="underline" style={{ color: 'var(--brand-primary)' }}>
                Safety &amp; Reporting Guide
              </Link>.
            </p>
          </section>

          <footer className="pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
            <span>ConTalk — Say it. Stay anonymous.</span>
            <nav className="flex flex-wrap items-center gap-4" aria-label="Legal and safety links">
              <Link href="/terms" className="hover:underline">Terms</Link>
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link href="/guidelines" className="hover:underline">Community Guidelines</Link>
              <Link href="/guidelines#safety" className="hover:underline">Report a problem</Link>
            </nav>
          </footer>
        </article>
      </div>
    </div>
  );
}
