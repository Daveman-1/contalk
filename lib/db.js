import fs from 'fs';
import os from 'os';
import path from 'path';
import { Redis } from '@upstash/redis';

const DEFAULT_ROOMS = [
  {
    id: 'room_general',
    name: 'General Lobby',
    slug: 'general',
    description: 'Hang out, say hi, and talk about anything with everyone.',
    icon: 'message',
    created_by: 'ConTalk',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'room_tech',
    name: 'Tech & Coding',
    slug: 'tech',
    description: 'Software, AI, gadgets, startups, and developer banter.',
    icon: 'code',
    created_by: 'ConTalk',
    created_at: '2026-01-01T00:00:01.000Z',
  },
  {
    id: 'room_gaming',
    name: 'Gaming',
    slug: 'gaming',
    description: 'Find teammates, talk esports, and share what you are playing.',
    icon: 'gamepad',
    created_by: 'ConTalk',
    created_at: '2026-01-01T00:00:02.000Z',
  },
  {
    id: 'room_music',
    name: 'Music & Chill',
    slug: 'music',
    description: 'Drop songs, artists, and late-night chill conversations.',
    icon: 'headphones',
    created_by: 'ConTalk',
    created_at: '2026-01-01T00:00:03.000Z',
  },
  {
    id: 'room_confessions',
    name: 'Anonymous Confessions',
    slug: 'confessions',
    description: 'Speak your mind freely and anonymously — no judgment.',
    icon: 'shield',
    created_by: 'ConTalk',
    created_at: '2026-01-01T00:00:04.000Z',
  },
];

// ─── Lazy Upstash Redis Client (Build-time safe + auto-discovers Vercel prefixes) ─
let _redis = null;
let _redisChecked = false;
let _redisEnvKey = null;

function discoverUpstashEnv() {
  const directPairs = [
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
  ];
  for (const [urlKey, tokenKey] of directPairs) {
    if (process.env[urlKey] && process.env[tokenKey]) {
      return { url: process.env[urlKey], token: process.env[tokenKey], key: urlKey };
    }
  }

  // Handle custom Vercel Marketplace prefixes (e.g. CONTALK_KV_REST_API_URL, STORAGE_REST_API_URL, *_REDIS_REST_URL)
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;
    if (key.endsWith('_REST_API_URL')) {
      const tokenKey = key.replace(/_REST_API_URL$/, '_REST_API_TOKEN');
      if (process.env[tokenKey]) {
        return { url: value, token: process.env[tokenKey], key };
      }
    }
    if (key.endsWith('_REDIS_REST_URL')) {
      const tokenKey = key.replace(/_REDIS_REST_URL$/, '_REDIS_REST_TOKEN');
      if (process.env[tokenKey]) {
        return { url: value, token: process.env[tokenKey], key };
      }
    }
  }

  return null;
}

export function getRedis() {
  if (_redisChecked) return _redis;
  _redisChecked = true;

  const found = discoverUpstashEnv();
  if (found) {
    _redis = new Redis({ url: found.url, token: found.token });
    _redisEnvKey = found.key;
  } else {
    _redis = null;
    _redisEnvKey = null;
  }
  return _redis;
}

export function isRedisEnabled() {
  return Boolean(getRedis());
}

export function getStorageInfo() {
  const enabled = isRedisEnabled();
  return {
    storage: enabled ? 'redis' : 'local',
    redisEnvKey: _redisEnvKey,
  };
}

// ─── Safe Local JSON Fallback (works locally & never EROFS-crashes on Vercel) ─
function getFallbackPath() {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), 'contalk-data.json');
  }
  const dir = process.env.DATA_DIR || process.cwd();
  return path.join(dir, 'contalk-data.json');
}

function createEmptyLocalStore() {
  return {
    users: [],
    messages: [],
    rooms: DEFAULT_ROOMS.map((r) => ({ ...r })),
    posts: [],
    presence: {},
    typing: {},
    inbox: {},
    randomQueue: [],
    randomSessions: {},
    blocks: {},
    reports: [],
  };
}

