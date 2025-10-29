/**
 * Custom Node.js server for Next.js with Socket.IO support
 * This allows real-time WebSocket communication alongside Next.js API routes
 */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Listen on all network interfaces
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO with CORS configuration
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for development
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      console.log('Socket connection rejected: No token provided');
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      console.log(`Socket authenticated: ${socket.userId} (${socket.userEmail})`);
      next();
    } catch (err) {
      console.log(`Socket authentication failed: ${err.message}`);
      return next(new Error('Invalid or expired token'));
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`✓ User connected: ${socket.userId} [${socket.id}]`);

    // Join user to their personal room for direct notifications
    socket.join(`user:${socket.userId}`);

    // Track active rooms for cleanup
    const activeRooms = new Set();

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

  // Make io instance available globally for API routes
  global.io = io;

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      io.close(() => {
        console.log('Socket.IO server closed');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', () => {
    console.log('\nSIGINT signal received: closing servers');
    server.close(() => {
      console.log('HTTP server closed');
      io.close(() => {
        console.log('Socket.IO server closed');
        process.exit(0);
      });
    });
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log('');
    console.log('================================================');
    console.log(`✓ Next.js + Socket.IO Server Ready`);
    console.log(`================================================`);
    console.log(`  Local:            http://localhost:${port}`);
    console.log(
      `  Network:          http://${hostname === '0.0.0.0' ? '0.0.0.0' : hostname}:${port}`
    );
    console.log(`  Environment:      ${dev ? 'development' : 'production'}`);
    console.log(`  Socket.IO:        ✓ Active`);
    console.log(`  Transports:       websocket, polling`);
    console.log('================================================');
    console.log('');
  });
});
