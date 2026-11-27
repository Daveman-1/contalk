import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How ConTalk handles anonymous sessions, optional accounts, cookies, messages, and safety reports.',
};

export default function PrivacyPage() {
  return (
    <div className="hero-canvas min-h-screen px-4 sm:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link href="/" className="btn-soft px-3.5 py-2 text-xs">
            ← Back to ConTalk
          </Link>
          <Link href="/guidelines" className="text-xs font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
            Community Guidelines →
          </Link>
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
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Last updated: November 2026 · Placeholder privacy policy for review before general public launch.
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              1. Minimal Data Collection
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              ConTalk does not require your email address, phone number, or real name. You can use ConTalk immediately with an auto-generated anonymous handle (<code>Anon-XXXX</code>), or optionally register a username and password (stored hashed with bcrypt).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              2. Essential Cookies &amp; Local Storage
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              We use signed <code>HttpOnly</code> session cookies strictly to verify your anonymous or signed-in identity and protect private Direct Messages and Random Chats from unauthorized access. Your browser&apos;s local storage holds theme preference, sound notification preference, and avatar selection.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              3. Messages, Posts &amp; Retention
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <li><strong>Random Chats</strong> are ephemeral and expire automatically after 1 hour.</li>
              <li><strong>Online Presence</strong> expires automatically within ~18 seconds after you leave or close your tab.</li>
              <li><strong>Public Feed Posts</strong> can be deleted by their author at any time.</li>
              <li><strong>Safety Reports &amp; Block Lists</strong> are stored to enforce blocks and review reported abuse.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              4. Third-Party Services
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              ConTalk uses GIPHY for GIF/sticker search and Google reCAPTCHA on signup and safety gates to prevent automated abuse.
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
