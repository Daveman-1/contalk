'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import { getIdentity } from '@/lib/identity';

const FEED_TABS = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'anon', label: 'Anonymous' },
];

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (diffSec < 15) return 'just now';
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return new Date(isoString).toLocaleDateString();
}

function avatarGradient(name, isAnon) {
  if (isAnon) return 'linear-gradient(135deg, #475569, #334155)';
  const palette = [
    'linear-gradient(135deg, #6366F1, #8B5CF6)',
    'linear-gradient(135deg, #0EA5E9, #38BDF8)',
    'linear-gradient(135deg, #8B5CF6, #EC4899)',
    'linear-gradient(135deg, #4F46E5, #0EA5E9)',
  ];
  const str = String(name || 'A');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function FeedTimeline({
  hideComposer = false,
  externalSearch = '',
  showInlineSearch = true,
  extraSidebarContent = null,
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const [tab, setTab] = useState('latest');
  const [localSearch, setLocalSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [expandedPostIds, setExpandedPostIds] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replySubmitting, setReplySubmitting] = useState({});

  const [identity, setIdentity] = useState({ id: '', name: 'Anon', isAnon: true, avatar: 'cloud' });
  const [anonFallback, setAnonFallback] = useState({ id: '', name: 'Anon' });

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.posts)) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const syncIdentity = () => {
      const idObj = getIdentity();
      setIdentity(idObj);
      const storedAnonId = localStorage.getItem('ct_anon_id') || idObj.id;
      const storedAnonName = localStorage.getItem('ct_anon_name') || 'Anon';
      setAnonFallback({ id: storedAnonId, name: storedAnonName });
    };

    syncIdentity();
    fetchPosts();

    const poll = setInterval(() => {
      if (!document.hidden) fetchPosts();
    }, 5000);

    const onPostCreated = (e) => {
      const newPost = e?.detail;
      if (newPost && newPost.id) {
        setPosts((prev) => (prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]));
      } else {
        fetchPosts();
      }
    };

    window.addEventListener('auth_change', syncIdentity);
    window.addEventListener('posts_changed', onPostCreated);
    return () => {
      clearInterval(poll);
      window.removeEventListener('auth_change', syncIdentity);
      window.removeEventListener('posts_changed', onPostCreated);
    };
  }, [fetchPosts]);

  const getEffectiveAuthor = () => {
    if (!identity.isAnon && postAnonymously) {
      return {
        authorId: anonFallback.id || identity.id,
        authorName: anonFallback.name || 'Anon',
        authorAvatar: identity.avatar,
        isAnon: true,
      };
    }
    return {
      authorId: identity.id,
      authorName: identity.name,
      authorAvatar: identity.avatar,
      isAnon: identity.isAnon,
    };
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || posting) return;

    setError('');
    setPosting(true);
    try {
      const author = getEffectiveAuthor();
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: author.authorId,
          authorName: author.authorName,
          authorAvatar: author.authorAvatar,
          isAnon: author.isAnon,
          content: trimmed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not publish post');
      } else {
        setContent('');
        setPosts((prev) => (prev.some((p) => p.id === data.post.id) ? prev : [data.post, ...prev]));
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    if (!identity.id) return;
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: identity.id }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.post) {
        setPosts((prev) => prev.map((p) => (p.id === data.post.id ? data.post : p)));
      }
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleAddReply = async (postId) => {
    const text = (replyDrafts[postId] || '').trim();
    if (!text || replySubmitting[postId]) return;

    setReplySubmitting((prev) => ({ ...prev, [postId]: true }));
    try {
      const author = getEffectiveAuthor();
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: author.authorId,
          authorName: author.authorName,
          authorAvatar: author.authorAvatar,
          isAnon: author.isAnon,
          content: text,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.post) {
        setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
        setPosts((prev) => prev.map((p) => (p.id === data.post.id ? data.post : p)));
      }
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setReplySubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (post) => {
    const myIds = new Set([identity.id, anonFallback.id].filter(Boolean));
    const authorId = myIds.has(post.author_id) ? post.author_id : identity.id;
    try {
      const res = await fetch(
        `/api/posts/${encodeURIComponent(post.id)}?authorId=${encodeURIComponent(authorId)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) return;
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const trendingTags = useMemo(() => {
    const counts = new Map();
    for (const p of posts) {
      for (const tag of p.tags || []) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [posts]);

  const effectiveSearch = (externalSearch || localSearch).trim().toLowerCase();

  const visiblePosts = useMemo(() => {
    const list = posts
      .filter((p) => {
        if (tab === 'accounts') return !p.is_anon;
        if (tab === 'anon') return p.is_anon;
        return true;
      })
      .filter((p) => (!activeTag ? true : (p.tags || []).includes(activeTag)))
      .filter(
        (p) =>
          !effectiveSearch ||
          p.content.toLowerCase().includes(effectiveSearch) ||
          p.author_name.toLowerCase().includes(effectiveSearch) ||
          (p.tags || []).some((t) => t.includes(effectiveSearch.replace(/^#/, '')))
      );

    if (tab === 'popular') {
      return [...list].sort(
        (a, b) =>
          (b.likes?.length || 0) +
          (b.replies?.length || 0) -
          ((a.likes?.length || 0) + (a.replies?.length || 0))
      );
    }
    return list;
  }, [posts, tab, activeTag, effectiveSearch]);

  const renderContentWithTags = (text) => {
    const parts = String(text || '').split(/(#[a-zA-Z0-9_]{2,30})/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#') && part.length > 2) {
        const tag = part.slice(1).toLowerCase();
        return (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveTag((cur) => (cur === tag ? '' : tag))}
            className="hover:underline font-medium"
            style={{ color: 'var(--accent-purple)' }}
          >
            {part}
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const myIds = new Set([identity.id, anonFallback.id].filter(Boolean));
  const currentAuthorPreview = getEffectiveAuthor();

  return (
    <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_290px] gap-6 items-start">
      {/* Main Feed Column */}
      <div className="space-y-4 min-w-0">
        {/* Optional Post Composer */}
        {!hideComposer && (
          <form onSubmit={handleCreatePost} className="surface-card rounded-2xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <UserAvatar
                avatar={currentAuthorPreview.authorAvatar}
                seed={currentAuthorPreview.authorId}
                name={currentAuthorPreview.authorName}
                size={40}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Posting as</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {currentAuthorPreview.authorName}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                  >
                    {currentAuthorPreview.isAnon ? 'Anonymous' : 'Account'}
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleCreatePost(e);
                    }
                  }}
                  placeholder="What's happening? Share a thought or add #hashtags..."
                  maxLength={500}
                  rows={3}
                  className="w-full bg-transparent text-sm sm:text-base outline-none resize-none leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-4">
                {!identity.isAnon && (
                  <label className="inline-flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={postAnonymously}
                      onChange={(e) => setPostAnonymously(e.target.checked)}
                      className="accent-violet-500 rounded"
                    />
                    <span>Post anonymously</span>
                  </label>
                )}
                <span className="text-xs" style={{ color: content.length > 450 ? '#f59e0b' : 'var(--text-muted)' }}>
                  {content.length}/500
                </span>
              </div>

              <button
                type="submit"
                disabled={posting || !content.trim()}
                className="btn-cta text-xs sm:text-sm py-2 px-5"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        )}

        {/* Filter Tabs + Inline Search + Active Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="inline-flex p-1 rounded-xl border"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
          >
            {FEED_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: tab === t.id ? 'var(--bg-surface)' : 'transparent',
                  color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {showInlineSearch && (
              <div className="relative w-44 sm:w-52">
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Filter posts..."
                  className="themed-input py-1.5 pl-8 pr-3 text-xs"
                />
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            )}

            {activeTag && (
              <button
                onClick={() => setActiveTag('')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'var(--bg-active)',
                  color: 'var(--accent-purple)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span>#{activeTag}</span>
                <span>✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="surface-card rounded-2xl p-12 flex justify-center">
            <div className="spinner"></div>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="surface-card rounded-2xl p-12 text-center">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No posts yet</h3>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              {activeTag || effectiveSearch
                ? 'Try clearing your filter or search.'
                : 'Type something above to publish the first live post on ConTalk!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visiblePosts.map((post) => {
              const likedByMe = Array.isArray(post.likes) && post.likes.includes(identity.id);
              const likeCount = post.likes?.length || 0;
              const replyCount = post.replies?.length || 0;
              const isExpanded = Boolean(expandedPostIds[post.id]);
              const isMine = myIds.has(post.author_id);

              return (
                <article key={post.id} className="surface-card rounded-2xl p-5 animate-fadeIn">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        avatar={post.author_avatar}
                        seed={post.author_id || post.author_name}
                        name={post.author_name}
                        size={40}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {post.author_name}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              background: post.is_anon ? 'var(--bg-elevated)' : 'var(--bg-active)',
                              color: post.is_anon ? 'var(--text-muted)' : 'var(--accent-purple)',
                            }}
                          >
                            {post.is_anon ? 'Anonymous' : 'Account'}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            · {formatRelativeTime(post.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isMine && (
                        <Link
                          href={`/browse?chatWith=${encodeURIComponent(post.author_id)}`}
                          className="btn-soft text-xs px-2.5 py-1"
                        >
                          DM
                        </Link>
                      )}
                      {isMine && (
                        <button
                          onClick={() => handleDeletePost(post)}
                          className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:text-red-500"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <p
                    className="mt-3 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {renderContentWithTags(post.content)}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t flex items-center gap-5" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                      style={{ color: likedByMe ? '#ec4899' : 'var(--text-muted)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={likedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                      <span>{likeCount}</span>
                    </button>

                    <button
                      onClick={() =>
                        setExpandedPostIds((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                      style={{ color: isExpanded ? 'var(--accent-purple)' : 'var(--text-muted)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      <span>{replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}</span>
                    </button>
                  </div>

                  {/* Replies Thread */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t space-y-3 animate-fadeIn" style={{ borderColor: 'var(--border-subtle)' }}>
                      {(post.replies || []).length > 0 && (
                        <div className="space-y-2 pl-3 border-l-2" style={{ borderColor: 'var(--border-strong)' }}>
                          {post.replies.map((reply) => (
                            <div key={reply.id} className="rounded-xl px-3.5 py-2.5 flex items-start gap-2.5" style={{ background: 'var(--bg-elevated)' }}>
                              <UserAvatar
                                avatar={reply.author_avatar}
                                seed={reply.author_id || reply.author_name}
                                name={reply.author_name}
                                size={26}
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {reply.author_name}
                                  </span>
                                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                    {formatRelativeTime(reply.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)' }}>
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyDrafts[post.id] || ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddReply(post.id);
                            }
                          }}
                          maxLength={300}
                          placeholder={`Reply as ${currentAuthorPreview.authorName}...`}
                          className="themed-input flex-1 py-2 px-3 text-xs sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddReply(post.id)}
                          disabled={replySubmitting[post.id] || !(replyDrafts[post.id] || '').trim()}
                          className="btn-cta text-xs py-2 px-4"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="space-y-4">
        {extraSidebarContent}

        <div className="surface-card rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent-purple)' }}>#</span> Trending Tags
          </h2>
          {trendingTags.length === 0 ? (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Add <span style={{ color: 'var(--accent-purple)' }}>#hashtags</span> to posts and trending topics appear here.
            </p>
          ) : (
            <div className="space-y-1.5">
              {trendingTags.map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag((cur) => (cur === tag ? '' : tag))}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all"
                  style={{
                    background: activeTag === tag ? 'var(--bg-active)' : 'var(--bg-elevated)',
                    color: activeTag === tag ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  }}
                >
                  <span className="font-medium truncate">#{tag}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
