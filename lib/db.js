const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || process.cwd();
const DATA_PATH = path.join(DATA_DIR, 'contalk-data.json');

const DEFAULT_ROOMS = [
  {
    id: 'room_general',
    name: 'General Lobby',
    slug: 'general',
    description: 'Hang out, say hi, and talk about anything with everyone.',
    icon: '💬',
    created_by: 'ConTalk',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'room_tech',
    name: 'Tech & Coding',
    slug: 'tech',
    description: 'Software, AI, gadgets, startups, and developer banter.',
    icon: '💻',
    created_by: 'ConTalk',
    created_at: '2026-01-01T00:00:01.000Z',
  },
  {
    id: 'room_gaming',
    name: 'Gaming',
    slug: 'gaming',
    description: 'Find teammates, talk esports, and share what you are playing.',
    icon: '🎮',
    created_by: 'ConTalk',
    created_at: '2026-01-01T00:00:02.000Z',
  },
  {
    id: 'room_music',
    name: 'Music & Chill',
    slug: 'music',
    description: 'Drop songs, artists, and late-night chill conversations.',
    icon: '🎧',
    created_by: 'ConTalk',
    created_at: '2026-01-01T00:00:03.000Z',
  },
  {
    id: 'room_confessions',
    name: 'Anonymous Confessions',
    slug: 'confessions',
    description: 'Speak your mind freely and anonymously — no judgment.',
    icon: '🕵️',
    created_by: 'ConTalk',
    created_at: '2026-01-01T00:00:04.000Z',
  },
];

function createDefaultStore() {
  return {
    users: [],
    messages: [],
    rooms: DEFAULT_ROOMS.map((r) => ({ ...r })),
    posts: [],
  };
}

function readStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_PATH)) {
      const initial = createDefaultStore();
      fs.writeFileSync(DATA_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const rooms =
      Array.isArray(parsed.rooms) && parsed.rooms.length > 0
        ? parsed.rooms
        : DEFAULT_ROOMS.map((r) => ({ ...r }));
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      rooms,
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
    };
  } catch (err) {
    console.error('[db] Failed to read store:', err);
    return createDefaultStore();
  }
}

function writeStore(data) {
  const payload = JSON.stringify(data, null, 2);
  const tmpPath = `${DATA_PATH}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmpPath, payload, 'utf8');
    fs.renameSync(tmpPath, DATA_PATH);
  } catch {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {}
    fs.writeFileSync(DATA_PATH, payload, 'utf8');
  }
}

// ─── Users ───────────────────────────────────────────────────────────────────

function findUserByUsername(username) {
  const target = String(username || '').trim().toLowerCase();
  if (!target) return null;
  const store = readStore();
  return store.users.find((u) => u.username.toLowerCase() === target) || null;
}

function findUserById(id) {
  const store = readStore();
  return store.users.find((u) => u.id === id) || null;
}

function createUser({ id, username, password_hash, avatar = null }) {
  const store = readStore();
  const user = {
    id,
    username,
    password_hash,
    avatar,
    created_at: new Date().toISOString(),
  };
  store.users.push(user);
  writeStore(store);
  return { id: user.id, username: user.username, avatar: user.avatar, created_at: user.created_at };
}

function updateUserAvatar(id, avatar) {
  const store = readStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) return null;
  user.avatar = avatar;
  writeStore(store);
  return { id: user.id, username: user.username, avatar: user.avatar, created_at: user.created_at };
}

function getAllUsers() {
  const store = readStore();
  return store.users.map(({ id, username, avatar, created_at }) => ({
    id,
    username,
    avatar: avatar || null,
    created_at,
  }));
}

// ─── Messages (DMs & Chat Rooms) ─────────────────────────────────────────────

function saveMessage({ id, room_id, sender, sender_id, sender_avatar = null, content }) {
  const store = readStore();
  const message = {
    id,
    room_id,
    sender,
    sender_id,
    sender_avatar,
    content,
    created_at: new Date().toISOString(),
  };
  store.messages.push(message);
  if (store.messages.length > 15000) {
    store.messages = store.messages.slice(-15000);
  }
  writeStore(store);
  return message;
}

function getMessagesByRoom(roomId, limit = 150) {
  const store = readStore();
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

// ─── Chat Rooms ──────────────────────────────────────────────────────────────

function getAllRooms() {
  const store = readStore();
  return store.rooms;
}

function findRoomBySlug(slug) {
  const target = String(slug || '').trim().toLowerCase();
  const store = readStore();
  return store.rooms.find((r) => r.slug.toLowerCase() === target) || null;
}

function createRoom({ id, name, slug, description, icon, created_by }) {
  const store = readStore();
  const room = {
    id,
    name,
    slug,
    description: description || '',
    icon: icon || '💬',
    created_by: created_by || 'Anonymous',
    created_at: new Date().toISOString(),
  };
  store.rooms.push(room);
  writeStore(store);
  return room;
}

// ─── Posts (Twitter-style Feed) ──────────────────────────────────────────────

function extractTags(content) {
  const matches = String(content || '').match(/#[a-zA-Z0-9_]{2,30}/g) || [];
  return Array.from(new Set(matches.map((t) => t.slice(1).toLowerCase())));
}

function getAllPosts() {
  const store = readStore();
  return [...store.posts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function createPost({ id, author_id, author_name, author_avatar = null, is_anon, content }) {
  const store = readStore();
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
  store.posts.unshift(post);
  if (store.posts.length > 5000) {
    store.posts = store.posts.slice(0, 5000);
  }
  writeStore(store);
  return post;
}

function togglePostLike(postId, userId) {
  const store = readStore();
  const post = store.posts.find((p) => p.id === postId);
  if (!post) return null;

  if (!Array.isArray(post.likes)) post.likes = [];
  const idx = post.likes.indexOf(userId);
  if (idx === -1) {
    post.likes.push(userId);
  } else {
    post.likes.splice(idx, 1);
  }

  writeStore(store);
  return post;
}

function addPostReply(postId, { id, author_id, author_name, author_avatar = null, is_anon, content }) {
  const store = readStore();
  const post = store.posts.find((p) => p.id === postId);
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
  writeStore(store);
  return { post, reply };
}

function deletePost(postId, authorId) {
  const store = readStore();
  const idx = store.posts.findIndex((p) => p.id === postId);
  if (idx === -1) return { status: 'not_found' };
  if (store.posts[idx].author_id !== authorId) return { status: 'forbidden' };

  store.posts.splice(idx, 1);
  writeStore(store);
  return { status: 'deleted' };
}

module.exports = {
  findUserByUsername,
  findUserById,
  createUser,
  updateUserAvatar,
  getAllUsers,
  saveMessage,
  getMessagesByRoom,
  getAllRooms,
  findRoomBySlug,
  createRoom,
  getAllPosts,
  createPost,
  togglePostLike,
  addPostReply,
  deletePost,
};
