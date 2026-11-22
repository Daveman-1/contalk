'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import WorkspaceShell from '@/components/WorkspaceShell';
import ChatBox from '@/components/ChatBox';
import UserAvatar from '@/components/UserAvatar';
import { getIdentity } from '@/lib/identity';

const STATES = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  CHATTING: 'chatting',
  DISCONNECTED: 'disconnected',
};

const CATEGORIES = [
  { id: 'male', label: 'Male', icon: '♂' },
  { id: 'female', label: 'Female', icon: '♀' },
];

export default function RandomChatPage() {
  const [chatState, setChatState] = useState(STATES.IDLE);
  const [messages, setMessages] = useState([]);
  const [strangerName, setStrangerName] = useState('Stranger');
  const [strangerIsAnon, setStrangerIsAnon] = useState(true);
  const [strangerGender, setStrangerGender] = useState('male');
  const [strangerAvatar, setStrangerAvatar] = useState(null);
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [queueCounts, setQueueCounts] = useState({ male: 0, female: 0 });

  const [myGender, setMyGender] = useState('male');
  const [lookingFor, setLookingFor] = useState('female');

  const [myId, setMyId] = useState('');
  const [myName, setMyName] = useState('');
  const socketRef = useRef(null);
  const roomIdRef = useRef(null);

  useEffect(() => {
    try {
      const savedGender = localStorage.getItem('ct_gender');
      const savedTarget = localStorage.getItem('ct_looking_for');
      if (savedGender === 'male' || savedGender === 'female') setMyGender(savedGender);
      if (savedTarget === 'male' || savedTarget === 'female') setLookingFor(savedTarget);
    } catch {}
  }, []);

  const updateMyGender = (g) => {
    setMyGender(g);
    try {
      localStorage.setItem('ct_gender', g);
    } catch {}
  };

  const updateLookingFor = (g) => {
    setLookingFor(g);
    try {
      localStorage.setItem('ct_looking_for', g);
    } catch {}
  };

  useEffect(() => {
    const syncIdentity = () => {
      const identity = getIdentity();
      setMyId(identity.id);
      setMyName(identity.name);
      if (socketRef.current?.connected) {
        socketRef.current.emit('register', identity);
      }
    };

    syncIdentity();

    const socket = io(window.location.origin, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register', getIdentity());
    });

    socket.on('online_users', (users) => {
      setOnlineCount(Array.isArray(users) ? users.length : 0);
    });

    socket.on('random_queue_counts', (counts) => {
      if (counts && typeof counts === 'object') {
        setQueueCounts({
          male: Number(counts.male) || 0,
          female: Number(counts.female) || 0,
        });
      }
    });

    socket.on('waiting', () => {
      setIsStrangerTyping(false);
      setChatState(STATES.SEARCHING);
    });

    socket.on('matched', ({ roomId, stranger, strangerIsAnon: isAnon, strangerAvatar: sAvatar, strangerGender: sGender }) => {
      roomIdRef.current = roomId;
      setStrangerName(stranger || 'Stranger');
      setStrangerIsAnon(isAnon !== false);
      setStrangerAvatar(sAvatar || null);
      setStrangerGender(sGender === 'female' ? 'female' : 'male');
      setMessages([]);
      setIsStrangerTyping(false);
      setChatState(STATES.CHATTING);
    });

    socket.on('random_message', ({ content, sender, senderAvatar, timestamp }) => {
      setIsStrangerTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_${Math.random()}`,
          content,
          sender,
          senderId: 'stranger',
          senderAvatar: senderAvatar || null,
          timestamp: timestamp || new Date().toISOString(),
        },
      ]);
    });

    socket.on('random_typing', ({ isTyping }) => {
      setIsStrangerTyping(Boolean(isTyping));
    });

    socket.on('stranger_disconnected', () => {
      setIsStrangerTyping(false);
      setChatState(STATES.DISCONNECTED);
      roomIdRef.current = null;
    });

    window.addEventListener('auth_change', syncIdentity);
    return () => {
      window.removeEventListener('auth_change', syncIdentity);
      socket.disconnect();
    };
  }, []);

  const handleStart = () => {
    if (!socketRef.current) return;
    setMessages([]);
    setIsStrangerTyping(false);
    setChatState(STATES.SEARCHING);
    socketRef.current.emit('join_queue', { gender: myGender, lookingFor });
  };

  const handleSkip = () => {
    if (!socketRef.current) return;
    setMessages([]);
    setIsStrangerTyping(false);
    roomIdRef.current = null;
    setChatState(STATES.SEARCHING);
    socketRef.current.emit('skip', {
      requeue: true,
      gender: myGender,
      lookingFor,
    });
  };

  const handleStop = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('skip', { requeue: false });
    setMessages([]);
    setIsStrangerTyping(false);
    roomIdRef.current = null;
    setChatState(STATES.IDLE);
  };

  const handleSend = (content) => {
    if (!socketRef.current || !roomIdRef.current) return;
    const identity = getIdentity();
    socketRef.current.emit('random_message', {
      roomId: roomIdRef.current,
      content,
      sender: myName,
      senderAvatar: identity.avatar,
    });
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random()}`,
        content,
        sender: myName,
        senderId: myId,
        senderAvatar: identity.avatar,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleTyping = (isTyping) => {
    if (!socketRef.current || !roomIdRef.current) return;
    socketRef.current.emit('random_typing', { roomId: roomIdRef.current, isTyping });
  };

  const genderLabel = (g) => (g === 'female' ? 'Female' : 'Male');

  return (
    <WorkspaceShell
      sectionLabel="Random Chat"
      pageLabel={
        chatState === STATES.CHATTING
          ? `Chat with ${strangerName} (${genderLabel(strangerGender)})`
          : 'Male & Female Match'
      }
      showMobileBottomNav={chatState !== STATES.CHATTING}
    >
      <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto" style={{ background: 'var(--bg-app)' }}>
        {chatState === STATES.CHATTING ? (
          <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto min-h-0">
            <div className="flex items-center justify-between gap-3 mb-4 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar avatar={strangerAvatar} seed={strangerName} name={strangerName} size={40} online={true} />
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      Chat with {strangerName}
                    </h1>
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{
                        background: strangerGender === 'female' ? 'rgba(236, 72, 153, 0.16)' : 'rgba(99, 102, 241, 0.2)',
                        color: strangerGender === 'female' ? '#F472B6' : '#818CF8',
                      }}
                    >
                      {strangerGender === 'female' ? '♀ Female' : '♂ Male'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <span className="online-dot"></span>
                    <span>{strangerIsAnon ? 'Anonymous stranger' : 'Registered account'} · Connected</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSkip} className="btn-cta text-xs sm:text-sm py-2 px-4">
                  Skip →
                </button>
                <button onClick={handleStop} className="btn-danger-soft text-xs sm:text-sm py-2 px-3.5">
                  End
                </button>
              </div>
            </div>

            <div
              className="flex-1 min-h-0 rounded-2xl border overflow-hidden"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <ChatBox
                messages={messages}
                onSend={handleSend}
                onTyping={handleTyping}
                isPartnerTyping={isStrangerTyping}
                partnerName={strangerName}
                partnerAvatar={strangerAvatar}
                myId={myId}
                placeholder={`Message ${strangerName}`}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="surface-card rounded-2xl p-8 sm:p-10 w-full max-w-lg text-center animate-fadeIn">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-5"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                <span className="online-dot"></span>
                <span>
                  {onlineCount} online · {queueCounts.male} Male / {queueCounts.female} Female waiting
                </span>
              </div>

              {chatState === STATES.IDLE && (
                <>
                  <div className="w-16 h-16 rounded-2xl card-grad-indigo mx-auto mb-5 flex items-center justify-center text-2xl text-white">
                    🔀
                  </div>
                  <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Random Chat
                  </h1>
                  <p className="text-xs sm:text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
                    Choose your category and who you want to match with as{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{myName}</strong>.
                  </p>

                  {/* Category Selectors: Male & Female Only */}
                  <div className="space-y-5 text-left mb-8">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        I am
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {CATEGORIES.map((cat) => {
                          const selected = myGender === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => updateMyGender(cat.id)}
                              className="py-3 px-4 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                              style={{
                                background: selected
                                  ? cat.id === 'male'
                                    ? '#6366F1'
                                    : '#EC4899'
                                  : 'var(--bg-elevated)',
                                color: selected ? '#ffffff' : 'var(--text-primary)',
                                borderColor: selected
                                  ? cat.id === 'male'
                                    ? '#6366F1'
                                    : '#EC4899'
                                  : 'var(--border-subtle)',
                              }}
                            >
                              <span className="text-base">{cat.icon}</span>
                              <span>{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        Match me with
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {CATEGORIES.map((cat) => {
                          const selected = lookingFor === cat.id;
                          const waitingInCat = cat.id === 'male' ? queueCounts.male : queueCounts.female;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => updateLookingFor(cat.id)}
                              className="py-3 px-4 rounded-xl border font-semibold text-sm flex flex-col items-center justify-center gap-0.5 transition-all"
                              style={{
                                background: selected
                                  ? cat.id === 'male'
                                    ? '#6366F1'
                                    : '#EC4899'
                                  : 'var(--bg-elevated)',
                                color: selected ? '#ffffff' : 'var(--text-primary)',
                                borderColor: selected
                                  ? cat.id === 'male'
                                    ? '#6366F1'
                                    : '#EC4899'
                                  : 'var(--border-subtle)',
                              }}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="text-base">{cat.icon}</span>
                                <span>{cat.label}</span>
                              </span>
                              <span className="text-[11px] opacity-80 font-normal">
                                {waitingInCat} waiting
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button onClick={handleStart} className="btn-cta w-full py-3.5 text-sm sm:text-base">
                    Start Chat with {genderLabel(lookingFor)} →
                  </button>
                </>
              )}

              {chatState === STATES.SEARCHING && (
                <>
                  <div className="spinner mx-auto mb-6"></div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Finding a {genderLabel(lookingFor)} stranger...
                  </h2>
                  <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
                    You are queued as <strong>{genderLabel(myGender)}</strong> looking for{' '}
                    <strong>{genderLabel(lookingFor)}</strong>
                  </p>
                  <button onClick={handleStop} className="btn-soft px-6 py-2.5 text-sm">
                    Cancel &amp; Change Category
                  </button>
                </>
              )}

              {chatState === STATES.DISCONNECTED && (
                <>
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-2xl"
                    style={{ background: 'rgba(99, 102, 241, 0.14)' }}
                  >
                    👋
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Stranger disconnected
                  </h2>
                  <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
                    Ready to match with another <strong>{genderLabel(lookingFor)}</strong> stranger?
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={handleStart} className="btn-cta px-6 py-2.5 text-sm">
                      Next {genderLabel(lookingFor)} →
                    </button>
                    <button onClick={() => setChatState(STATES.IDLE)} className="btn-soft px-5 py-2.5 text-sm">
                      Change Category
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
