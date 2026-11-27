'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import NotificationBell from '@/components/NotificationBell';
import ConTalkLogo from '@/components/ConTalkLogo';
import MobileBottomNav from '@/components/MobileBottomNav';
import UserAvatar from '@/components/UserAvatar';
import AvatarPickerModal from '@/components/AvatarPickerModal';
import { useNotifications } from '@/components/NotificationProvider';
import { SunIcon, MoonIcon } from '@/components/ThemeIcon';
import RoomIcon from '@/components/RoomIcon';
import { X, ShieldBan } from 'lucide-react';
import { getIdentity } from '@/lib/identity';

const PINNED_ROOMS = [
  { id: 'room_general', label: 'General Lobby', icon: 'message' },
  { id: 'room_tech', label: 'Tech & Coding', icon: 'code' },
  { id: 'room_gaming', label: 'Gaming', icon: 'gamepad' },
  { id: 'room_confessions', label: 'Confessions', icon: 'shield' },
];

const MAIN_MENU = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/feed', label: 'Posts Feed', icon: 'feed' },
  { href: '/browse', label: 'Messages', icon: 'messages' },
  { href: '/rooms', label: 'Chat Rooms', icon: 'rooms' },
  { href: '/random', label: 'Random Chat', icon: 'random' },
  { href: '/guidelines', label: 'Guidelines', icon: 'guidelines' },
];

