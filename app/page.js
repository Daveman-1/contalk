'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FeedTimeline from '@/components/FeedTimeline';
import NotificationBell from '@/components/NotificationBell';
import ConTalkLogo from '@/components/ConTalkLogo';
import MobileBottomNav from '@/components/MobileBottomNav';
import UserAvatar from '@/components/UserAvatar';
import AvatarPickerModal from '@/components/AvatarPickerModal';
import VerificationModal, { isSafetyVerified } from '@/components/VerificationModal';
import { useNotifications } from '@/components/NotificationProvider';
import { SunIcon, MoonIcon } from '@/components/ThemeIcon';
import { useTheme } from '@/components/ThemeProvider';
import { getIdentity } from '@/lib/identity';
import {
  Home,
  Rss,
  MessageSquare,
  Hash,
  Shuffle,
  Plus,
  Sparkles,
  Shield,
  Zap,
  Flame,
  Users,
  Dices,
  ArrowRight,
  Send,
} from 'lucide-react';

const QUICK_TAGS = ['#general', '#tech', '#confessions', '#gaming', '#music', '#random'];

export default function HomePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { onlineUsers, refreshPresence } = useNotifications();
  const [identity, setIdentity] = useState({ id: '', name: 'Anon', isAnon: true, avatar: 'cloud' });
  const [anonFallback, setAnonFallback] = useState({ id: '', name: 'Anon' });
  const [postText, setPostText] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
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

  const handleRandomizeHandle = () => {
    const randomHex = Math.random().toString(16).slice(2, 6).toUpperCase();
    const newName = `Anon-${randomHex}`;
    localStorage.setItem('ct_anon_name', newName);
    window.dispatchEvent(new Event('auth_change'));
  };

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
    localStorage.removeItem('ct_token');
    localStorage.removeItem('ct_user');
    window.dispatchEvent(new Event('auth_change'));
    setIdentity(getIdentity());
  };

  const handleStartRandomClick = (e) => {
    if (!isSafetyVerified()) {
      e?.preventDefault();
      setVerificationModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex hero-canvas">
      {/* ─── SLIM LABELED LEFT ICON RAIL (DESKTOP) ───────────────────────── */}
      <aside
        className="hidden sm:flex fixed left-0 top-0 bottom-0 w-[76px] z-40 flex-col items-center justify-between py-4 border-r backdrop-blur-md"
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
            { href: '/random', label: 'Random', title: 'Random 1-on-1 Chat', icon: Shuffle, active: false },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                className="w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group"
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
                <Icon size={19} strokeWidth={item.active ? 2.4 : 1.9} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={toggleTheme}
          className="w-[64px] py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
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

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <div className="flex-1 sm:pl-[76px] flex flex-col min-w-0">
        {/* Top Header */}
        <header className="w-full px-4 sm:px-8 pt-4 sm:pt-5 flex items-center justify-between gap-3">
          <div className="flex sm:hidden items-center gap-2 min-w-0">
            <Link href="/" className="flex items-center gap-2" aria-label="ConTalk Home">
              <ConTalkLogo variant="mark" size={32} />
              <span className="font-extrabold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Con<span style={{ color: 'var(--brand-mint)' }}>Talk</span>
              </span>
            </Link>
          </div>

          {/* Live Trust Banner */}
          <div className="hidden md:flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] backdrop-blur-md">
            <span className="online-dot" />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {Math.max(onlineCount, 1)} online now
            </span>
            <span className="opacity-40">·</span>
            <span style={{ color: 'var(--text-muted)' }}>Zero Logging · No Email Needed</span>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Quick Avatar Pill (Desktop) */}
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="hidden sm:flex items-center gap-2 text-xs pl-1.5 pr-3 py-1 rounded-full transition-colors border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--brand-primary)]"
              title="Click to customize avatar"
            >
              <UserAvatar avatar={identity.avatar} seed={identity.id} name={identity.name} size={22} />
              <span className="font-medium truncate max-w-[110px]" style={{ color: 'var(--text-primary)' }}>
                {identity.name}
              </span>
            </button>

            {/* Mobile Theme Toggle */}
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
                <button className="btn-cta px-3.5 sm:px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 shadow-md">
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #5B4AE3, #12B89A)' }}
                  >
                    <Plus size={13} strokeWidth={2.8} />
                  </span>
                  <span>Sign In</span>
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/browse">
                  <button className="btn-cta px-3.5 sm:px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 shadow-md max-w-[130px] sm:max-w-none">
                    <span className="online-dot" />
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

        {/* ─── CATCHY HERO SECTION ────────────────────────────────────────── */}
        <section className="flex flex-col items-center px-4 sm:px-8 pt-8 sm:pt-12 pb-8">
          <div className="flex flex-col items-center w-full max-w-5xl text-center">
            {/* High-Energy Pulse Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8C7BFF]/30 bg-[#8C7BFF]/10 text-xs font-semibold mb-6 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-[#2EE6C5] animate-ping" />
              <span className="bg-gradient-to-r from-[#8C7BFF] to-[#2EE6C5] bg-clip-text text-transparent">
                THE REAL-TIME SOCIAL PLAYGROUND
              </span>
            </div>

            {/* Bold Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.12] mb-5">
              Speak your mind.{' '}
              <span className="block mt-1 bg-gradient-to-r from-[#8C7BFF] via-[#B388FF] to-[#2EE6C5] bg-clip-text text-transparent">
                Zero traces attached.
              </span>
            </h1>

            {/* Punchy Subheadline */}
            <p className="text-sm sm:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-8">
              Instant 1-on-1 matches, lively group lounges, and an unfiltered community feed.
              No phone numbers, no tracking cookies, and zero registration friction.
            </p>

            {/* Instant Action CTA Row */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 w-full max-w-md sm:max-w-none">
              <Link
                href="/random"
                onClick={handleStartRandomClick}
                className="btn-indigo w-full sm:w-auto px-7 py-3.5 text-sm sm:text-base font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#6366F1]/30 hover:shadow-[#6366F1]/50 hover:-translate-y-0.5 transition-all"
              >
                <Shuffle size={18} />
                <span>Start Random Match</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/rooms"
                className="btn-soft w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all"
              >
                <Hash size={18} style={{ color: 'var(--brand-mint)' }} />
                <span>Explore 5 Rooms</span>
              </Link>

              <Link
                href="/feed"
                className="btn-soft w-full sm:w-auto px-5 py-3.5 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all"
              >
                <Rss size={18} style={{ color: 'var(--brand-primary)' }} />
                <span>Community Feed</span>
              </Link>
            </div>

            {/* Interactive Live Persona Capsule (Instant Delight) */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] backdrop-blur-md text-xs mb-10">
              <span className="text-[var(--text-muted)]">Your persona right now:</span>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-active)] font-semibold text-[var(--brand-primary)] hover:opacity-85 transition-opacity"
                title="Change avatar"
              >
                <UserAvatar avatar={effectiveAuthor.avatar} seed={effectiveAuthor.id} name={effectiveAuthor.name} size={18} />
                <span>{effectiveAuthor.name}</span>
              </button>

              {effectiveAuthor.isAnon && (
                <button
                  type="button"
                  onClick={handleRandomizeHandle}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
                  title="Randomize anonymous name"
                >
                  <Dices size={13} />
                  <span>Reroll Handle</span>
                </button>
              )}
            </div>

            {/* ─── 3 POWER ACTION CARDS (REDESIGNED) ───────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full text-left">
              {/* Card 1: Random 1-on-1 */}
              <Link
                href="/random"
                onClick={handleStartRandomClick}
                className="card-grad-indigo group relative rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider">
                      <Zap size={12} />
                      <span>Instant 1-on-1</span>
                    </span>
                    <span className="text-white/80 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">
                    Match with Strangers
                  </h3>
                  <p className="text-white/85 text-xs sm:text-sm leading-relaxed mb-4">
                    Instant matchmaking with category selection. Skip anyone anytime with zero awkwardness.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/20">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    ♂ Male Queue
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    ♀ Female Queue
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    ⚡ 1-Click Skip
                  </span>
                </div>
              </Link>

              {/* Card 2: Group Rooms */}
              <Link
                href="/rooms"
                className="card-grad-sky group relative rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider">
                      <Flame size={12} />
                      <span>5 Live Lounges</span>
                    </span>
                    <span className="text-white/80 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">
                    Themed Group Rooms
                  </h3>
                  <p className="text-white/85 text-xs sm:text-sm leading-relaxed mb-4">
                    Persistent lounges for software banter, anonymous confessions, gaming, and late-night music.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/20">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    #tech
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    #confessions
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    #gaming
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    #music
                  </span>
                </div>
              </Link>

              {/* Card 3: Community Feed */}
              <Link
                href="/feed"
                className="card-grad-prism group relative rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider">
                      <Sparkles size={12} />
                      <span>Live Public Stream</span>
                    </span>
                    <span className="text-white/80 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">
                    Public Community Feed
                  </h3>
                  <p className="text-white/90 text-xs sm:text-sm leading-relaxed mb-4">
                    Drop live takes, confessions, and thoughts with #hashtags. Upvote, reply, and react in real-time.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/20">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    #trending
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    Instant Replies
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    Anonymous Mode
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* ─── 3 PILLARS BENTO ───────────────────────────────────────────── */}
          <div className="w-full max-w-5xl mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="surface-card rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 card-grad-indigo text-white">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Total Privacy
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  No phone numbers, passwords, or emails required. You control your identity completely.
                </p>
              </div>
            </div>

            <div className="surface-card rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 card-grad-sky text-white">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Zero-Latency Chat
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Powered by real-time WebSockets with live typing indicators and instant delivery.
                </p>
              </div>
            </div>

            <div className="surface-card rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 card-grad-prism text-white">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Split Personas
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Post under your username or flip the switch to whisper 100% anonymously.
                </p>
              </div>
            </div>
          </div>

          {/* ─── PUBLIC POST COMPOSER ───────────────────────────────────────── */}
          <div className="w-full max-w-5xl mt-10">
            <form
              onSubmit={handlePublishPost}
              className="surface-card rounded-2xl p-5 sm:p-6 border transition-all"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              {/* Strip Header */}
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
                      Create a Public Take
                    </span>
                    <span
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: 'var(--bg-active)',
                        color: 'var(--brand-primary)',
                      }}
                    >
                      Posting as {effectiveAuthor.name} {effectiveAuthor.isAnon ? '(Anonymous)' : ''}
                    </span>
                  </div>
                </div>

                <span className="text-[11px]" style={{ color: postText.length > 450 ? '#f59e0b' : 'var(--text-muted)' }}>
                  {postText.length}/500
                </span>
              </div>

              {/* Textarea */}
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
                placeholder="Share a take, confession, or question with everyone on ConTalk..."
                className="w-full bg-transparent outline-none resize-none text-sm sm:text-[15px] leading-relaxed"
                style={{ color: 'var(--text-primary)' }}
              />

              {/* Quick Hashtags Strip */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[11px] text-[var(--text-muted)] mr-1">Quick Tags:</span>
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setPostText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}${tag} `)}
                    className="text-[11px] px-2 py-0.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--brand-primary)] text-[var(--text-secondary)] transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {statusBanner && (
                <p className="text-xs mt-2 font-medium" style={{ color: 'var(--brand-mint)' }}>
                  {statusBanner}
                </p>
              )}

              {/* Bottom Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-3 flex-wrap">
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
                    Want private 1-on-1 chat? Open Messages →
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !postText.trim()}
                  className="btn-indigo px-5 py-2 text-xs sm:text-sm flex items-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed shadow-md"
                >
                  <Send size={13} />
                  <span>{submitting ? 'Publishing...' : 'Publish Take'}</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ─── LIVE POSTS FEED SECTION ────────────────────────────────────── */}
        <section
          ref={feedSectionRef}
          className="px-4 sm:px-8 pt-2 pb-28 sm:pb-20 max-w-5xl mx-auto w-full"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="online-dot" />
              <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Live Community Feed
              </h2>
              <span className="hidden sm:inline text-xs" style={{ color: 'var(--text-muted)' }}>
                · Posts stream live for everyone
              </span>
            </div>
            <Link href="/feed" className="btn-soft px-3.5 py-1 text-xs font-semibold flex items-center gap-1">
              <span>Full Feed</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <FeedTimeline hideComposer={true} showInlineSearch={true} />
        </section>
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

      <VerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        onComplete={() => {
          setVerificationModalOpen(false);
          router.push('/random');
        }}
      />
    </div>
  );
}