function readLocalStore() {
  const filePath = getFallbackPath();
  try {
    if (!fs.existsSync(filePath)) {
      const initial = createEmptyLocalStore();
      writeLocalStore(initial);
      return initial;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      rooms:
        Array.isArray(parsed.rooms) && parsed.rooms.length > 0
          ? parsed.rooms
          : DEFAULT_ROOMS.map((r) => ({ ...r })),
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
      presence: parsed.presence && typeof parsed.presence === 'object' ? parsed.presence : {},
      typing: parsed.typing && typeof parsed.typing === 'object' ? parsed.typing : {},
      inbox: parsed.inbox && typeof parsed.inbox === 'object' ? parsed.inbox : {},
      randomQueue: Array.isArray(parsed.randomQueue) ? parsed.randomQueue : [],
      randomSessions:
        parsed.randomSessions && typeof parsed.randomSessions === 'object' ? parsed.randomSessions : {},
      blocks: parsed.blocks && typeof parsed.blocks === 'object' ? parsed.blocks : {},
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
    };
  } catch {
    return createEmptyLocalStore();
  }
}

function writeLocalStore(data) {
  const filePath = getFallbackPath();
  const payload = JSON.stringify(data, null, 2);
  try {
    fs.writeFileSync(filePath, payload, 'utf8');
  } catch {
    try {
      fs.writeFileSync(path.join(os.tmpdir(), 'contalk-data.json'), payload, 'utf8');
    } catch {}
  }
}

function parseJson(val, fallback = null) {
  if (val == null) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return val;
}

function normalizeGender(val) {
  return String(val || '').toLowerCase() === 'female' ? 'female' : 'male';
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function findUserByUsername(username) {
  const target = String(username || '').trim().toLowerCase();
  if (!target) return null;

  const redis = getRedis();
  if (redis) {
    const userId = await redis.hget('ct:usernames', target);
    if (!userId) return null;
    const raw = await redis.hget('ct:users', String(userId));
    return parseJson(raw, null);
  }

  const store = readLocalStore();
  return store.users.find((u) => u.username.toLowerCase() === target) || null;
}

export async function findUserById(id) {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.hget('ct:users', String(id));
    return parseJson(raw, null);
  }
  const store = readLocalStore();
  return store.users.find((u) => u.id === id) || null;
}

export async function createUser({ id, username, password_hash, avatar = null }) {
  const user = {
    id,
    username,
    password_hash,
    avatar,
    created_at: new Date().toISOString(),
  };

  const redis = getRedis();
  if (redis) {
    await Promise.all([
      redis.hset('ct:users', { [id]: JSON.stringify(user) }),
      redis.hset('ct:usernames', { [username.toLowerCase()]: id }),
    ]);
    return { id: user.id, username: user.username, avatar: user.avatar, created_at: user.created_at };
  }

  const store = readLocalStore();
  store.users.push(user);
  writeLocalStore(store);
  return { id: user.id, username: user.username, avatar: user.avatar, created_at: user.created_at };
}

export async function updateUserAvatar(id, avatar) {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.hget('ct:users', String(id));
    const user = parseJson(raw, null);
    if (!user) return null;
    user.avatar = avatar;
    await redis.hset('ct:users', { [id]: JSON.stringify(user) });
    return { id: user.id, username: user.username, avatar: user.avatar, created_at: user.created_at };
  }

  const store = readLocalStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) return null;
  user.avatar = avatar;
  writeLocalStore(store);
  return { id: user.id, username: user.username, avatar: user.avatar, created_at: user.created_at };
}

export async function getAllUsers() {
  const redis = getRedis();
  if (redis) {
    const all = (await redis.hgetall('ct:users')) || {};
    return Object.values(all)
      .map((v) => parseJson(v, null))
      .filter(Boolean)
      .map(({ id, username, avatar, created_at }) => ({
        id,
        username,
        avatar: avatar || null,
        created_at,
      }));
  }

  const store = readLocalStore();
  return store.users.map(({ id, username, avatar, created_at }) => ({
    id,
    username,
    avatar: avatar || null,
    created_at,
  }));
}

