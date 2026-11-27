'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import FeedTimeline from '@/components/FeedTimeline';
import NotificationBell from '@/components/NotificationBell';
import ConTalkLogo from '@/components/ConTalkLogo';
import MobileBottomNav from '@/components/MobileBottomNav';
import UserAvatar from '@/components/UserAvatar';
import AvatarPickerModal from '@/components/AvatarPickerModal';
import { useNotifications } from '@/components/NotificationProvider';
import { SunIcon, MoonIcon } from '@/components/ThemeIcon';
import { useTheme } from '@/components/ThemeProvider';
import { getIdentity } from '@/lib/identity';
import { Home, Rss, MessageSquare, Hash, Shuffle, Plus } from 'lucide-react';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { onlineUsers, refreshPresence } = useNotifications();
  const [identity, setIdentity] = useState({ id: '', name: 'Anon', isAnon: true, avatar: 'cloud' });
  const [anonFallback, setAnonFallback] = useState({ id: '', name: 'Anon' });
  const [postText, setPostText] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusBanner, setStatusBanner] = useState('');
  const feedSectionRef = useRef(null);

  const onlineCount = onlineUsers.length;

  useEffect(() => {
    const sync = () => {
      const idObj = getIdentity();
      setIdentity(idObj);
      setAnonFallback({
        id: localStorage.getItem('ct_anon_id') || idObj.id,
        name: localStorage.getItem('ct_anon_name') || 'Anon',
      });
    };
    sync();
    window.addEventListener('auth_change', sync);
    return () => window.removeEventListener('auth_change', sync);
  }, []);

  const effectiveAuthor =
    !identity.isAnon && postAnonymously
      ? { id: anonFallback.id || identity.id, name: anonFallback.name || 'Anon', avatar: identity.avatar, isAnon: true }
      : identity;

  const handlePublishPost = async (e) => {
    e?.preventDefault();
    const trimmed = postText.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setStatusBanner('');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: effectiveAuthor.id,
          authorName: effectiveAuthor.name,
          authorAvatar: effectiveAuthor.avatar,
          isAnon: effectiveAuthor.isAnon,
          content: trimmed,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPostText('');
        window.dispatchEvent(new CustomEvent('posts_changed', { detail: data.post }));
        setStatusBanner('Published to the Live Feed below!');
        setTimeout(() => setStatusBanner(''), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusBanner(err.error || 'Could not publish post.');
      }
    } catch {
      setStatusBanner('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('ct_token');
    localStorage.removeItem('ct_user');
    window.dispatchEvent(new Event('auth_change'));
    setIdentity(getIdentity());
  };

  return (
    <div className="min-h-screen flex hero-canvas">
      {/* Slim Labeled Left Icon Rail (Desktop) */}
      <aside
        className="hidden sm:flex fixed left-0 top-0 bottom-0 w-[76px] z-40 flex-col items-center justify-between py-4 border-r"
        style={{ background: 'var(--bg-rail)', borderColor: 'var(--border-subtle)' }}
      >
        <Link
          href="/"
          className="flex flex-col items-center gap-1 transition-transform hover:scale-105"
          title="ConTalk Home"
        >
          <ConTalkLogo variant="mark" size={38} cutoutColor={theme === 'dark' ? '#101120' : '#F7F7FC'} />
          <span className="text-[10px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            ConTalk
          </span>
        </Link>

        <nav className="flex flex-col items-center gap-1.5 w-full px-1.5">
          {[
            { href: '/', label: 'Home', title: 'Home', icon: Home, active: true },
            { href: '/feed', label: 'Feed', title: 'Posts Feed', icon: Rss, active: false },
            { href: '/browse', label: 'Chats', title: 'Direct Messages & People', icon: MessageSquare, active: false },
            { href: '/rooms', label: 'Rooms', title: 'Group Chat Rooms', icon: Hash, active: false },
            { href: '/random', label: 'Random', title: 'Random Male / Female Chat', icon: Shuffle, active: false },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                className="w-full py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group"
                style={{
                  background: item.active ? 'var(--bg-active)' : 'transparent',
                  color: item.active ? 'var(--brand-primary)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!item.active) e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (!item.active) e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = item.active ? 'var(--brand-primary)' : 'var(--text-secondary)';
                }}
              >
                <Icon size={18} strokeWidth={item.active ? 2.3 : 1.9} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={toggleTheme}
          className="w-[64px] py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={17} />}
          <span className="text-[10px] font-medium leading-none">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 sm:pl-[76px] flex flex-col min-w-0">
        {/* Top Floating Bar */}
        <header className="w-full px-4 sm:px-8 pt-4 sm:pt-5 flex items-center justify-between gap-2">
          <div className="flex sm:hidden items-center gap-2 min-w-0">
            <Link href="/" className="flex items-center gap-1.5" aria-label="ConTalk Home">
              <ConTalkLogo variant="mark" size={32} />
              <span className="font-extrabold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Con<span style={{ color: 'var(--brand-mint)' }}>Talk</span>
              </span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setAvatarModalOpen(true)}
            className="hidden sm:flex items-center gap-2 text-xs pl-1.5 pr-3 py-1 rounded-full transition-colors"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
            title="Click to change your avatar"
          >
            <UserAvatar avatar={identity.avatar} seed={identity.id} name={identity.name} size={24} />
            <span className="online-dot"></span>
            <span>{onlineCount > 0 ? `${onlineCount} online` : 'Live now'} · {identity.name}</span>
          </button>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center border"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={15} />}
            </button>
            <NotificationBell />
            {identity.isAnon ? (
              <Link href="/login">
                <button className="btn-cta px-3 sm:px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg">
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #5B4AE3, #12B89A)' }}
                  >
                    <Plus size={13} strokeWidth={2.8} />
                  </span>
                  <span>Sign In</span>
                  <span className="hidden sm:inline">/ Join</span>
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link href="/browse">
                  <button className="btn-cta px-3 sm:px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 shadow-lg max-w-[130px] sm:max-w-none">
                    <span className="online-dot"></span>
                    <span className="truncate">{identity.name}</span>
                  </button>
                </Link>
                <button onClick={handleLogout} className="hidden sm:inline-flex btn-soft px-3 py-2 text-xs">
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ─── COMPACT HERO + 3 REALISTIC CARDS ─────────────────────────────── */}
        <section className="flex flex-col items-center px-4 sm:px-8 pt-4 sm:pt-6 pb-6">
          <div className="flex flex-col items-center w-full max-w-5xl text-center">
            <div className="mb-3">
              <ConTalkLogo variant="full" size={148} showTagline={true} />
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-6 max-w-xl" style={{ color: 'var(--text-primary)' }}>
              Post, chat, or meet strangers.
            </h1>

            {/* 3 Vibrant Gradient Action Cards with Layered Photo Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 w-full">
              {/* Card 1: Post */}
              <Link
                href="/feed"
                className="card-grad-indigo relative rounded-2xl p-4 sm:p-5 h-[130px] sm:h-[142px] text-left overflow-hidden transition-all duration-200 hover:-translate-y-1 group"
              >
                <p className="text-white font-semibold text-sm sm:text-[15px] leading-snug max-w-[210px] sm:max-w-[150px] md:max-w-[190px] relative z-10 drop-shadow-sm">
                  Share a live post with everyone
                </p>
                <span className="inline-block mt-2 text-[11px] text-white/90 font-medium relative z-10">
                  Posts Feed →
                </span>
                <div className="absolute -bottom-4 right-5 w-24 h-20 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 rotate-[-14deg] transition-transform duration-300 group-hover:rotate-[-10deg]" />
                <div className="absolute -bottom-3 -right-2 w-28 h-[84px] sm:w-32 sm:h-[90px] rounded-xl overflow-hidden border-2 border-white/45 shadow-2xl rotate-[-6deg] transition-all duration-300 group-hover:rotate-[-1deg] group-hover:scale-105">
                  <img src="/images/card-post.jpg" alt="Share a live post" className="w-full h-full object-cover" />
                </div>
              </Link>

              {/* Card 2: Group Chat Rooms */}
              <Link
                href="/rooms"
                className="card-grad-sky relative rounded-2xl p-4 sm:p-5 h-[130px] sm:h-[142px] text-left overflow-hidden transition-all duration-200 hover:-translate-y-1 group"
              >
                <p className="text-white font-semibold text-sm sm:text-[15px] leading-snug max-w-[210px] sm:max-w-[150px] md:max-w-[190px] relative z-10 drop-shadow-sm">
                  Jump into live group chat rooms
                </p>
                <span className="inline-block mt-2 text-[11px] text-white/90 font-medium relative z-10">
                  Group Rooms →
                </span>
                <div className="absolute -bottom-4 right-5 w-24 h-20 rounded-xl bg-white/25 backdrop-blur-sm border border-white/35 rotate-[12deg] transition-transform duration-300 group-hover:rotate-[8deg]" />
                <div className="absolute -bottom-3 -right-2 w-28 h-[84px] sm:w-32 sm:h-[90px] rounded-xl overflow-hidden border-2 border-white/50 shadow-2xl rotate-[5deg] transition-all duration-300 group-hover:rotate-[1deg] group-hover:scale-105">
                  <img src="/images/card-group.jpg" alt="Group chat rooms" className="w-full h-full object-cover" />
                </div>
              </Link>

              {/* Card 3: Random People */}
              <Link
                href="/random"
                className="card-grad-prism relative rounded-2xl p-4 sm:p-5 h-[130px] sm:h-[142px] text-left overflow-hidden transition-all duration-200 hover:-translate-y-1 group"
              >
                <p className="text-white font-semibold text-sm sm:text-[15px] leading-snug max-w-[210px] sm:max-w-[150px] md:max-w-[190px] relative z-10 drop-shadow-sm">
                  Match with random people live
                </p>
                <span className="inline-block mt-2 text-[11px] text-white/95 font-medium relative z-10 drop-shadow-sm">
                  Male / Female · Skip →
                </span>
                <div className="absolute -bottom-4 right-5 w-24 h-20 rounded-xl bg-black/20 backdrop-blur-sm border border-white/30 rotate-[-12deg] transition-transform duration-300 group-hover:rotate-[-7deg]" />
                <div className="absolute -bottom-3 -right-2 w-28 h-[84px] sm:w-32 sm:h-[90px] rounded-xl overflow-hidden border-2 border-white/50 shadow-2xl rotate-[-4deg] transition-all duration-300 group-hover:rotate-0 group-hover:scale-105">
                  <img src="/images/card-random.jpg" alt="Random people chat" className="w-full h-full object-cover" />
                </div>
              </Link>
            </div>

            {/* Direct Messages Quick Link */}
            <Link
              href="/browse"
              className="mt-5 inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full transition-colors hover:border-[var(--brand-primary)]"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span className="online-dot" style={{ width: 6, height: 6 }} />
              <span>Want a private 1-on-1 chat? Browse everyone online →</span>
            </Link>
          </div>

          {/* ─── UNMISTAKABLE PUBLIC POST COMPOSER ──────────────────────────── */}
          <div className="w-full max-w-5xl mt-7">
            <form
              onSubmit={handlePublishPost}
              className="surface-card rounded-2xl p-4 sm:p-5 border transition-all"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              {/* Clear Public Post Header Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setAvatarModalOpen(true)}
                    className="flex-shrink-0 transition-transform hover:scale-105"
                    title="Change your avatar"
                  >
                    <UserAvatar
                      avatar={effectiveAuthor.avatar}
                      seed={effectiveAuthor.id}
                      name={effectiveAuthor.name}
                      size={36}
                    />
                  </button>
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs sm:text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      Create a Public Post
                    </span>
                    <span
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: 'var(--bg-active)',
                        color: 'var(--brand-primary)',
                      }}
                    >
                      Visible on Feed · as {effectiveAuthor.name}
                    </span>
                  </div>
                </div>

                <span className="text-[11px]" style={{ color: postText.length > 450 ? '#f59e0b' : 'var(--text-muted)' }}>
                  {postText.length}/500
                </span>
              </div>

              {/* Post Textarea */}
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handlePublishPost(e);
                  }
                }}
                maxLength={500}
                rows={2}
                placeholder="Write a public post for everyone on ConTalk... Use #hashtags to tag topics"
                className="w-full bg-transparent outline-none resize-none text-sm sm:text-[15px] leading-relaxed"
                style={{ color: 'var(--text-primary)' }}
              />

              {statusBanner && (
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--brand-mint)' }}>
                  {statusBanner}
                </p>
              )}

              {/* Bottom Action Bar — Explicit "Publish Post" button (NOT a chat arrow) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPostText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}#`)}
                    className="btn-soft px-2.5 py-1 text-xs flex items-center gap-1"
                    title="Add #hashtag"
                  >
                    <span style={{ color: 'var(--brand-primary)' }}>#</span>
                    <span>Tag</span>
                  </button>

                  {!identity.isAnon && (
                    <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={postAnonymously}
                        onChange={(e) => setPostAnonymously(e.target.checked)}
                        className="accent-indigo-500 rounded"
                      />
                      <span>Post anonymously</span>
                    </label>
                  )}

                  <Link
                    href="/browse"
                    className="hidden sm:inline text-xs hover:underline"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Looking for private chat? Open Messages →
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !postText.trim()}
                  className="btn-indigo px-5 py-2 text-xs sm:text-sm flex items-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>{submitting ? 'Publishing...' : 'Publish Post'}</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ─── LIVE POSTS FEED RIGHT UNDERNEATH (PEEKING ABOVE THE FOLD) ───── */}
        <section
          ref={feedSectionRef}
          className="px-4 sm:px-8 pt-2 pb-28 sm:pb-20"
        >
          <div className="max-w-5xl mx-auto mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="online-dot"></span>
              <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Live Public Feed
              </h2>
              <span className="hidden sm:inline text-xs" style={{ color: 'var(--text-muted)' }}>
                · Posts appear here instantly for everyone
              </span>
            </div>
            <Link href="/feed" className="btn-soft px-3 py-1 text-xs">
              Full Feed →
            </Link>
          </div>

          <FeedTimeline hideComposer={true} showInlineSearch={true} />
        </section>

        {/* Compact Legal & Safety Footer */}
        <footer
          className="px-4 sm:px-8 py-5 pb-24 sm:pb-8 border-t text-xs"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <span>ConTalk · Say it. Stay anonymous.</span>
            <nav className="flex flex-wrap items-center gap-4" aria-label="Legal and safety links">
              <Link href="/guidelines" className="hover:underline">Guidelines &amp; Terms</Link>
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link href="/guidelines#safety" className="hover:underline">Safety &amp; Report</Link>
            </nav>
          </div>
        </footer>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {avatarModalOpen && (
        <AvatarPickerModal
          currentAvatar={identity.avatar}
          onClose={() => setAvatarModalOpen(false)}
          onSaved={() => {
            setIdentity(getIdentity());
            refreshPresence();
          }}
        />
      )}
    </div>
  );
}
