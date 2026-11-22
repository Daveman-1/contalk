'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import WorkspaceShell from '@/components/WorkspaceShell';
import ChatBox from '@/components/ChatBox';
import UserAvatar from '@/components/UserAvatar';
import { getIdentity } from '@/lib/identity';

const ROOM_ICONS = ['💬', '💻', '🎮', '🎧', '🕵️', '🔥', '🚀', '🎨', '📚', '🌍', '🎬', '⚡'];

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messagesByRoom, setMessagesByRoom] = useState({});
  const [roomPresence, setRoomPresence] = useState({});
  const [typingUsersByRoom, setTypingUsersByRoom] = useState({});
  const [search, setSearch] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [myId, setMyId] = useState('');

  const [newRoom, setNewRoom] = useState({ name: '', description: '', icon: '💬' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const socketRef = useRef(null);
  const activeRoomIdRef = useRef(null);
  const myIdRef = useRef('');

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.rooms)) setRooms(data.rooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
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
    fetchRooms();

    const socket = io(window.location.origin, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      const identity = getIdentity();
      myIdRef.current = identity.id;
      socket.emit('register', identity);
      if (activeRoomIdRef.current) {
        socket.emit('join_room', { roomId: activeRoomIdRef.current });
      }
    });

    socket.on('room_presence', (summary) => {
      if (summary && typeof summary === 'object') setRoomPresence(summary);
    });

    socket.on('rooms_updated', () => {
      fetchRooms();
    });

    socket.on('room_message', (msg) => {
      if (!msg || !msg.roomId) return;
      setMessagesByRoom((prev) => {
        const existing = prev[msg.roomId] || [];
        if (msg.id && existing.some((m) => m.id === msg.id)) return prev;
        return {
          ...prev,
          [msg.roomId]: [
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

      setTypingUsersByRoom((prev) => {
        const current = { ...(prev[msg.roomId] || {}) };
        delete current[msg.senderId];
        return { ...prev, [msg.roomId]: current };
      });
    });

    socket.on('room_typing', ({ roomId, senderId, senderName, isTyping }) => {
      if (!roomId || !senderId || senderId === myIdRef.current) return;
      setTypingUsersByRoom((prev) => {
        const current = { ...(prev[roomId] || {}) };
        if (isTyping) current[senderId] = senderName;
        else delete current[senderId];
        return { ...prev, [roomId]: current };
      });
    });

    window.addEventListener('auth_change', syncIdentity);
    return () => {
      window.removeEventListener('auth_change', syncIdentity);
      socket.disconnect();
    };
  }, [fetchRooms]);

  const handleSelectRoom = useCallback(async (room) => {
    setActiveRoomId(room.id);
    setShowMembers(false);
    socketRef.current?.emit('join_room', { roomId: room.id });

    setLoadingHistory(true);
    try {
      const dbRoomId = `chatroom:${room.id}`;
      const res = await fetch(`/api/messages?roomId=${encodeURIComponent(dbRoomId)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessagesByRoom((prev) => {
            const existing = prev[room.id] || [];
            const seen = new Set(data.messages.map((m) => m.id));
            const extras = existing.filter((m) => !m.id || !seen.has(m.id));
            return { ...prev, [room.id]: [...data.messages, ...extras] };
          });
        }
      }
    } catch (err) {
      console.error('Failed to load room history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Auto-select from ?room=... query param or default first room on desktop
  useEffect(() => {
    if (rooms.length === 0 || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('room');
    if (requested) {
      const found = rooms.find((r) => r.id === requested || r.slug === requested);
      if (found && activeRoomId !== found.id) {
        handleSelectRoom(found);
        return;
      }
    }
    if (!activeRoomId && window.innerWidth >= 768) {
      handleSelectRoom(rooms[0]);
    }
  }, [rooms, activeRoomId, handleSelectRoom]);

  const handleSend = (content) => {
    if (!activeRoomId || !socketRef.current) return;
    const identity = getIdentity();
    socketRef.current.emit('room_message', {
      roomId: activeRoomId,
      content,
      sender: identity.name,
      senderId: identity.id,
      senderAvatar: identity.avatar,
    });
  };

  const handleTyping = (isTyping) => {
    if (!activeRoomId || !socketRef.current) return;
    const identity = getIdentity();
    socketRef.current.emit('room_typing', {
      roomId: activeRoomId,
      senderId: identity.id,
      senderName: identity.name,
      isTyping,
    });
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
      const identity = getIdentity();
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoom.name,
          description: newRoom.description,
          icon: newRoom.icon,
          createdBy: identity.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create room');
      } else {
        setShowCreateModal(false);
        setNewRoom({ name: '', description: '', icon: '💬' });
        await fetchRooms();
        socketRef.current?.emit('room_created', data.room);
        handleSelectRoom(data.room);
      }
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
    );
  }, [rooms, search]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) || null,
    [rooms, activeRoomId]
  );

  const activeMembers = activeRoom ? roomPresence[activeRoom.id] || [] : [];
  const activeMessages = activeRoom ? messagesByRoom[activeRoom.id] || [] : [];

  const typingNames = useMemo(() => {
    if (!activeRoom) return [];
    return Object.values(typingUsersByRoom[activeRoom.id] || {});
  }, [activeRoom, typingUsersByRoom]);

  const typingLabel =
    typingNames.length === 1
      ? typingNames[0]
      : typingNames.length > 1
        ? `${typingNames.length} people`
        : '';

  return (
    <WorkspaceShell
      sectionLabel="Chat Rooms"
      pageLabel={activeRoom ? `#${activeRoom.slug}` : 'All Channels'}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search rooms..."
      showMobileBottomNav={!activeRoom}
    >
      <div className="h-full flex overflow-hidden">
        {/* Column 2: Rooms List (Image 2 Middle Panel) */}
        <div
          className={`${activeRoom ? 'hidden md:flex' : 'flex'} w-full md:w-[270px] flex-shrink-0 flex-col border-r h-full px-4 py-4`}
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-panel)' }}
        >
          <button
            onClick={() => {
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="btn-cta w-full py-2.5 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 mb-4"
          >
            <span>+</span>
            <span>New Room</span>
          </button>

          <div className="pb-2 px-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Channels
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{filteredRooms.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
            {filteredRooms.length === 0 ? (
              <div className="py-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                No rooms match &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredRooms.map((room) => {
                const count = (roomPresence[room.id] || []).length;
                const isSelected = activeRoom?.id === room.id;

                return (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
                    className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-left"
                    style={{ background: isSelected ? 'var(--bg-active)' : 'transparent' }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      {room.icon || '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[13px] truncate"
                        style={{ color: 'var(--text-primary)', fontWeight: isSelected ? 600 : 500 }}
                      >
                        #{room.slug}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {room.name}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      <span className={count > 0 ? 'online-dot' : 'offline-dot'} style={{ width: 6, height: 6 }} />
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Active Room Chat (Image 2 Right Canvas) */}
        <div
          className={`${activeRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 h-full p-4 sm:p-6`}
          style={{ background: 'var(--bg-app)' }}
        >
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-4 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => {
                      socketRef.current?.emit('leave_room', { roomId: activeRoom.id });
                      setActiveRoomId(null);
                    }}
                    className="md:hidden btn-soft p-2"
                    aria-label="Back to rooms"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{activeRoom.icon || '💬'}</span>
                      <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {activeRoom.name}
                      </h1>
                      <span className="text-xs font-mono" style={{ color: 'var(--accent-purple)' }}>
                        #{activeRoom.slug}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {activeRoom.description || 'Public group chat room'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowMembers((v) => !v)}
                  className="btn-soft px-3 py-1.5 text-xs flex items-center gap-2 flex-shrink-0"
                >
                  <span className="online-dot"></span>
                  <span>{activeMembers.length} in room</span>
                </button>
              </div>

              {/* Members Popover Strip */}
              {showMembers && (
                <div
                  className="mb-3 px-4 py-2.5 rounded-xl border flex flex-wrap items-center gap-2 animate-fadeIn flex-shrink-0"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>In room:</span>
                  {activeMembers.length === 0 ? (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Just you</span>
                  ) : (
                    activeMembers.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 text-xs pl-1 pr-2.5 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                      >
                        <UserAvatar avatar={m.avatar} seed={m.id} name={m.name} size={20} />
                        {m.name}
                      </span>
                    ))
                  )}
                </div>
              )}

              {/* Rounded Bordered Chat Container */}
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
                    isPartnerTyping={typingNames.length > 0}
                    partnerName={typingLabel}
                    myId={myId}
                    placeholder={`Message #${activeRoom.slug}`}
                  />
                )}
              </div>
            </>
          ) : (
            <div
              className="flex-1 rounded-2xl border flex flex-col items-center justify-center text-center px-8"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="text-3xl mb-3">💬</div>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Pick a Room</h2>
              <p className="text-xs sm:text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
                Join any channel on the left or create your own room to chat with everyone live.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="surface-card rounded-2xl p-6 sm:p-7 w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create Chat Room</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {ROOM_ICONS.map((icon) => (
                    <button
                      type="button"
                      key={icon}
                      onClick={() => setNewRoom((r) => ({ ...r, icon }))}
                      className="h-10 rounded-xl text-lg flex items-center justify-center transition-all border"
                      style={{
                        background: newRoom.icon === icon ? 'var(--bg-active)' : 'var(--bg-elevated)',
                        borderColor: newRoom.icon === icon ? 'var(--accent-purple)' : 'var(--border-subtle)',
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Room Name</label>
                <input
                  type="text"
                  className="themed-input py-2.5 px-3.5 text-sm"
                  placeholder="e.g. Late Night Talks"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom((r) => ({ ...r, name: e.target.value }))}
                  required
                  minLength={2}
                  maxLength={32}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <input
                  type="text"
                  className="themed-input py-2.5 px-3.5 text-sm"
                  placeholder="What is this room about?"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom((r) => ({ ...r, description: e.target.value }))}
                  maxLength={140}
                />
              </div>

              {createError && (
                <div className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-soft flex-1 py-2.5 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn-cta flex-1 py-2.5 text-sm">
                  {creating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
