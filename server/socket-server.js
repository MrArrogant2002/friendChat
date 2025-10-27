/**
 * Standalone Socket.IO Server
 * This server handles real-time WebSocket connections separately from the Next.js API
 * Deploy this to Railway, Render, or any Node.js hosting platform
 */
require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const PORT = process.env.SOCKET_PORT || process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : '*';

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET is required');
  process.exit(1);
}

const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'FriendChat Socket.IO Server',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Initialize Socket.IO with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true, // Allow Engine.IO v3 clients
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    console.log('Socket connection rejected: No token provided');
    return next(new Error('Authentication token required'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    console.log(`Socket authenticated: ${socket.userId} (${socket.userEmail})`);
    next();
  } catch (err) {
    console.log(`Socket authentication failed: ${err.message}`);
    return next(new Error('Invalid or expired token'));
  }
});

// Track connected users
const connectedUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✓ User connected: ${socket.userId} [${socket.id}]`);
  
  // Add to connected users
  connectedUsers.set(socket.userId, socket.id);

  // Join user to their personal room for direct notifications
  socket.join(`user:${socket.userId}`);

  // Track active rooms for cleanup
  const activeRooms = new Set();

  // Broadcast user online status
  socket.broadcast.emit('user-online', { userId: socket.userId });

  // Join chat room
  socket.on('join-chat', (chatId) => {
    if (!chatId || typeof chatId !== 'string') {
      socket.emit('error', { message: 'Invalid chatId' });
      return;
    }

    const roomName = `chat:${chatId}`;
    socket.join(roomName);
    activeRooms.add(roomName);
    
    console.log(`  → User ${socket.userId} joined chat ${chatId}`);
    
    // Notify room members
    socket.to(roomName).emit('user-joined', {
      userId: socket.userId,
      chatId,
      timestamp: new Date().toISOString(),
    });
  });

  // Leave chat room
  socket.on('leave-chat', (chatId) => {
    if (!chatId || typeof chatId !== 'string') {
      socket.emit('error', { message: 'Invalid chatId' });
      return;
    }

    const roomName = `chat:${chatId}`;
    socket.leave(roomName);
    activeRooms.delete(roomName);
    
    console.log(`  ← User ${socket.userId} left chat ${chatId}`);
    
    // Notify room members
    socket.to(roomName).emit('user-left', {
      userId: socket.userId,
      chatId,
      timestamp: new Date().toISOString(),
    });
  });

  // Typing indicator
  socket.on('typing-start', (chatId) => {
    if (!chatId) return;
    socket.to(`chat:${chatId}`).emit('user-typing', {
      userId: socket.userId,
      chatId,
    });
  });

  socket.on('typing-stop', (chatId) => {
    if (!chatId) return;
    socket.to(`chat:${chatId}`).emit('user-stopped-typing', {
      userId: socket.userId,
      chatId,
    });
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.userId}:`, error);
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`✗ User disconnected: ${socket.userId} [${socket.id}] - Reason: ${reason}`);
    
    // Remove from connected users
    connectedUsers.delete(socket.userId);
    
    // Broadcast user offline status
    socket.broadcast.emit('user-offline', { userId: socket.userId });
    
    // Clean up: notify all active rooms
    activeRooms.forEach((roomName) => {
      const chatId = roomName.replace('chat:', '');
      io.to(roomName).emit('user-left', {
        userId: socket.userId,
        chatId,
        timestamp: new Date().toISOString(),
      });
    });
    
    // Clear active rooms
    activeRooms.clear();
  });

  // Handle disconnecting (before disconnect)
  socket.on('disconnecting', () => {
    console.log(`  Disconnecting user ${socket.userId}...`);
  });
});

// Error handling for Socket.IO
io.engine.on('connection_error', (err) => {
  console.error('Socket.IO connection error:', {
    code: err.code,
    message: err.message,
    context: err.context,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    io.close(() => {
      console.log('Socket.IO server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing servers');
  httpServer.close(() => {
    console.log('HTTP server closed');
    io.close(() => {
      console.log('Socket.IO server closed');
      process.exit(0);
    });
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('================================================');
  console.log(`✓ Socket.IO Server Ready`);
  console.log('================================================');
  console.log(`  Port:             ${PORT}`);
  console.log(`  Environment:      ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Allowed Origins:  ${Array.isArray(ALLOWED_ORIGINS) ? ALLOWED_ORIGINS.join(', ') : ALLOWED_ORIGINS}`);
  console.log(`  Health Check:     http://localhost:${PORT}/health`);
  console.log(`  Transports:       websocket, polling`);
  console.log('================================================');
  console.log('');
});

module.exports = { io, httpServer };