// ─── Messages (DMs, Chat Rooms & Random Chat) ────────────────────────────────

export async function saveMessage({ id, room_id, sender, sender_id, sender_avatar = null, content }) {
  const message = {
    id,
    roomId: room_id,
    sender,
    senderId: sender_id,
    senderAvatar: sender_avatar || null,
    content,
    timestamp: new Date().toISOString(),
  };

  const redis = getRedis();
  if (redis) {
    const key = `ct:msgs:${room_id}`;
    await redis.rpush(key, JSON.stringify(message));
    await redis.ltrim(key, -150, -1);
    if (String(room_id).startsWith('random_')) {
      await redis.expire(key, 3600);
    }
    return message;
  }

  const store = readLocalStore();
  store.messages.push({
    id: message.id,
    room_id: message.roomId,
    sender: message.sender,
    sender_id: message.senderId,
    sender_avatar: message.senderAvatar,
    content: message.content,
    created_at: message.timestamp,
  });
  if (store.messages.length > 10000) {
    store.messages = store.messages.slice(-10000);
  }
  writeLocalStore(store);
  return message;
}

export async function getMessagesByRoom(roomId, limit = 150) {
  const redis = getRedis();
  if (redis) {
    const list = (await redis.lrange(`ct:msgs:${roomId}`, -limit, -1)) || [];
    return list.map((v) => parseJson(v, null)).filter(Boolean);
  }

  const store = readLocalStore();
  const roomMessages = store.messages.filter((m) => m.room_id === roomId);
  return roomMessages.slice(-limit).map((m) => ({
    id: m.id,
    roomId: m.room_id,
    sender: m.sender,
    senderId: m.sender_id,
    senderAvatar: m.sender_avatar || null,
    content: m.content,
    timestamp: m.created_at,
  }));
}

// ─── DM Notifications Inbox ──────────────────────────────────────────────────

export async function pushInboxEvent(recipientId, event) {
  if (!recipientId) return;
  const redis = getRedis();
  if (redis) {
    const key = `ct:inbox:${recipientId}`;
    await redis.lpush(key, JSON.stringify(event));
    await redis.ltrim(key, 0, 29);
    await redis.expire(key, 86400);
    return;
  }

  const store = readLocalStore();
  const list = Array.isArray(store.inbox[recipientId]) ? store.inbox[recipientId] : [];
  list.unshift(event);
  store.inbox[recipientId] = list.slice(0, 30);
  writeLocalStore(store);
}

export async function getInboxEvents(userId) {
  if (!userId) return [];
  const redis = getRedis();
  if (redis) {
    const list = (await redis.lrange(`ct:inbox:${userId}`, 0, 29)) || [];
    return list.map((v) => parseJson(v, null)).filter(Boolean);
  }

  const store = readLocalStore();
  return Array.isArray(store.inbox[userId]) ? store.inbox[userId] : [];
}

// ─── Live Online Presence & Room Membership ──────────────────────────────────

const PRESENCE_TTL_MS = 18000;

export async function removePresence(id) {
  if (!id) return getOnlineState();
  const key = String(id);
  const redis = getRedis();
  if (redis) {
    await redis.hdel('ct:presence', key).catch(() => {});
    return getOnlineState();
  }

  const store = readLocalStore();
  if (store.presence && store.presence[key]) {
    delete store.presence[key];
    writeLocalStore(store);
  }
  return getOnlineState();
}

export async function heartbeatPresence({ id, name, isAnon, avatar, activeRoomId = null }) {
  if (!id || !name) return getOnlineState();

  const record = {
    id: String(id),
    name: String(name),
    isAnon: Boolean(isAnon),
    avatar: avatar || null,
    activeRoomId: activeRoomId ? String(activeRoomId) : null,
    lastSeen: Date.now(),
  };

  const redis = getRedis();
  if (redis) {
    await redis.hset('ct:presence', { [record.id]: JSON.stringify(record) });
    return getOnlineState();
  }

  const store = readLocalStore();
  store.presence[record.id] = record;
  writeLocalStore(store);
  return getOnlineState();
}