function MenuIcon({ type }) {
  switch (type) {
    case 'home':
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 001 1h12a1 1 0 001-1V9.5" />
        </svg>
      );
    case 'feed':
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      );
    case 'messages':
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    case 'rooms':
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
          <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
        </svg>
      );
    case 'random':
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
      );
    case 'guidelines':
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function WorkspaceShell({
  sectionLabel = 'Workspace',
  pageLabel = 'ConTalk',
  searchValue = '',
  onSearchChange = null,
  searchPlaceholder = 'Search...',
  showMobileBottomNav = false,
  children,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { blockedUsers, unblockUser } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [identity, setIdentity] = useState({ id: '', name: 'Anon', isAnon: true, avatar: 'cloud' });
  const [vpStyle, setVpStyle] = useState(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Sync Workspace container height & offset to iOS Safari visualViewport when keyboard opens
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const updateViewport = () => {
      if (window.innerWidth >= 1024) {
        setVpStyle(null);
        setKeyboardOpen(false);
        return;
      }
      const vv = window.visualViewport;
      const isKb = window.innerHeight - vv.height > 140;
      setKeyboardOpen(isKb);
      setVpStyle({
        position: 'fixed',
        top: `${Math.max(0, Math.round(vv.offsetTop))}px`,
        left: 0,
        right: 0,
        height: `${Math.round(vv.height)}px`,
      });
    };

    updateViewport();
    const vv = window.visualViewport;
    vv.addEventListener('resize', updateViewport);
    vv.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);

    return () => {
      vv.removeEventListener('resize', updateViewport);
      vv.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  useEffect(() => {
    const sync = () => setIdentity(getIdentity());
    sync();
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && onSearchChange) {
        e.preventDefault();
        if (window.innerWidth < 640) setMobileSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 20);
      }
    };
    window.addEventListener('auth_change', sync);
    window.addEventListener('storage', sync);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('auth_change', sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onSearchChange]);

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('ct_token');
    localStorage.removeItem('ct_user');
    window.dispatchEvent(new Event('auth_change'));
    setIdentity(getIdentity());
    router.refresh();
  };

  const sidebarBody = (
    <div className="flex flex-col h-full">
      {/* Brand + Collapse */}
      <div className="h-14 px-4 flex items-center justify-between flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <ConTalkLogo
            variant="mark"
            size={36}
            cutoutColor={theme === 'dark' ? '#141428' : '#F5F3FF'}
            className="flex-shrink-0"
          />
          {!collapsed && (
            <span className="font-extrabold text-base tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
              Con<span style={{ color: 'var(--brand-mint)' }}>Talk</span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden lg:flex p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="9" y1="4" x2="9" y2="20" />
          </svg>
        </button>
      </div>

      {/* Scrollable Nav Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        {/* Favorites / Pinned Rooms */}
        <div>
          {!collapsed && (
            <div className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Favorites
            </div>
          )}
          <div className="space-y-0.5">
            {PINNED_ROOMS.map((room) => (
              <Link
                key={room.id}
                href={`/rooms?room=${encodeURIComponent(room.id)}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                title={room.label}
              >
                <span className="flex-shrink-0 flex items-center justify-center text-sm" style={{ color: 'var(--brand-primary)' }}>
                  <RoomIcon icon={room.icon} size={15} />
                </span>
                {!collapsed && <span className="truncate">{room.label}</span>}
              </Link>
            ))}
          </div>
        </div>

        {/* Main Menu */}
        <div>
          {!collapsed && (
            <div className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Main Menu
            </div>
          )}
          <div className="space-y-0.5">
            {MAIN_MENU.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    background: active ? 'var(--bg-active)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: active ? 600 : 500,
                  }}
                  title={item.label}
                >
                  <span className="flex-shrink-0">
                    <MenuIcon type={item.icon} />
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Theme Toggle + Blocked Manager + Identity Card */}
      <div className="p-3 space-y-2.5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        {blockedUsers.length > 0 && (
          <button
            type="button"
            onClick={() => setBlockedModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              color: '#F43F5E',
              border: '1px solid rgba(244, 63, 94, 0.25)',
            }}
            title="Manage blocked users"
          >
            <span className="flex items-center gap-2">
              <ShieldBan size={15} />
              {!collapsed && <span>Blocked Users</span>}
            </span>
            {!collapsed && <span className="font-bold">{blockedUsers.length}</span>}
          </button>
        )}

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
          title="Switch Light / Dark mode"
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? <MoonIcon size={16} /> : <SunIcon size={17} />}
            {!collapsed && <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>}
          </span>
          {!collapsed && (
            <span
              className="w-8 h-4 rounded-full relative transition-colors flex-shrink-0"
              style={{ background: theme === 'dark' ? '#6366F1' : '#D4D4D8' }}
            >
              <span
                className="w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left: theme === 'dark' ? '18px' : '2px' }}
              />
            </span>
          )}
        </button>

        {/* Identity / Auth Card */}
        {!collapsed ? (
          <div
            className="rounded-xl p-3 space-y-2.5"
            style={{
              background:
                theme === 'light'
                  ? 'linear-gradient(135deg, #EFEBFD 0%, #E2F8F3 100%)'
                  : 'linear-gradient(135deg, rgba(140,123,255,0.16) 0%, rgba(46,230,197,0.1) 100%)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="flex items-center gap-2.5 min-w-0 text-left group"
                title="Change your avatar"
              >
                <UserAvatar avatar={identity.avatar} seed={identity.id} name={identity.name} size={34} />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {identity.name}
                  </div>
                  <div className="text-[10px] group-hover:underline" style={{ color: 'var(--text-muted)' }}>
                    Change avatar
                  </div>
                </div>
              </button>
            </div>

            {identity.isAnon ? (
              <div className="flex gap-1.5">
                <Link href="/login" className="flex-1">
                  <button className="btn-soft w-full py-1.5 text-[11px]">Login</button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <button className="btn-cta w-full py-1.5 text-[11px]">Sign Up</button>
                </Link>
              </div>
            ) : (
              <button onClick={handleLogout} className="btn-danger-soft w-full py-1.5 text-[11px]">
                Logout
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAvatarModalOpen(true)}
            className="w-full flex justify-center"
            title={`${identity.name} — Change avatar`}
          >
            <UserAvatar avatar={identity.avatar} seed={identity.id} name={identity.name} size={36} />
          </button>
        )}

        {!collapsed && (
          <nav
            className="flex items-center justify-center gap-2.5 pt-1 text-[10px]"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Legal and safety"
          >
            <Link href="/guidelines" className="hover:underline">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <span>·</span>
            <Link href="/guidelines#safety" className="hover:underline">Safety</Link>
          </nav>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="h-dvh-screen w-full flex overflow-hidden"
      style={{ background: 'var(--bg-app)', ...(vpStyle || {}) }}
    >
      {/* Desktop Left Main Sidebar (Image 2 Column 1) */}
      <aside
        className={`hidden lg:block flex-shrink-0 sidebar-wash transition-all duration-200 ${
          collapsed ? 'w-[70px]' : 'w-[228px]'
        }`}
      >
        {sidebarBody}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-[258px] max-w-[82vw] h-full sidebar-wash shadow-2xl">{sidebarBody}</div>
          <div className="flex-1 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Right Workspace Area (Top Breadcrumb + Page Body) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Breadcrumb & Search Bar */}
        <header
          className="px-3.5 sm:px-6 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-panel)' }}
        >
          <div className="h-14 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-1.5 rounded-lg flex-shrink-0"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Open menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="hidden sm:inline flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {sectionLabel}
                </span>
                <span className="hidden sm:inline flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  /
                </span>
                <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {pageLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {onSearchChange && (
                <>
                  {/* Desktop inline search */}
                  <div className="hidden sm:block relative w-60">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchValue}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="themed-input py-1.5 pl-9 pr-10 text-xs"
                    />
                    <span
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded font-mono"
                      style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
                    >
                      ⌘K
                    </span>
                  </div>

                  {/* Mobile search toggle icon */}
                  <button
                    type="button"
                    onClick={() => setMobileSearchOpen((v) => !v)}
                    className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center border"
                    style={{
                      background: mobileSearchOpen || searchValue ? 'var(--bg-active)' : 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      color: mobileSearchOpen || searchValue ? 'var(--brand-primary)' : 'var(--text-primary)',
                    }}
                    aria-label="Toggle search"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                </>
              )}
              <NotificationBell />
            </div>
          </div>

          {/* Mobile Expandable Full-Width Search Row */}
          {onSearchChange && mobileSearchOpen && (
            <div className="sm:hidden pb-3 animate-fadeIn">
              <div className="relative">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  autoFocus
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="themed-input py-2 pl-9 pr-8 text-xs"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs px-1 flex items-center justify-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Main Page Content */}
        <div className={`flex-1 min-h-0 overflow-hidden ${showMobileBottomNav && !keyboardOpen ? 'pb-16 sm:pb-0' : ''}`}>
          {children}
        </div>
      </div>

      {showMobileBottomNav && !keyboardOpen && <MobileBottomNav />}
      {avatarModalOpen && (
        <AvatarPickerModal
          currentAvatar={identity.avatar}
          onClose={() => setAvatarModalOpen(false)}
          onSaved={() => setIdentity(getIdentity())}
        />
      )}
      {blockedModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="surface-card rounded-2xl p-5 w-full max-w-sm border shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <ShieldBan size={17} className="text-rose-400" />
                <span>Blocked Users ({blockedUsers.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setBlockedModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            {blockedUsers.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                No blocked users.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {blockedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {u.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => unblockUser(u.id)}
                      className="btn-soft px-2.5 py-1 text-[11px] flex-shrink-0"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
