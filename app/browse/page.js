'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import WorkspaceShell from '@/components/WorkspaceShell';
import ChatBox from '@/components/ChatBox';
import UserList from '@/components/UserList';
import UserAvatar from '@/components/UserAvatar';
import { useNotifications } from '@/components/NotificationProvider';
import { getIdentity, getDmRoomId } from '@/lib/identity';
import { MessageSquare } from 'lucide-react';

export default function BrowsePage() {
  const { onlineUsers, unreadBySenderId, clearSenderUnread, setActiveDmPartnerId } = useNotifications();
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [myId, setMyId] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    setActiveDmPartnerId(activeUserId);
    if (activeUserId) clearSenderUnread(activeUserId);
    return () => setActiveDmPartnerId(null);
  }, [activeUserId, setActiveDmPartnerId, clearSenderUnread]);

  const fetchRegisteredUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.users)) setRegisteredUsers(data.users);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, []);

  useEffect(() => {
    const syncIdentity = () => {
      const identity = getIdentity();
      setMyId(identity.id);
    };
    syncIdentity();
    fetchRegisteredUsers();

    const usersTimer = setInterval(() => {
      if (!document.hidden) fetchRegisteredUsers();
    }, 10000);

    window.addEventListener('auth_change', syncIdentity);
    return () => {
      clearInterval(usersTimer);
      window.removeEventListener('auth_change', syncIdentity);
    };
  }, [fetchRegisteredUsers]);

  const mergedUsers = useMemo(() => {
    const byId = new Map();
    for (const acc of registeredUsers) {
      byId.set(acc.id, {
        id: acc.id,
        name: acc.username,
        avatar: acc.avatar || null,
        isAnon: false,
        online: false,
      });
    }
    for (const u of onlineUsers) {
      const prev = byId.get(u.id);
      byId.set(u.id, {
        id: u.id,
        name: u.name,
        avatar: u.avatar || prev?.avatar || null,
        isAnon: Boolean(u.isAnon),
        online: true,
      });
    }
    return Array.from(byId.values());
  }, [registeredUsers, onlineUsers]);

  const activeUser = useMemo(
    () => mergedUsers.find((u) => u.id === activeUserId) || null,
    [mergedUsers, activeUserId]
  );

  const pollMessages = useCallback(async (partnerId, initial = false) => {
    const identity = getIdentity();
    if (!partnerId || !identity.id) return;
    const roomId = getDmRoomId(identity.id, partnerId);
    if (initial) setLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/messages?roomId=${encodeURIComponent(roomId)}&myId=${encodeURIComponent(identity.id)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages((prev) => {
          const pendingLocals = prev.filter(
            (m) =>
              String(m.id || '').startsWith('local_') &&
              Date.now() - new Date(m.timestamp).getTime() < 8000
          );
          return [...data.messages, ...pendingLocals];
        });
      }
      setIsPartnerTyping(Array.isArray(data.typingUsers) && data.typingUsers.length > 0);
    } catch {
    } finally {
      if (initial) setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!activeUserId) {
      setMessages([]);
      setIsPartnerTyping(false);
      return;
    }

    pollMessages(activeUserId, true);
    const timer = setInterval(() => {
      if (!document.hidden) pollMessages(activeUserId, false);
    }, 1500);

    return () => clearInterval(timer);
  }, [activeUserId, pollMessages]);

  const handleChatWith = useCallback((user) => {
    setActiveUserId(user.id);
    clearSenderUnread(user.id);
  }, [clearSenderUnread]);

  // Auto-open DM when navigated from /feed?chatWith=<userId> or Notification toast
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRef.current || typeof window === 'undefined' || mergedUsers.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('chatWith');
    if (!targetId) return;
    const match = mergedUsers.find((u) => u.id === targetId && u.id !== myId);
    if (match) {
      autoOpenedRef.current = true;
      handleChatWith(match);
    }
  }, [mergedUsers, myId, handleChatWith]);

  const handleSend = async (content) => {
    if (!activeUser) return;
    const identity = getIdentity();
    const roomId = getDmRoomId(identity.id, activeUser.id);
    const optimisticId = `local_${Date.now()}_${Math.random()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        content,
        sender: identity.name,
        senderId: identity.id,
        senderAvatar: identity.avatar,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          recipientId: activeUser.id,
          content,
          sender: identity.name,
          senderId: identity.id,
          senderAvatar: identity.avatar,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticId ? data.message : m))
          );
        }
      }
    } catch (err) {
      console.error('Failed to send DM:', err);
    }
  };

  const handleTyping = (isTyping) => {
    if (!activeUser) return;
    const identity = getIdentity();
    const roomId = getDmRoomId(identity.id, activeUser.id);
    fetch('/api/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        userId: identity.id,
        userName: identity.name,
        isTyping,
      }),
    }).catch(() => {});
  };

  return (
    <WorkspaceShell
      sectionLabel="Messages"
      pageLabel={activeUser ? `Chat with ${activeUser.name}` : 'Direct Chat'}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search people..."
      showMobileBottomNav={!activeUser}
    >
      <div className="h-full flex overflow-hidden">
        {/* Column 2: Middle Directory & DMs */}
        <div
          className={`${activeUser ? 'hidden md:block' : 'block'} w-full md:w-[270px] flex-shrink-0 border-r h-full`}
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-panel)' }}
        >
          <UserList
            users={mergedUsers}
            onChat={handleChatWith}
            activeUserId={activeUser?.id}
            myId={myId}
            unreadCounts={unreadBySenderId}
            filter={filter}
            onFilterChange={setFilter}
            search={search}
          />
        </div>

        {/* Column 3: Main Chat Window (edge-to-edge on mobile for max typing space) */}
        <div
          className={`${activeUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 h-full p-0 sm:p-6`}
          style={{ background: 'var(--bg-app)' }}
        >
          {activeUser ? (
            <>
              <div
                className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-0 sm:py-0 sm:mb-4 border-b sm:border-b-0 flex-shrink-0"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setActiveUserId(null)}
                    className="md:hidden btn-soft p-2 flex-shrink-0"
                    aria-label="Back to people"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <UserAvatar
                    avatar={activeUser.avatar}
                    seed={activeUser.id}
                    name={activeUser.name}
                    size={36}
                    online={activeUser.online}
                  />
                  <div className="min-w-0">
                    <h1 className="text-sm sm:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {activeUser.name}
                    </h1>
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className={activeUser.online ? 'online-dot' : 'offline-dot'} />
                      <span className="truncate">
                        {activeUser.online ? 'Online' : 'Offline'} · {activeUser.isAnon ? 'Anon' : 'Account'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="flex-1 min-h-0 sm:rounded-2xl sm:border overflow-hidden"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                {loadingHistory && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <ChatBox
                    messages={messages}
                    onSend={handleSend}
                    onTyping={handleTyping}
                    isPartnerTyping={isPartnerTyping}
                    partnerName={activeUser.name}
                    partnerAvatar={activeUser.avatar}
                    myId={myId}
                    placeholder={`Message ${activeUser.name}`}
                  />
                )}
              </div>
            </>
          ) : (
            <div
              className="flex-1 rounded-2xl border flex flex-col items-center justify-center text-center px-8"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--bg-elevated)', color: 'var(--brand-primary)' }}
              >
                <MessageSquare size={30} />
              </div>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Select someone to chat
              </h2>
              <p className="text-xs sm:text-sm max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Choose any online anonymous visitor or any created account from the Direct Messages list to start a private conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