export async function getOnlineState() {
  const now = Date.now();
  const redis = getRedis();

  let entries = [];
  const staleIds = [];

  if (redis) {
    const all = (await redis.hgetall('ct:presence')) || {};
    for (const [key, raw] of Object.entries(all)) {
      const item = parseJson(raw, null);
      if (!item || now - (item.lastSeen || 0) > PRESENCE_TTL_MS) {
        staleIds.push(key);
      } else {
        entries.push(item);
      }
    }
    if (staleIds.length > 0) {
      await redis.hdel('ct:presence', ...staleIds).catch(() => {});
    }
  } else {
    const store = readLocalStore();
    let changed = false;
    for (const [key, item] of Object.entries(store.presence || {})) {
      if (!item || now - (item.lastSeen || 0) > PRESENCE_TTL_MS) {
        delete store.presence[key];
        changed = true;
      } else {
        entries.push(item);
      }
    }
    if (changed) writeLocalStore(store);
  }

  const onlineUsers = entries.map((u) => ({
    id: u.id,
    name: u.name,
    isAnon: Boolean(u.isAnon),
    avatar: u.avatar || null,
  }));

  const roomPresence = {};
  for (const u of entries) {
    if (u.activeRoomId) {
      if (!roomPresence[u.activeRoomId]) roomPresence[u.activeRoomId] = [];
      roomPresence[u.activeRoomId].push({
        id: u.id,
        name: u.name,
        isAnon: Boolean(u.isAnon),
        avatar: u.avatar || null,
      });
    }
  }

  return { onlineUsers, roomPresence };
}

// ─── Typing Indicators ───────────────────────────────────────────────────────

export async function setTyping({ roomId, userId, userName, isTyping }) {
  if (!roomId || !userId) return;
  const redis = getRedis();
  const key = `ct:typing:${roomId}`;

  if (redis) {
    if (isTyping) {
      await redis.hset(key, {
        [userId]: JSON.stringify({ userId, userName: userName || 'Someone', at: Date.now() }),
      });
      await redis.expire(key, 10);
    } else {
      await redis.hdel(key, String(userId));
    }
    return;
  }

  const store = readLocalStore();
  if (!store.typing[roomId]) store.typing[roomId] = {};
  if (isTyping) {
    store.typing[roomId][userId] = { userId, userName: userName || 'Someone', at: Date.now() };
  } else {
    delete store.typing[roomId][userId];
  }
  writeLocalStore(store);
}

export async function getTypingUsers(roomId, excludeUserId = '') {
  if (!roomId) return [];
  const now = Date.now();
  const redis = getRedis();
  const active = [];

  if (redis) {
    const all = (await redis.hgetall(`ct:typing:${roomId}`)) || {};
    for (const raw of Object.values(all)) {
      const item = parseJson(raw, null);
      if (item && item.userId !== excludeUserId && now - (item.at || 0) < 4500) {
        active.push({ userId: item.userId, userName: item.userName });
      }
    }
    return active;
  }

  const store = readLocalStore();
  const map = store.typing[roomId] || {};
  for (const item of Object.values(map)) {
    if (item && item.userId !== excludeUserId && now - (item.at || 0) < 4500) {
      active.push({ userId: item.userId, userName: item.userName });
    }
  }
  return active;
}

// ─── Chat Rooms ──────────────────────────────────────────────────────────────

export async function getAllRooms() {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get('ct:rooms');
    const parsed = parseJson(raw, null);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    await redis.set('ct:rooms', JSON.stringify(DEFAULT_ROOMS));
    return DEFAULT_ROOMS.map((r) => ({ ...r }));
  }

  const store = readLocalStore();
  return store.rooms;
}

export async function findRoomBySlug(slug) {
  const target = String(slug || '').trim().toLowerCase();
  const rooms = await getAllRooms();
  return rooms.find((r) => r.slug.toLowerCase() === target) || null;
}

