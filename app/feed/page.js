'use client';

import { useState } from 'react';
import Link from 'next/link';
import WorkspaceShell from '@/components/WorkspaceShell';
import FeedTimeline from '@/components/FeedTimeline';

export default function FeedPage() {
  const [search, setSearch] = useState('');

  const sidebarShortcuts = (
    <div className="surface-card rounded-2xl p-5 space-y-3">
      <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Live Chat Modes</h2>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Switch from posting to real-time conversations anytime.
      </p>
      <div className="space-y-2">
        <Link href="/rooms" className="block">
          <button className="btn-soft w-full text-xs py-2.5">Open Chat Rooms →</button>
        </Link>
        <Link href="/random" className="block">
          <button className="btn-cta w-full text-xs py-2.5">Start Random Chat →</button>
        </Link>
      </div>
    </div>
  );

  return (
    <WorkspaceShell
      sectionLabel="Posts"
      pageLabel="Live Feed"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search posts or #tags..."
      showMobileBottomNav={true}
    >
      <div className="h-full overflow-y-auto p-4 sm:p-6" style={{ background: 'var(--bg-app)' }}>
        <FeedTimeline
          hideComposer={false}
          externalSearch={search}
          showInlineSearch={false}
          extraSidebarContent={sidebarShortcuts}
        />
      </div>
    </WorkspaceShell>
  );
}
