'use client';

import { useEffect, useRef, useState } from 'react';
import StickerPicker from '@/components/StickerPicker';
import GifPicker from '@/components/GifPicker';
import StickerGraphic from '@/components/StickerGraphic';
import UserAvatar from '@/components/UserAvatar';
import { parseStickerMessage, parseGifMessage } from '@/lib/stickers';

export default function ChatBox({
  messages,
  onSend,
  onTyping,
  isPartnerTyping = false,
  partnerName = 'Stranger',
  partnerAvatar = null,
  placeholder = 'Message...',
  myId,
  disabled = false,
}) {
  const [input, setInput] = useState('');
  const [openDrawer, setOpenDrawer] = useState(null); // null | 'stickers' | 'gifs'
  const bottomRef = useRef(null);
  const pickerWrapperRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (pickerWrapperRef.current && !pickerWrapperRef.current.contains(e.target)) {
        setOpenDrawer(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping?.(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    if (!onTyping || disabled) return;

    if (val.trim().length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTyping(true);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTyping(false);
      }, 1500);
    } else {
      stopTyping();
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || disabled) return;
    stopTyping();
    onSend(text);
    setInput('');
  };

  const handleSendMediaToken = (encoded) => {
    if (disabled || !encoded) return;
    stopTyping();
    onSend(encoded);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedMessages = groupMessages(messages);
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-5">
        <div className="flex justify-center">
          <span
            className="text-[11px] font-medium px-3 py-1 rounded-full"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          >
            {todayLabel}
          </span>
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="mb-3 opacity-40">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <p>No messages yet. Say hello, drop a sticker, or send a GIF!</p>
          </div>
        )}

        {groupedMessages.map((group, gi) => {
          const isMe = group.senderId === myId;
          const lastMsg = group.messages[group.messages.length - 1];

          return (
            <div key={gi} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`flex items-start gap-2 sm:gap-2.5 max-w-[86%] sm:max-w-[78%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && (
                  <UserAvatar
                    avatar={group.senderAvatar}
                    seed={group.senderId || group.sender}
                    name={group.sender}
                    size={32}
                    className="mt-0.5"
                  />
                )}

                <div className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                  {group.messages.map((msg, mi) => {
                    const sticker = parseStickerMessage(msg.content);
                    if (sticker) {
                      return (
                        <div
                          key={msg.id || mi}
                          className="animate-stickerPop py-1 transition-transform hover:scale-105"
                        >
                          {sticker.type === 'giphy' ? (
                            <img
                              src={sticker.url}
                              alt="GIPHY Sticker"
                              loading="lazy"
                              className="w-[132px] h-[132px] object-contain drop-shadow-md select-none"
                            />
                          ) : (
                            <StickerGraphic id={sticker.id} size={124} />
                          )}
                        </div>
                      );
                    }

                    const gif = parseGifMessage(msg.content);
                    if (gif) {
                      return (
                        <div
                          key={msg.id || mi}
                          className="animate-stickerPop rounded-2xl overflow-hidden border max-w-[230px] shadow-md"
                          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
                        >
                          <img
                            src={gif.url}
                            alt="GIPHY GIF"
                            className="w-full h-auto max-h-[220px] object-cover block"
                            loading="lazy"
                          />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id || mi}
                        className={`px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                          isMe ? 'bubble-mine' : 'bubble-other'
                        }`}
                      >
                        {msg.content}
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-2 px-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {!isMe && <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{group.sender}</span>}
                    <span>{formatTime(lastMsg.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2.5 animate-fadeIn">
            <UserAvatar avatar={partnerAvatar} seed={partnerName} name={partnerName} size={32} />
            <div
              className="px-3.5 py-2 rounded-2xl inline-flex items-center gap-1.5"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '300ms' }} />
            </div>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {partnerName} is typing
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Bottom Input Bar with Stickers & GIPHY GIFs */}
      <div
        className="p-2.5 sm:p-4 border-t relative"
        style={{
          borderColor: 'var(--border-subtle)',
          paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          ref={pickerWrapperRef}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-2xl border relative"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
        >
          {/* Floating Sticker or GIF Drawer */}
          {openDrawer === 'stickers' && !disabled && (
            <div className="absolute bottom-full left-0 mb-2.5 z-40">
              <StickerPicker
                onSelect={handleSendMediaToken}
                onClose={() => setOpenDrawer(null)}
              />
            </div>
          )}
          {openDrawer === 'gifs' && !disabled && (
            <div className="absolute bottom-full left-0 mb-2.5 z-40">
              <GifPicker
                onSelect={handleSendMediaToken}
                onClose={() => setOpenDrawer(null)}
              />
            </div>
          )}

          {/* Sticker Button */}
          <button
            type="button"
            onClick={() => setOpenDrawer((cur) => (cur === 'stickers' ? null : 'stickers'))}
            disabled={disabled}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            style={{
              background: openDrawer === 'stickers' ? 'var(--bg-active)' : 'var(--bg-hover)',
              color: openDrawer === 'stickers' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            }}
            title="Stickers"
            aria-label="Open stickers"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
              <path d="M15 3v6h6" />
              <circle cx="9.5" cy="11.5" r="0.8" fill="currentColor" />
              <circle cx="14.5" cy="11.5" r="0.8" fill="currentColor" />
              <path d="M9 15c.8 1 2 1.5 3 1.5s2.2-.5 3-1.5" />
            </svg>
          </button>

          {/* GIF Button */}
          <button
            type="button"
            onClick={() => setOpenDrawer((cur) => (cur === 'gifs' ? null : 'gifs'))}
            disabled={disabled}
            className="h-8 px-2 rounded-xl flex items-center justify-center text-[11px] font-extrabold tracking-tight transition-colors flex-shrink-0"
            style={{
              background: openDrawer === 'gifs' ? 'var(--bg-active)' : 'var(--bg-hover)',
              color: openDrawer === 'gifs' ? 'var(--brand-mint)' : 'var(--text-secondary)',
            }}
            title="Send a GIPHY GIF"
            aria-label="Open GIFs"
          >
            GIF
          </button>

          <textarea
            className="flex-1 bg-transparent outline-none resize-none text-sm py-1 px-1"
            style={{ color: 'var(--text-primary)', minHeight: '32px', maxHeight: '110px' }}
            placeholder={disabled ? 'Chat ended' : placeholder}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="btn-cta px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm flex-shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function groupMessages(messages) {
  const groups = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (last && last.senderId === msg.senderId) {
      last.messages.push(msg);
      if (msg.senderAvatar) last.senderAvatar = msg.senderAvatar;
    } else {
      groups.push({
        senderId: msg.senderId,
        sender: msg.sender,
        senderAvatar: msg.senderAvatar || null,
        messages: [msg],
      });
    }
  }
  return groups;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
