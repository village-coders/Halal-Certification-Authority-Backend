const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const allowedOrigins = process.env.client_domain 
  ? process.env.client_domain.split(",").map(url => url.trim())
  : [];

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    },
    path: '/socket.io/', // Add this line
    transports: ['websocket', 'polling'],
    allowEIO3: true // For compatibility
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user) {
      // Join user to their personal room (using user ID)
      socket.join(socket.user.id);
      
      // Join admin room if user is admin
      if (socket.user.role === 'admin' || socket.user.role === 'super admin') {
        socket.join('admin-room');
      }
    }

    socket.on('join_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on('ping', (data) => {
      socket.emit('pong', data);
    });

    socket.on('disconnect', (reason) => {
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('user-typing', {
        userId: socket.user?.id,
        isTyping
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('❌ User disconnected:', socket.user?.id, 'Reason:', reason);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
};

module.exports = { initSocket, getIo };