export async function createRoom({ id, name, slug, description, icon, created_by }) {
  const room = {
    id,
    name,
    slug,
    description: description || '',
    icon: icon || 'message',
    created_by: created_by || 'Anonymous',
    created_at: new Date().toISOString(),
  };

  const redis = getRedis();
  if (redis) {
    const rooms = await getAllRooms();
    rooms.push(room);
    await redis.set('ct:rooms', JSON.stringify(rooms));
    return room;
  }

  const store = readLocalStore();
  store.rooms.push(room);
  writeLocalStore(store);
  return room;
}

// ─── Posts (Social Feed) ─────────────────────────────────────────────────────

function extractTags(content) {
  const matches = String(content || '').match(/#[a-zA-Z0-9_]{2,30}/g) || [];
  return Array.from(new Set(matches.map((t) => t.slice(1).toLowerCase())));
}

export async function getAllPosts() {
  const redis = getRedis();
  let posts = [];
  if (redis) {
    const raw = await redis.get('ct:posts');
    posts = parseJson(raw, []) || [];
  } else {
    posts = readLocalStore().posts;
  }
  return [...posts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

async function saveAllPosts(posts) {
  const trimmed = posts.slice(0, 500);
  const redis = getRedis();
  if (redis) {
    await redis.set('ct:posts', JSON.stringify(trimmed));
    return;
  }
  const store = readLocalStore();
  store.posts = trimmed;
  writeLocalStore(store);
}

export async function createPost({ id, author_id, author_name, author_avatar = null, is_anon, content }) {
  const posts = await getAllPosts();
  const post = {
    id,
    author_id,
    author_name,
    author_avatar,
    is_anon: Boolean(is_anon),
    content,
    tags: extractTags(content),
    likes: [],
    replies: [],
    created_at: new Date().toISOString(),
  };
  posts.unshift(post);
  await saveAllPosts(posts);
  return post;
}

export async function togglePostLike(postId, userId) {
  const posts = await getAllPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  if (!Array.isArray(post.likes)) post.likes = [];
  const idx = post.likes.indexOf(userId);
  if (idx === -1) post.likes.push(userId);
  else post.likes.splice(idx, 1);

  await saveAllPosts(posts);
  return post;
}

export async function addPostReply(postId, { id, author_id, author_name, author_avatar = null, is_anon, content }) {
  const posts = await getAllPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  if (!Array.isArray(post.replies)) post.replies = [];
  const reply = {
    id,
    author_id,
    author_name,
    author_avatar,
    is_anon: Boolean(is_anon),
    content,
    created_at: new Date().toISOString(),
  };
  post.replies.push(reply);
  await saveAllPosts(posts);
  return { post, reply };
}

export async function deletePost(postId, authorId) {
  const posts = await getAllPosts();
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx === -1) return { status: 'not_found' };
  if (posts[idx].author_id !== authorId) return { status: 'forbidden' };

  posts.splice(idx, 1);
  await saveAllPosts(posts);
  return { status: 'deleted' };
}

// ─── Random Chat Matchmaking (Male / Female) ─────────────────────────────────

const QUEUE_STALE_MS = 22000;

async function readRandomQueue() {
  const now = Date.now();
  const redis = getRedis();
  let queue = [];
  if (redis) {
    queue = parseJson(await redis.get('ct:random:queue'), []) || [];
  } else {
    queue = readLocalStore().randomQueue || [];
  }
  return queue.filter((e) => e && now - (e.lastPing || 0) < QUEUE_STALE_MS);
}

async function writeRandomQueue(queue) {
  const redis = getRedis();
  if (redis) {
    await redis.set('ct:random:queue', JSON.stringify(queue));
    return;
  }
  const store = readLocalStore();
  store.randomQueue = queue;
  writeLocalStore(store);
}

async function readRandomSession(userId) {
  const redis = getRedis();
  if (redis) {
    return parseJson(await redis.get(`ct:random:session:${userId}`), null);
  }
  const store = readLocalStore();
  return store.randomSessions[userId] || null;
}

async function writeRandomSession(userId, session) {
  const redis = getRedis();
  if (redis) {
    if (!session) {
      await redis.del(`ct:random:session:${userId}`);
    } else {
      await redis.set(`ct:random:session:${userId}`, JSON.stringify(session), { ex: 1800 });
    }
    return;
  }
  const store = readLocalStore();
  if (!session) delete store.randomSessions[userId];
  else store.randomSessions[userId] = session;
  writeLocalStore(store);
}

function countQueue(queue) {
  let male = 0;
  let female = 0;
  for (const e of queue) {
    if (e.gender === 'female') female += 1;
    else male += 1;
  }
  return { male, female };
}

export async function leaveRandomChat(userId) {
  const session = await readRandomSession(userId);
  if (session && session.status === 'matched' && session.partnerId) {
    const partnerSession = await readRandomSession(session.partnerId);
    if (partnerSession && partnerSession.roomId === session.roomId) {
      await writeRandomSession(session.partnerId, {
        status: 'disconnected',
        updatedAt: Date.now(),
      });
    }
  }
  await writeRandomSession(userId, null);

  const queue = (await readRandomQueue()).filter((e) => e.userId !== userId);
  await writeRandomQueue(queue);
  return { status: 'idle', queueCounts: countQueue(queue) };
}

export async function joinRandomQueue({ userId, name, isAnon, avatar, gender, lookingFor }) {
  const myGender = normalizeGender(gender);
  const myLookingFor = normalizeGender(lookingFor);

  await leaveRandomChat(userId);
  const queue = await readRandomQueue();

  let matchIndex = -1;
  for (let i = 0; i < queue.length; i += 1) {
    const c = queue[i];
    if (
      c.userId !== userId &&
      c.gender === myLookingFor &&
      c.lookingFor === myGender
    ) {
      const blocked = await isBlockedBetween(userId, c.userId);
      if (!blocked) {
        matchIndex = i;
        break;
      }
    }
  }

  if (matchIndex !== -1) {
    const partner = queue.splice(matchIndex, 1)[0];
    await writeRandomQueue(queue);

    const roomId = `random_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const mySession = {
      status: 'matched',
      roomId,
      partnerId: partner.userId,
      stranger: partner.name,
      strangerIsAnon: Boolean(partner.isAnon),
      strangerAvatar: partner.avatar || null,
      strangerGender: partner.gender,
      updatedAt: Date.now(),
    };

    const partnerSession = {
      status: 'matched',
      roomId,
      partnerId: userId,
      stranger: name,
      strangerIsAnon: Boolean(isAnon),
      strangerAvatar: avatar || null,
      strangerGender: myGender,
      updatedAt: Date.now(),
    };

    await Promise.all([
      writeRandomSession(userId, mySession),
      writeRandomSession(partner.userId, partnerSession),
    ]);

    return { session: mySession, queueCounts: countQueue(queue) };
  }

  queue.push({
    userId,
    name,
    isAnon: Boolean(isAnon),
    avatar: avatar || null,
    gender: myGender,
    lookingFor: myLookingFor,
    lastPing: Date.now(),
  });
  await writeRandomQueue(queue);

  const waitingSession = {
    status: 'waiting',
    gender: myGender,
    lookingFor: myLookingFor,
    updatedAt: Date.now(),
  };
  await writeRandomSession(userId, waitingSession);
  return { session: waitingSession, queueCounts: countQueue(queue) };
}

export async function getRandomStatus(userId) {
  const queue = await readRandomQueue();
  const session = await readRandomSession(userId);

  // Refresh queue ping if user is waiting
  if (session && session.status === 'waiting') {
    const entry = queue.find((e) => e.userId === userId);
    if (entry) {
      entry.lastPing = Date.now();
      await writeRandomQueue(queue);
    }
  }

  let messages = [];
  let isPartnerTyping = false;

  if (session && session.status === 'matched' && session.roomId) {
    const [msgs, typingUsers] = await Promise.all([
      getMessagesByRoom(session.roomId, 150),
      getTypingUsers(session.roomId, userId),
    ]);
    messages = msgs;
    isPartnerTyping = typingUsers.length > 0;
  }

  return {
    session: session || { status: 'idle' },
    messages,
    isPartnerTyping,
    queueCounts: countQueue(queue),
  };
}

export async function getRandomRoomForUser(userId) {
  if (!userId) return null;
  const session = await readRandomSession(userId);
  if (session && session.status === 'matched' && session.roomId) {
    return session.roomId;
  }
  return null;
}

// ─── Safety: User Blocking & Reporting ───────────────────────────────────────

export async function getBlockedUsers(blockerId) {
  if (!blockerId) return [];
  const key = `ct:blocks:${blockerId}`;
  const redis = getRedis();
  if (redis) {
    const all = (await redis.hgetall(key)) || {};
    return Object.values(all)
      .map((v) => parseJson(v, null))
      .filter(Boolean)
      .sort((a, b) => new Date(b.blockedAt || 0).getTime() - new Date(a.blockedAt || 0).getTime());
  }

  const store = readLocalStore();
  const map = store.blocks[blockerId] || {};
  return Object.values(map).sort(
    (a, b) => new Date(b.blockedAt || 0).getTime() - new Date(a.blockedAt || 0).getTime()
  );
}

export async function blockUser(blockerId, targetId, targetName = 'User') {
  if (!blockerId || !targetId || String(blockerId) === String(targetId)) {
    return getBlockedUsers(blockerId);
  }
  const record = {
    id: String(targetId),
    name: String(targetName || 'User').slice(0, 32),
    blockedAt: new Date().toISOString(),
  };

  const redis = getRedis();
  if (redis) {
    await redis.hset(`ct:blocks:${blockerId}`, { [record.id]: JSON.stringify(record) });
  } else {
    const store = readLocalStore();
    if (!store.blocks[blockerId]) store.blocks[blockerId] = {};
    store.blocks[blockerId][record.id] = record;
    writeLocalStore(store);
  }

  // If currently matched in Random Chat with this user, disconnect immediately
  const session = await readRandomSession(blockerId);
  if (session && session.status === 'matched' && session.partnerId === String(targetId)) {
    await leaveRandomChat(blockerId);
  }

  return getBlockedUsers(blockerId);
}

export async function unblockUser(blockerId, targetId) {
  if (!blockerId || !targetId) return getBlockedUsers(blockerId);
  const redis = getRedis();
  if (redis) {
    await redis.hdel(`ct:blocks:${blockerId}`, String(targetId)).catch(() => {});
    return getBlockedUsers(blockerId);
  }

  const store = readLocalStore();
  if (store.blocks[blockerId] && store.blocks[blockerId][targetId]) {
    delete store.blocks[blockerId][targetId];
    writeLocalStore(store);
  }
  return getBlockedUsers(blockerId);
}

export async function isBlockedBetween(idA, idB) {
  if (!idA || !idB) return false;
  const a = String(idA);
  const b = String(idB);
  const redis = getRedis();
  if (redis) {
    const [aBlocksB, bBlocksA] = await Promise.all([
      redis.hexists(`ct:blocks:${a}`, b),
      redis.hexists(`ct:blocks:${b}`, a),
    ]);
    return Boolean(aBlocksB || bBlocksA);
  }

  const store = readLocalStore();
  return Boolean(store.blocks[a]?.[b] || store.blocks[b]?.[a]);
}

export async function createReport({
  id,
  reporterId,
  reporterName,
  targetId,
  targetName,
  contextType = 'user',
  contextId = null,
  reason = 'Other',
  details = '',
}) {
  const report = {
    id,
    reporterId: String(reporterId),
    reporterName: String(reporterName || 'Anonymous').slice(0, 32),
    targetId: String(targetId),
    targetName: String(targetName || 'User').slice(0, 32),
    contextType: String(contextType || 'user').slice(0, 24),
    contextId: contextId ? String(contextId).slice(0, 128) : null,
    reason: String(reason || 'Other').slice(0, 80),
    details: String(details || '').slice(0, 400),
    createdAt: new Date().toISOString(),
  };

  const redis = getRedis();
  if (redis) {
    await redis.lpush('ct:reports', JSON.stringify(report));
    await redis.ltrim('ct:reports', 0, 499);
    return report;
  }

  const store = readLocalStore();
  store.reports.unshift(report);
  store.reports = store.reports.slice(0, 500);
  writeLocalStore(store);
  return report;
}
