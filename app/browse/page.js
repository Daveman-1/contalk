'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import WorkspaceShell from '@/components/WorkspaceShell';
import ChatBox from '@/components/ChatBox';
import UserList from '@/components/UserList';
import UserAvatar from '@/components/UserAvatar';
import { useNotifications } from '@/components/NotificationProvider';
import { getIdentity, getDmRoomId } from '@/lib/identity';

export default function BrowsePage() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [chatsByUserId, setChatsByUserId] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingByUserId, setTypingByUserId] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [myId, setMyId] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { setActiveDmPartnerId } = useNotifications();
  const socketRef = useRef(null);
  const activeUserIdRef = useRef(null);
  const myIdRef = useRef('');

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
    setActiveDmPartnerId(activeUserId);
    return () => setActiveDmPartnerId(null);
  }, [activeUserId, setActiveDmPartnerId]);

  const fetchRegisteredUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.users)) {
        setRegisteredUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, []);

  useEffect(() => {
    const syncIdentity = () => {
      const identity = getIdentity();
      setMyId(identity.id);
      myIdRef.current = identity.id;
      if (socketRef.current?.connected) {
        socketRef.current.emit('register', identity);
      }
    };

    syncIdentity();
    fetchRegisteredUsers();

    const socket = io(window.location.origin, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      const identity = getIdentity();
      myIdRef.current = identity.id;
      socket.emit('register', identity);
    });

    socket.on('online_users', (users) => {
      if (Array.isArray(users)) setOnlineUsers(users);
    });

    socket.on('accounts_updated', () => {
      fetchRegisteredUsers();
    });

    socket.on('dm_message', (msg) => {
      const currentMyId = myIdRef.current;
      const partnerId = msg.senderId === currentMyId ? msg.recipientId : msg.senderId;
      if (!partnerId) return;

      setChatsByUserId((prev) => {
        const existing = prev[partnerId] || [];
        if (msg.id && existing.some((m) => m.id === msg.id)) return prev;
        return {
          ...prev,
          [partnerId]: [
            ...existing,
            {
              id: msg.id,
              content: msg.content,
              sender: msg.sender,
              senderId: msg.senderId,
              senderAvatar: msg.senderAvatar || null,
              timestamp: msg.timestamp || new Date().toISOString(),
            },
          ],
        };
      });

      setTypingByUserId((prev) => ({ ...prev, [partnerId]: false }));

      if (msg.senderId !== currentMyId && activeUserIdRef.current !== partnerId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [partnerId]: (prev[partnerId] || 0) + 1,
        }));
      }
    });

    socket.on('dm_typing', ({ senderId, isTyping }) => {
      if (!senderId) return;
      setTypingByUserId((prev) => ({ ...prev, [senderId]: Boolean(isTyping) }));
    });

    window.addEventListener('auth_change', syncIdentity);
    return () => {
      window.removeEventListener('auth_change', syncIdentity);
      socket.disconnect();
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
        socketId: u.socketId,
      });
    }
    return Array.from(byId.values());
  }, [registeredUsers, onlineUsers]);

  const activeUser = useMemo(
    () => mergedUsers.find((u) => u.id === activeUserId) || null,
    [mergedUsers, activeUserId]
  );

  const handleChatWith = useCallback(async (user) => {
    setActiveUserId(user.id);
    setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));

    const identity = getIdentity();
    const roomId = getDmRoomId(identity.id, user.id);
    socketRef.current?.emit('join_dm', { roomId });

    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/messages?roomId=${encodeURIComponent(roomId)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setChatsByUserId((prev) => {
            const existing = prev[user.id] || [];
            const seen = new Set(data.messages.map((m) => m.id));
            const extras = existing.filter((m) => !m.id || !seen.has(m.id));
            return { ...prev, [user.id]: [...data.messages, ...extras] };
          });
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Auto-open DM when navigated from /feed?chatWith=<userId>
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

  const handleSend = (content) => {
    if (!activeUser || !socketRef.current) return;
    const identity = getIdentity();
    const roomId = getDmRoomId(identity.id, activeUser.id);
    const localId = `local_${Date.now()}_${Math.random()}`;

    socketRef.current.emit('dm_message', {
      roomId,
      recipientId: activeUser.id,
      content,
      sender: identity.name,
      senderId: identity.id,
      senderAvatar: identity.avatar,
    });

    setChatsByUserId((prev) => ({
      ...prev,
      [activeUser.id]: [
        ...(prev[activeUser.id] || []),
        {
          id: localId,
          content,
          sender: identity.name,
          senderId: identity.id,
          senderAvatar: identity.avatar,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  };

  const handleTyping = (isTyping) => {
    if (!activeUser || !socketRef.current) return;
    const identity = getIdentity();
    socketRef.current.emit('dm_typing', {
      recipientId: activeUser.id,
      senderId: identity.id,
      isTyping,
    });
  };

  const activeMessages = activeUser ? chatsByUserId[activeUser.id] || [] : [];

  return (
    <WorkspaceShell
      sectionLabel="Messages"
      pageLabel={activeUser ? `Chat with ${activeUser.name}` : 'Direct Chat'}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search people..."
      showMobileBottomNav={!activeUser}
    >
      {/* Image 2 Columns 2 + 3 */}
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
            unreadCounts={unreadCounts}
            filter={filter}
            onFilterChange={setFilter}
            search={search}
          />
        </div>

        {/* Column 3: Main Chat Window (Image 2 right canvas) */}
        <div
          className={`${activeUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 h-full p-4 sm:p-6`}
          style={{ background: 'var(--bg-app)' }}
        >
          {activeUser ? (
            <>
              {/* Chat Title Row (Image 2 "Chat with Noah Martinez") */}
              <div className="flex items-center justify-between gap-3 mb-4 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setActiveUserId(null)}
                    className="md:hidden btn-soft p-2"
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
                    size={40}
                    online={activeUser.online}
                  />
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      Chat with {activeUser.name}
                    </h1>
                    <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      <span className={activeUser.online ? 'online-dot' : 'offline-dot'} />
                      <span>
                        {activeUser.isAnon ? 'Anonymous user' : 'Registered account'} ·{' '}
                        {activeUser.online ? 'Online now' : 'Offline (messages saved)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rounded Bordered Chat Container (Image 2 style) */}
              <div
                className="flex-1 min-h-0 rounded-2xl border overflow-hidden"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                {loadingHistory && activeMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <ChatBox
                    messages={activeMessages}
                    onSend={handleSend}
                    onTyping={handleTyping}
                    isPartnerTyping={Boolean(typingByUserId[activeUser.id])}
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
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-2xl"
                style={{ background: 'var(--bg-elevated)' }}
              >
                💬
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
