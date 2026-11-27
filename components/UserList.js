'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import { Radio, AtSign, Shield } from 'lucide-react';

export default function UserList({
  users,
  onChat,
  activeUserId,
  myId,
  unreadCounts = {},
  filter = 'all',
  onFilterChange = () => {},
  search = '',
}) {
  const onlineOthers = useMemo(
    () => users.filter((u) => u.id !== myId && u.online !== false),
    [users, myId]
  );

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return onlineOthers
      .filter((u) => {
        if (filter === 'accounts') return !u.isAnon;
        if (filter === 'anon') return u.isAnon;
        return true;
      })
      .filter((u) => (!query ? true : u.name.toLowerCase().includes(query)))
      .sort((a, b) => {
        const unreadDiff = (unreadCounts[b.id] || 0) - (unreadCounts[a.id] || 0);
        if (unreadDiff !== 0) return unreadDiff;
        if (a.isAnon !== b.isAnon) return a.isAnon ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
  }, [onlineOthers, filter, search, unreadCounts]);

  const counts = useMemo(
    () => ({
      all: onlineOthers.length,
      accounts: onlineOthers.filter((u) => !u.isAnon).length,
      anon: onlineOthers.filter((u) => u.isAnon).length,
    }),
    [onlineOthers]
  );

  const quickItems = [
    { id: 'all', label: 'Online Now', icon: Radio, count: counts.all, green: true },
    { id: 'accounts', label: 'Accounts', icon: AtSign, count: counts.accounts },
    { id: 'anon', label: 'Anonymous', icon: Shield, count: counts.anon },
  ];

  return (
    <div className="flex flex-col h-full px-4 py-4">
      {/* Top Action Button (Exact Image 2 "New Message" dark pill) */}
      <Link href="/random" className="block mb-4">
        <button className="btn-cta w-full py-2.5 px-4 text-xs sm:text-sm flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span>Random Match</span>
        </button>
      </Link>

      {/* Image 2 Quick Links / Filter Rows */}
      <div className="space-y-0.5 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <Link
          href="/rooms"
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span className="flex items-center gap-2.5">
            <span className="w-4 text-center font-bold">#</span>
            <span>Chat Rooms</span>
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>→</span>
        </Link>

        {quickItems.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onFilterChange(item.id)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors"
              style={{
                background: active ? 'var(--bg-active)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 500,
              }}
            >
              <span className="flex items-center gap-2.5">
                <span className="w-4 flex items-center justify-center text-xs" style={{ color: item.green ? '#22c55e' : 'inherit' }}>
                  <item.icon size={14} />
                </span>
                <span>{item.label}</span>
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.count}</span>
            </button>
          );
        })}
      </div>

      {/* Online Users Heading */}
      <div className="pt-4 pb-2 px-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Online Now
        </span>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{visibleUsers.length}</span>
      </div>

      {/* Scrollable Avatar User List */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
        {visibleUsers.length === 0 ? (
          <div className="py-8 text-center text-xs px-3 space-y-3" style={{ color: 'var(--text-muted)' }}>
            <p className="leading-relaxed">
              {search
                ? 'No matching online users.'
                : 'Be the first to start a conversation — no one else is online in Direct Messages yet.'}
            </p>
            {!search && (
              <div className="flex flex-col gap-2">
                <Link href="/rooms" className="btn-soft py-2 px-3 text-xs block">
                  Join a Chat Room →
                </Link>
                <Link href="/feed" className="btn-soft py-2 px-3 text-xs block">
                  Publish on Live Feed →
                </Link>
              </div>
            )}
          </div>
        ) : (
          visibleUsers.map((user) => {
            const unread = unreadCounts[user.id] || 0;
            const isSelected = activeUserId === user.id;

            return (
              <button
                key={user.id}
                onClick={() => onChat(user)}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all text-left"
                style={{
                  background: isSelected ? 'var(--bg-active)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Illustrated Avatar + Online Dot */}
                <UserAvatar
                  avatar={user.avatar}
                  seed={user.id}
                  name={user.name}
                  size={34}
                  online={user.online}
                />

                {/* Name & tag */}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[13px] truncate"
                    style={{
                      color: 'var(--text-primary)',
                      fontWeight: isSelected || unread > 0 ? 600 : 500,
                    }}
                  >
                    {user.name}
                  </div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {user.isAnon ? 'Anonymous' : 'Account'} · {user.online ? 'Online' : 'Offline'}
                  </div>
                </div>

                {unread > 0 && (
                  <span
                    className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center text-white"
                    style={{ background: '#6366F1' }}
                  >
                    {unread}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
