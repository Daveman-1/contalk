'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import WorkspaceShell from '@/components/WorkspaceShell';
import ChatBox from '@/components/ChatBox';
import UserAvatar from '@/components/UserAvatar';
import RoomIcon, { ROOM_ICON_KEYS } from '@/components/RoomIcon';
import { MessageSquare, X } from 'lucide-react';
import { useNotifications } from '@/components/NotificationProvider';
import { getIdentity } from '@/lib/identity';

const ROOM_ICONS = ROOM_ICON_KEYS;

export default function RoomsPage() {
  const { roomPresence, setActiveRoomId: reportActiveRoom } = useNotifications();
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [myId, setMyId] = useState('');

  const [newRoom, setNewRoom] = useState({ name: '', description: '', icon: 'message' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

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
    const syncIdentity = () => setMyId(getIdentity().id);
    syncIdentity();
    fetchRooms();

    const roomsTimer = setInterval(() => {
      if (!document.hidden) fetchRooms();
    }, 12000);

    window.addEventListener('auth_change', syncIdentity);
    return () => {
      clearInterval(roomsTimer);
      window.removeEventListener('auth_change', syncIdentity);
      reportActiveRoom(null);
    };
  }, [fetchRooms, reportActiveRoom]);

  const pollRoomMessages = useCallback(async (roomId, initial = false) => {
    const identity = getIdentity();
    if (!roomId) return;
    const dbRoomId = `chatroom:${roomId}`;
    if (initial) setLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/messages?roomId=${encodeURIComponent(dbRoomId)}&myId=${encodeURIComponent(identity.id)}`,
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
      setTypingUsers(Array.isArray(data.typingUsers) ? data.typingUsers : []);
    } catch {
    } finally {
      if (initial) setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    reportActiveRoom(activeRoomId);
    if (!activeRoomId) {
      setMessages([]);
      setTypingUsers([]);
      return;
    }

    pollRoomMessages(activeRoomId, true);
    const timer = setInterval(() => {
      if (!document.hidden) pollRoomMessages(activeRoomId, false);
    }, 1500);

    return () => clearInterval(timer);
  }, [activeRoomId, pollRoomMessages, reportActiveRoom]);

  const handleSelectRoom = useCallback((room) => {
    setActiveRoomId(room.id);
    setShowMembers(false);
  }, []);

  // Auto-select from ?room=... or default first room on desktop
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

  const handleSend = async (content) => {
    if (!activeRoomId) return;
    const identity = getIdentity();
    const dbRoomId = `chatroom:${activeRoomId}`;
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
          roomId: dbRoomId,
          content,
          sender: identity.name,
          senderId: identity.id,
          senderAvatar: identity.avatar,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => prev.map((m) => (m.id === optimisticId ? data.message : m)));
        }
      }
    } catch (err) {
      console.error('Failed to send room message:', err);
    }
  };

  const handleTyping = (isTyping) => {
    if (!activeRoomId) return;
    const identity = getIdentity();
    fetch('/api/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: `chatroom:${activeRoomId}`,
        userId: identity.id,
        userName: identity.name,
        isTyping,
      }),
    }).catch(() => {});
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
        setNewRoom({ name: '', description: '', icon: 'message' });
        await fetchRooms();
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
  const typingLabel =
    typingUsers.length === 1
      ? typingUsers[0].userName
      : typingUsers.length > 1
        ? `${typingUsers.length} people`
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
        {/* Column 2: Rooms List */}
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
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                    >
                      <RoomIcon icon={room.icon} size={16} />
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

        {/* Column 3: Active Room Chat (edge-to-edge on mobile for max typing space) */}
        <div
          className={`${activeRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 h-full p-0 sm:p-6`}
          style={{ background: 'var(--bg-app)' }}
        >
          {activeRoom ? (
            <>
              <div
                className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-0 sm:py-0 sm:mb-4 border-b sm:border-b-0 flex-shrink-0"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setActiveRoomId(null)}
                    className="md:hidden btn-soft p-2 flex-shrink-0"
                    aria-label="Back to rooms"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)', color: 'var(--brand-primary)' }}>
                        <RoomIcon icon={activeRoom.icon} size={18} />
                      </span>
                      <h1 className="text-sm sm:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {activeRoom.name}
                      </h1>
                      <span className="hidden sm:inline text-xs font-mono" style={{ color: 'var(--accent-purple)' }}>
                        #{activeRoom.slug}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {activeRoom.description || 'Public group chat room'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowMembers((v) => !v)}
                  className="btn-soft px-2.5 sm:px-3 py-1.5 text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  <span className="online-dot"></span>
                  <span>{activeMembers.length}</span>
                  <span className="hidden sm:inline">in room</span>
                </button>
              </div>

              {showMembers && (
                <div
                  className="px-3 sm:px-4 py-2.5 sm:mb-3 border-b sm:border sm:rounded-xl flex flex-wrap items-center gap-2 animate-fadeIn flex-shrink-0"
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
                    isPartnerTyping={typingUsers.length > 0}
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
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'var(--bg-elevated)', color: 'var(--brand-primary)' }}
              >
                <MessageSquare size={28} />
              </div>
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
                className="p-1 rounded-lg hover:bg-[var(--bg-hover)] text-sm flex items-center justify-center"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
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
                      className="h-10 rounded-xl flex items-center justify-center transition-all border"
                      style={{
                        background: newRoom.icon === icon ? 'var(--bg-active)' : 'var(--bg-elevated)',
                        borderColor: newRoom.icon === icon ? 'var(--accent-purple)' : 'var(--border-subtle)',
                        color: newRoom.icon === icon ? 'var(--accent-purple)' : 'var(--text-secondary)',
                      }}
                    >
                      <RoomIcon icon={icon} size={18} />
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
