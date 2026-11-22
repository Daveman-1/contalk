const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const { saveMessage } = require('./lib/db');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// In-memory real-time state
const onlineUsers = new Map();  // socketId -> { id, name, isAnon, socketId, connectedAt }
const randomQueue = [];         // { socketId, gender: 'male' | 'female', lookingFor: 'male' | 'female' }[]
const randomPairs = new Map();  // socketId -> { partnerSocketId, roomId }
const socketRooms = new Map();  // socketId -> active chat room id

function normalizeGender(value) {
  return String(value || '').toLowerCase() === 'female' ? 'female' : 'male';
}

function getDeduplicatedOnlineUsers() {
  const byId = new Map();
  for (const user of onlineUsers.values()) {
    byId.set(user.id, {
      id: user.id,
      name: user.name,
      isAnon: Boolean(user.isAnon),
      avatar: user.avatar || null,
      socketId: user.socketId,
    });
  }
  return Array.from(byId.values());
}

function getRoomPresenceSummary() {
  const presence = {};
  for (const [socketId, roomId] of socketRooms.entries()) {
    const user = onlineUsers.get(socketId);
    if (!user) continue;
    if (!presence[roomId]) presence[roomId] = new Map();
    presence[roomId].set(user.id, {
      id: user.id,
      name: user.name,
      isAnon: Boolean(user.isAnon),
      avatar: user.avatar || null,
    });
  }
  const serialized = {};
  for (const [roomId, userMap] of Object.entries(presence)) {
    serialized[roomId] = Array.from(userMap.values());
  }
  return serialized;
}

