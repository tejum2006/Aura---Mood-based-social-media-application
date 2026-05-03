require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const likesRoutes = require('./routes/likes');
const commentsRoutes = require('./routes/comments');
const messagesRoutes = require('./routes/messages');
const postsRoutes = require('./routes/posts');
const searchRoutes = require('./routes/search');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://aura-mood-based-social-media.vercel.app'],
    methods: ['GET', 'POST'],
  },
});

// ─── Socket.io Logic ──────────────────────────────────────────────────────────
const userSockets = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join', (userId) => {
    userSockets.set(userId, socket.id);
  });

  socket.on('sendMessage', (data) => {
    // data: { receiverId, message }
    const receiverSocket = userSockets.get(data.receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('receiveMessage', data.message);
    }
  });

  // WebRTC Signaling
  socket.on('callUser', (data) => {
    const receiverSocket = userSockets.get(data.userToCall);
    if (receiverSocket) {
      io.to(receiverSocket).emit('callUser', { signal: data.signalData, from: data.from, name: data.name });
    }
  });

  socket.on('answerCall', (data) => {
    const callerSocket = userSockets.get(data.to);
    if (callerSocket) {
      io.to(callerSocket).emit('callAccepted', data.signal);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://aura-mood-based-social-media.vercel.app' // 👈 YOUR FRONTEND URL
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'AURA server running ✦',
    db: mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌',
    time: new Date().toISOString(),
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose.set('strictQuery', false);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected →', process.env.MONGO_URI);
    server.listen(PORT, () => {
      console.log(`🚀 AURA backend running → http://localhost:${PORT}`);
      console.log(`📊 Health check → http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('\n❌ MongoDB connection FAILED:', err.message);
    console.error('📌 Make sure MongoDB is running locally, or set MONGO_URI in server/.env to your Atlas connection string.');
    console.error('   Example Atlas URI: mongodb+srv://<user>:<password>@cluster.mongodb.net/aura\n');
    process.exit(1);
  });
