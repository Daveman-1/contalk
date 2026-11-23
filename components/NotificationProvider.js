'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';
import { getIdentity } from '@/lib/identity';
import { getNotificationPreview } from '@/lib/stickers';
import { X } from 'lucide-react';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  unreadBySenderId: {},
  onlineUsers: [],
  roomPresence: {},
  storageMode: 'local',
  soundEnabled: true,
  browserPermission: 'default',
  toggleSound: () => {},
  requestBrowserPermission: async () => {},
  markAllRead: () => {},
  markRead: () => {},
  clearSenderUnread: () => {},
  clearAll: () => {},
  setActiveDmPartnerId: () => {},
  setActiveRoomId: () => {},
  refreshPresence: async () => {},
});

function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
    setTimeout(() => ctx.close().catch(() => {}), 350);
  } catch {}
}

export function NotificationProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [roomPresence, setRoomPresence] = useState({});
  const [storageMode, setStorageMode] = useState('local');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserPermission, setBrowserPermission] = useState('default');

  const activeDmPartnerIdRef = useRef(null);
  const activeRoomIdRef = useRef(null);
  const pathnameRef = useRef(pathname);
  const soundEnabledRef = useRef(true);
  const seenInboxIdsRef = useRef(new Set());
  const inboxInitializedRef = useRef(false);

  useEffect(() => {
    pathnameRef.current = pathname;
    if (pathname !== '/browse') activeDmPartnerIdRef.current = null;
    if (pathname !== '/rooms') activeRoomIdRef.current = null;
  }, [pathname]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    try {
      const savedSound = localStorage.getItem('ct_notif_sound');
      if (savedSound === 'off') {
        setSoundEnabled(false);
        soundEnabledRef.current = false;
      }
      if (typeof Notification !== 'undefined') {
        setBrowserPermission(Notification.permission);
      }
    } catch {}
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const unreadBySenderId = notifications.reduce((acc, n) => {
    if (!n.read && n.senderId) {
      acc[n.senderId] = (acc[n.senderId] || 0) + 1;
    }
    return acc;
  }, {});

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = unreadCount > 0 ? `(${unreadCount}) ConTalk` : 'ConTalk — Real-Time Chat, Rooms & Feed';
  }, [unreadCount]);

  const pushNotification = useCallback(
    (item) => {
      const entry = {
        id: item.id || `${Date.now()}_${Math.random()}`,
        title: item.title,
        body: item.body,
        href: item.href,
        senderId: item.senderId || null,
        senderName: item.senderName || 'ConTalk',
        senderAvatar: item.senderAvatar || null,
        type: item.type || 'dm',
        timestamp: item.timestamp || new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [entry, ...prev].slice(0, 40));
      setToasts((prev) => [entry, ...prev].slice(0, 3));

      if (soundEnabledRef.current) {
        playChime();
      }

      if (
        typeof document !== 'undefined' &&
        document.hidden &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        try {
          const n = new Notification(entry.title, { body: entry.body });
          n.onclick = () => {
            window.focus();
            if (entry.href) router.push(entry.href);
          };
        } catch {}
      }

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== entry.id));
      }, 5500);
    },
    [router]
  );

  // Unified App-Wide Presence Heartbeat (1 connection per tab instead of multiple sockets!)
  const sendHeartbeat = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const identity = getIdentity();
    if (!identity.id) return;

    try {
      const res = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: identity.id,
          name: identity.name,
          isAnon: identity.isAnon,
          avatar: identity.avatar,
          activeRoomId: activeRoomIdRef.current,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.onlineUsers)) setOnlineUsers(data.onlineUsers);
      if (data.roomPresence && typeof data.roomPresence === 'object') setRoomPresence(data.roomPresence);
      if (data.storage) setStorageMode(data.storage);
    } catch {}
  }, []);

  // Poll DM Inbox for Real-Time Notifications
  const pollInbox = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const identity = getIdentity();
    if (!identity.id) return;

    try {
      const res = await fetch(`/api/inbox?userId=${encodeURIComponent(identity.id)}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const events = Array.isArray(data.events) ? data.events : [];

      if (!inboxInitializedRef.current) {
        for (const ev of events) {
          if (ev && ev.id) seenInboxIdsRef.current.add(ev.id);
        }
        inboxInitializedRef.current = true;
        return;
      }

      const fresh = events
        .filter((ev) => ev && ev.id && !seenInboxIdsRef.current.has(ev.id))
        .reverse();

      for (const msg of fresh) {
        seenInboxIdsRef.current.add(msg.id);
        if (msg.senderId === identity.id) continue;

        const viewingSameDm =
          pathnameRef.current === '/browse' &&
          activeDmPartnerIdRef.current === msg.senderId &&
          !document.hidden;

        if (viewingSameDm) continue;

        pushNotification({
          id: msg.id,
          type: 'dm',
          senderId: msg.senderId,
          senderName: msg.sender || 'Someone',
          senderAvatar: msg.senderAvatar || null,
          title: `New message from ${msg.sender || 'Someone'}`,
          body: getNotificationPreview(msg.content),
          href: `/browse?chatWith=${encodeURIComponent(msg.senderId)}`,
          timestamp: msg.timestamp,
        });
      }
    } catch {}
  }, [pushNotification]);

  useEffect(() => {
    sendHeartbeat();
    pollInbox();

    const presenceTimer = setInterval(() => {
      if (!document.hidden) sendHeartbeat();
    }, 6000);

    const inboxTimer = setInterval(() => {
      if (!document.hidden) pollInbox();
    }, 3000);

    const onVisibility = () => {
      if (!document.hidden) {
        sendHeartbeat();
        pollInbox();
      }
    };

    const onAuthChange = () => {
      seenInboxIdsRef.current = new Set();
      inboxInitializedRef.current = false;
      sendHeartbeat();
      pollInbox();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('auth_change', onAuthChange);

    return () => {
      clearInterval(presenceTimer);
      clearInterval(inboxTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('auth_change', onAuthChange);
    };
  }, [sendHeartbeat, pollInbox]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ct_notif_sound', next ? 'on' : 'off');
      } catch {}
      if (next) playChime();
      return next;
    });
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const result = await Notification.requestPermission();
      setBrowserPermission(result);
    } catch {}
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearSenderUnread = useCallback((senderId) => {
    if (!senderId) return;
    setNotifications((prev) =>
      prev.map((n) => (n.senderId === senderId ? { ...n, read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const setActiveDmPartnerId = useCallback((partnerId) => {
    activeDmPartnerIdRef.current = partnerId || null;
  }, []);

  const setActiveRoomId = useCallback(
    (roomId) => {
      activeRoomIdRef.current = roomId || null;
      sendHeartbeat();
    },
    [sendHeartbeat]
  );

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        unreadBySenderId,
        onlineUsers,
        roomPresence,
        storageMode,
        soundEnabled,
        browserPermission,
        toggleSound,
        requestBrowserPermission,
        markAllRead,
        markRead,
        clearSenderUnread,
        clearAll,
        setActiveDmPartnerId,
        setActiveRoomId,
        refreshPresence: sendHeartbeat,
      }}
    >
      {children}

      {/* Floating Real-Time Notification Toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-16 left-3 right-3 sm:top-auto sm:left-auto sm:bottom-5 sm:right-5 sm:w-[320px] z-[60] flex flex-col gap-2.5 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto surface-card rounded-2xl p-3.5 animate-toast flex items-start gap-3 border-l-4"
              style={{ borderLeftColor: '#6366F1' }}
            >
              <UserAvatar
                avatar={toast.senderAvatar}
                seed={toast.senderId || toast.senderName}
                name={toast.senderName}
                size={36}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {toast.title}
                  </span>
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="text-xs p-0.5 rounded hover:bg-[var(--bg-hover)] flex items-center justify-center"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Dismiss notification"
                  >
                    <X size={13} />
                  </button>
                </div>
                <p className="text-xs line-clamp-2 mt-0.5 break-words" style={{ color: 'var(--text-secondary)' }}>
                  {toast.body}
                </p>
                {toast.href && (
                  <button
                    onClick={() => {
                      markRead(toast.id);
                      dismissToast(toast.id);
                      router.push(toast.href);
                    }}
                    className="mt-2 text-[11px] font-semibold hover:underline"
                    style={{ color: 'var(--accent-purple)' }}
                  >
                    Open chat →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
