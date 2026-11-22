'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io } from 'socket.io-client';
import UserAvatar from '@/components/UserAvatar';
import { getIdentity } from '@/lib/identity';
import { getNotificationPreview } from '@/lib/stickers';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  soundEnabled: true,
  browserPermission: 'default',
  toggleSound: () => {},
  requestBrowserPermission: async () => {},
  markAllRead: () => {},
  markRead: () => {},
  clearAll: () => {},
  setActiveDmPartnerId: () => {},
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
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.09); // A5

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserPermission, setBrowserPermission] = useState('default');

  const activeDmPartnerIdRef = useRef(null);
  const pathnameRef = useRef(pathname);
  const soundEnabledRef = useRef(true);
  const socketRef = useRef(null);
  const myIdRef = useRef('');

  useEffect(() => {
    pathnameRef.current = pathname;
    if (pathname !== '/browse') {
      activeDmPartnerIdRef.current = null;
    }
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

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = unreadCount > 0 ? `(${unreadCount}) ConTalk` : 'ConTalk — Real-Time Chat, Rooms & Feed';
  }, [unreadCount]);

  const pushNotification = useCallback((item) => {
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
  }, [router]);

  useEffect(() => {
    const syncIdentity = () => {
      const id = getIdentity();
      myIdRef.current = id.id;
      if (socketRef.current?.connected) {
        socketRef.current.emit('register', id);
      }
    };

    syncIdentity();

    const socket = io(window.location.origin, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      const id = getIdentity();
      myIdRef.current = id.id;
      socket.emit('register', id);
    });

    socket.on('dm_message', (msg) => {
      if (!msg || !msg.senderId || msg.senderId === myIdRef.current) return;

      // Skip toast if the user is already viewing this exact DM and tab is visible
      const viewingSameDm =
        pathnameRef.current === '/browse' &&
        activeDmPartnerIdRef.current === msg.senderId &&
        (typeof document === 'undefined' || !document.hidden);

      if (viewingSameDm) return;

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
    });

    window.addEventListener('auth_change', syncIdentity);
    return () => {
      window.removeEventListener('auth_change', syncIdentity);
      socket.disconnect();
    };
  }, [pushNotification]);

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

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const setActiveDmPartnerId = useCallback((partnerId) => {
    activeDmPartnerIdRef.current = partnerId || null;
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        soundEnabled,
        browserPermission,
        toggleSound,
        requestBrowserPermission,
        markAllRead,
        markRead,
        clearAll,
        setActiveDmPartnerId,
      }}
    >
      {children}

      {/* Floating Real-Time Notification Toasts (top on mobile so chat input stays clear) */}
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
                    className="text-xs px-1"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Dismiss notification"
                  >
                    ✕
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
