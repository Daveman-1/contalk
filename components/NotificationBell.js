'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/NotificationProvider';
import UserAvatar from '@/components/UserAvatar';
import { BellIcon, BellSlashIcon } from '@/components/ThemeIcon';

function shortTime(iso) {
  if (!iso) return '';
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell({ align = 'right' }) {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    soundEnabled,
    browserPermission,
    toggleSound,
    requestBrowserPermission,
    markAllRead,
    markRead,
    clearAll,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors border"
        style={{
          background: open ? 'var(--bg-active)' : 'var(--bg-elevated)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        title="Chat notifications"
        aria-label="Chat notifications"
      >
        <BellIcon size={17} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow"
            style={{ background: '#6366F1' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 w-[min(340px,calc(100vw-1.5rem))] surface-card rounded-2xl overflow-hidden z-50 animate-fadeIn ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: '#6366F1' }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleSound}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                title={soundEnabled ? 'Mute sound' : 'Enable sound'}
                aria-label={soundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
              >
                {soundEnabled ? <BellIcon size={15} /> : <BellSlashIcon size={15} />}
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] font-medium hover:underline"
                  style={{ color: 'var(--accent-purple)' }}
                >
                  Mark read
                </button>
              )}
            </div>
          </div>

          {/* Browser push notification opt-in */}
          {typeof Notification !== 'undefined' && browserPermission === 'default' && (
            <div
              className="px-4 py-2.5 border-b flex items-center justify-between gap-2 text-xs"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-active)' }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Get desktop alerts for new chats</span>
              <button
                type="button"
                onClick={requestBrowserPermission}
                className="btn-indigo px-2.5 py-1 text-[11px] flex-shrink-0"
              >
                Enable
              </button>
            </div>
          )}

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                No notifications yet. Incoming chat messages will appear here!
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                    if (n.href) router.push(n.href);
                  }}
                  className="w-full px-4 py-3 text-left flex items-start gap-3 transition-colors"
                  style={{
                    background: n.read ? 'transparent' : 'var(--bg-active)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = n.read ? 'transparent' : 'var(--bg-active)')
                  }
                >
                  <UserAvatar
                    avatar={n.senderAvatar}
                    seed={n.senderId || n.senderName}
                    name={n.senderName}
                    size={32}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {n.title}
                      </span>
                      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {shortTime(n.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {n.body}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#6366F1' }} />
                  )}
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t text-right" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
