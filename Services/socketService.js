const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "http://localhost:5175",
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
    
    console.log('Auth attempt with token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('No token provided, allowing connection for non-authenticated events');
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      console.log('User authenticated:', decoded.id, decoded.email);
      next();
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('✅ New connection ID:', socket.id);
    
    if (socket.user) {
      console.log('User connected:', socket.user.id, socket.user.email);
      
      // Join user to their personal room (using user ID)
      socket.join(socket.user.id);
      console.log(`User ${socket.user.id} joined room ${socket.user.id}`);
      
      // Join admin room if user is admin
      if (socket.user.role === 'admin' || socket.user.role === 'super admin') {
        socket.join('admin-room');
        console.log(`Admin ${socket.user.id} joined admin-room`);
      }
    }

    // Default event for testing connection
    socket.emit('connected', { 
      message: 'Connected to server', 
      userId: socket.user?.id,
      socketId: socket.id 
    });

    // Join specific conversation
    socket.on('join-conversation', (conversationId) => {
      console.log(`User ${socket.user?.id || 'guest'} joining conversation ${conversationId}`);
      socket.join(conversationId);
    });

    // Leave conversation
    socket.on('leave-conversation', (conversationId) => {
      console.log(`User ${socket.user?.id || 'guest'} leaving conversation ${conversationId}`);
      socket.leave(conversationId);
    });

    // Test ping
    socket.on('ping', (data) => {
      console.log('Ping received:', data);
      socket.emit('pong', { 
        message: 'pong', 
        timestamp: new Date().toISOString(),
        data 
      });
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