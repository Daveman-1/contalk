import Link from 'next/link';

export const metadata = {
  title: 'Community Guidelines & Terms',
  description: 'ConTalk community rules, 18+ eligibility, terms of use, and how blocking and reporting work.',
};

export default function GuidelinesPage() {
  return (
    <div className="hero-canvas min-h-screen px-4 sm:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link href="/" className="btn-soft px-3.5 py-2 text-xs">
            ← Back to ConTalk
          </Link>
          <Link href="/privacy" className="text-xs font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
            Privacy Policy →
          </Link>
        </div>

        <article className="surface-card rounded-2xl p-6 sm:p-8 space-y-6">
          <header className="border-b pb-5" style={{ borderColor: 'var(--border-subtle)' }}>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Community Guidelines &amp; Terms of Use
            </h1>
            <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Last updated: November 2026 · Applies to all anonymous visitors and registered accounts on ConTalk.
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              1. Age Requirement (18+)
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              You must be at least 18 years old (or the age of legal majority in your jurisdiction) to create an account or participate in Random Chat and public conversations on ConTalk.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              2. Respect &amp; Zero-Tolerance Conduct
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <li>No harassment, threats, bullying, hate speech, or slurs.</li>
              <li>No illegal content, non-consensual sharing, doxxing, or impersonation.</li>
              <li>No spam, phishing links, scams, or automated bot flooding.</li>
              <li>No recording or redistributing private conversations without mutual consent.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              3. No User Photo Uploads
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              To protect everyone&apos;s safety, ConTalk does not accept user photo or file uploads. Conversations use text, curated GIPHY GIFs &amp; stickers, and built-in illustrated avatars only.
            </p>
          </section>

          <section id="safety" className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              4. Blocking &amp; Reporting Abuse
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Every Direct Message, Random Chat, Group Room member list, and Public Feed post includes one-tap <strong>Report</strong> and <strong>Block</strong> controls. Blocking immediately hides that user&apos;s messages and posts, ends active random chats, and prevents future random matches with them. You can review or unblock users anytime from the <strong>Blocked Users</strong> panel in the sidebar.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              5. Enforcement
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Automated safety filters reject severe abusive language and link spam in real time. ConTalk reserves the right to remove content or restrict accounts that violate these guidelines.
            </p>
          </section>

          <footer className="pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
            <span>ConTalk — Say it. Stay anonymous.</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link href="/signup" className="hover:underline">Create Account</Link>
              <Link href="/" className="hover:underline">Home</Link>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