function getRandomQueueCounts() {
  let male = 0;
  let female = 0;
  for (const entry of randomQueue) {
    if (entry.gender === 'female') female += 1;
    else male += 1;
  }
  return { male, female };
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);

    if (parsedUrl.pathname === '/api/users/online' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ users: getDeduplicatedOnlineUsers() }));
      return;
    }

    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  function broadcastOnlineUsers() {
    io.emit('online_users', getDeduplicatedOnlineUsers());
  }

  function broadcastRoomPresence() {
    io.emit('room_presence', getRoomPresenceSummary());
  }

  function broadcastRandomQueueCounts() {
    io.emit('random_queue_counts', getRandomQueueCounts());
  }

  function removeFromQueue(socketId) {
    let changed = false;
    for (let i = randomQueue.length - 1; i >= 0; i--) {
      if (randomQueue[i].socketId === socketId) {
        randomQueue.splice(i, 1);
        changed = true;
      }
    }
    if (changed) broadcastRandomQueueCounts();
  }

  function leaveRandomPair(socket, notifyPartner = true) {
    const pair = randomPairs.get(socket.id);
    if (!pair) return;

    const { partnerSocketId, roomId } = pair;
    const partnerSocket = io.sockets.sockets.get(partnerSocketId);

    randomPairs.delete(socket.id);
    randomPairs.delete(partnerSocketId);
    socket.leave(roomId);

    if (partnerSocket) {
      partnerSocket.leave(roomId);
      if (notifyPartner) {
        partnerSocket.emit('stranger_disconnected');
      }
    }
  }

  function enqueueForRandom(socket, { gender, lookingFor }) {
    const myGender = normalizeGender(gender);
    const myLookingFor = normalizeGender(lookingFor);

    leaveRandomPair(socket, true);
    removeFromQueue(socket.id);

    // Search for a compatible waiting partner (strictly Male / Female category match)
    for (let i = 0; i < randomQueue.length; i++) {
      const candidate = randomQueue[i];
      if (candidate.socketId === socket.id) continue;

      const partnerSocket = io.sockets.sockets.get(candidate.socketId);
      if (!partnerSocket || !partnerSocket.connected || randomPairs.has(candidate.socketId)) {
        randomQueue.splice(i, 1);
        i--;
        continue;
      }

      const isCompatible =
        candidate.gender === myLookingFor && candidate.lookingFor === myGender;

      if (!isCompatible) continue;

      randomQueue.splice(i, 1);
      broadcastRandomQueueCounts();

      const roomId = `random_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      socket.join(roomId);
      partnerSocket.join(roomId);

      randomPairs.set(socket.id, { partnerSocketId: candidate.socketId, roomId });
      randomPairs.set(candidate.socketId, { partnerSocketId: socket.id, roomId });

      const myInfo = onlineUsers.get(socket.id);
      const partnerInfo = onlineUsers.get(candidate.socketId);

      socket.emit('matched', {
        roomId,
        stranger: partnerInfo ? partnerInfo.name : 'Stranger',
        strangerIsAnon: partnerInfo ? Boolean(partnerInfo.isAnon) : true,
        strangerAvatar: partnerInfo ? partnerInfo.avatar || null : null,
        strangerGender: candidate.gender,
      });
      partnerSocket.emit('matched', {
        roomId,
        stranger: myInfo ? myInfo.name : 'Stranger',
        strangerIsAnon: myInfo ? Boolean(myInfo.isAnon) : true,
        strangerAvatar: myInfo ? myInfo.avatar || null : null,
        strangerGender: myGender,
      });
      return;
    }

    randomQueue.push({
      socketId: socket.id,
      gender: myGender,
      lookingFor: myLookingFor,
    });
    broadcastRandomQueueCounts();
    socket.emit('waiting', { gender: myGender, lookingFor: myLookingFor });
  }

  io.on('connection', (socket) => {
    socket.emit('online_users', getDeduplicatedOnlineUsers());
    socket.emit('room_presence', getRoomPresenceSummary());
    socket.emit('random_queue_counts', getRandomQueueCounts());

    // Register client identity & join personal DM room
    socket.on('register', ({ id, name, isAnon, avatar }) => {
      if (!id || !name) return;

      const previous = onlineUsers.get(socket.id);
      if (previous && previous.id !== id) {
        socket.leave(`user:${previous.id}`);
      }

      onlineUsers.set(socket.id, {
        id: String(id),
        name: String(name),
        isAnon: Boolean(isAnon),
        avatar: avatar ? String(avatar) : null,
        socketId: socket.id,
        connectedAt: Date.now(),
      });

      socket.join(`user:${id}`);
      broadcastOnlineUsers();
      if (socketRooms.has(socket.id)) {
        broadcastRoomPresence();
      }
    });

    socket.on('request_online_users', () => {
      socket.emit('online_users', getDeduplicatedOnlineUsers());
    });

    socket.on('account_created', () => {
      io.emit('accounts_updated');
    });

    // ─── Random Chat (Male / Female categories) ───────────────────
    socket.on('join_queue', (payload = {}) => {
      enqueueForRandom(socket, {
        gender: payload.gender,
        lookingFor: payload.lookingFor,
      });
    });

    socket.on('random_message', ({ roomId, content, sender, senderAvatar }) => {
      const pair = randomPairs.get(socket.id);
      if (!pair || pair.roomId !== roomId) return;
      const trimmed = String(content || '').trim();
      if (!trimmed) return;

      const myInfo = onlineUsers.get(socket.id);
      socket.to(roomId).emit('random_message', {
        content: trimmed,
        sender: String(sender || 'Stranger'),
        senderAvatar: senderAvatar || myInfo?.avatar || null,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('random_typing', ({ roomId, isTyping }) => {
      const pair = randomPairs.get(socket.id);
      if (!pair || pair.roomId !== roomId) return;
      socket.to(roomId).emit('random_typing', { isTyping: Boolean(isTyping) });
    });

    socket.on('skip', (payload = {}) => {
      const shouldRequeue = Boolean(payload && payload.requeue);
      leaveRandomPair(socket, true);
      removeFromQueue(socket.id);
      if (shouldRequeue) {
        enqueueForRandom(socket, {
          gender: payload.gender,
          lookingFor: payload.lookingFor,
        });
      }
    });

    // ─── Direct Messages (Browse & Chat) ───────────────────────────
    socket.on('join_dm', ({ roomId }) => {
      if (roomId) socket.join(roomId);
    });

    socket.on('dm_message', ({ roomId, recipientId, content, sender, senderId, senderAvatar }) => {
      const trimmed = String(content || '').trim();
      if (!trimmed || !roomId || !senderId) return;

      const myInfo = onlineUsers.get(socket.id);
      const avatarToSave = senderAvatar || myInfo?.avatar || null;

      const saved = saveMessage({
        id: uuidv4(),
        room_id: String(roomId),
        sender: String(sender || 'Anonymous'),
        sender_id: String(senderId),
        sender_avatar: avatarToSave,
        content: trimmed,
      });

      const outgoing = {
        id: saved.id,
        roomId: saved.room_id,
        content: saved.content,
        sender: saved.sender,
        senderId: saved.sender_id,
        senderAvatar: saved.sender_avatar || null,
        recipientId: recipientId ? String(recipientId) : null,
        timestamp: saved.created_at,
      };

      if (recipientId) {
        io.to(`user:${recipientId}`).emit('dm_message', outgoing);
      } else {
        socket.to(roomId).emit('dm_message', outgoing);
      }

      socket.to(`user:${senderId}`).emit('dm_message', outgoing);
    });

    socket.on('dm_typing', ({ recipientId, senderId, isTyping }) => {
      if (!recipientId || !senderId) return;
      io.to(`user:${recipientId}`).emit('dm_typing', {
        senderId: String(senderId),
        isTyping: Boolean(isTyping),
      });
    });

    // ─── Group Chat Rooms ──────────────────────────────────────────
    socket.on('join_room', ({ roomId }) => {
      if (!roomId) return;
      const prevRoomId = socketRooms.get(socket.id);
      if (prevRoomId && prevRoomId !== roomId) {
        socket.leave(`chatroom:${prevRoomId}`);
      }
      socket.join(`chatroom:${roomId}`);
      socketRooms.set(socket.id, String(roomId));
      broadcastRoomPresence();
    });

    socket.on('leave_room', ({ roomId }) => {
      const target = roomId || socketRooms.get(socket.id);
      if (target) {
        socket.leave(`chatroom:${target}`);
      }
      socketRooms.delete(socket.id);
      broadcastRoomPresence();
    });

    socket.on('room_message', ({ roomId, content, sender, senderId, senderAvatar }) => {
      const trimmed = String(content || '').trim();
      if (!trimmed || !roomId || !senderId) return;

      const myInfo = onlineUsers.get(socket.id);
      const avatarToSave = senderAvatar || myInfo?.avatar || null;

      const dbRoomId = `chatroom:${roomId}`;
      const saved = saveMessage({
        id: uuidv4(),
        room_id: dbRoomId,
        sender: String(sender || 'Anonymous'),
        sender_id: String(senderId),
        sender_avatar: avatarToSave,
        content: trimmed,
      });

      const outgoing = {
        id: saved.id,
        roomId: String(roomId),
        content: saved.content,
        sender: saved.sender,
        senderId: saved.sender_id,
        senderAvatar: saved.sender_avatar || null,
        timestamp: saved.created_at,
      };

      io.to(dbRoomId).emit('room_message', outgoing);
    });

    socket.on('room_typing', ({ roomId, senderId, senderName, isTyping }) => {
      if (!roomId || !senderId) return;
      socket.to(`chatroom:${roomId}`).emit('room_typing', {
        roomId: String(roomId),
        senderId: String(senderId),
        senderName: String(senderName || 'Someone'),
        isTyping: Boolean(isTyping),
      });
    });

    socket.on('room_created', (room) => {
      io.emit('rooms_updated', room || null);
    });

    // ─── Social Feed (Posts) ───────────────────────────────────────
    socket.on('post_created', (post) => {
      if (post && post.id) io.emit('post_created', post);
    });

    socket.on('post_updated', (post) => {
      if (post && post.id) io.emit('post_updated', post);
    });

    socket.on('post_deleted', ({ id }) => {
      if (id) io.emit('post_deleted', { id });
    });

    // ─── Disconnect ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const wasInRoom = socketRooms.has(socket.id);
      socketRooms.delete(socket.id);
      onlineUsers.delete(socket.id);
      removeFromQueue(socket.id);
      leaveRandomPair(socket, true);
      broadcastOnlineUsers();
      if (wasInRoom) broadcastRoomPresence();
    });
  });

  const PORT = process.env.PORT || 3000;
  const HOST = '0.0.0.0';
  httpServer.listen(PORT, HOST, () => {
    console.log(`> ConTalk ready on http://localhost:${PORT} (network: http://${HOST}:${PORT})`);
  });
});
