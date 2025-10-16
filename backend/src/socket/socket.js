const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

let io = null;

/**
 * Socket.io authentication middleware
 */
const authenticateSocket = async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await db.query(
      'SELECT user_id, email, username, is_driver FROM users WHERE user_id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.user = result.rows[0];
    next();

  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

/**
 * Initialize Socket.io server
 */
const initializeSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Apply authentication middleware
  io.use(authenticateSocket);

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.username} (${socket.user.user_id})`);

    // Store user's socket ID for direct messaging
    socket.userId = socket.user.user_id;

    // Join user to their personal room
    socket.join(`user_${socket.user.user_id}`);

    // Send connection confirmation
    socket.emit('connected', {
      userId: socket.user.user_id,
      username: socket.user.username,
      isDriver: socket.user.is_driver,
      socketId: socket.id
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);
    });

    // Import and setup event handlers
    require('./events')(io, socket);
  });

  console.log('🚀 Socket.io server initialized');
  return io;
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocketServer first.');
  }
  return io;
};

/**
 * Emit event to specific user
 */
const emitToUser = (userId, event, data) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }
  io.to(`user_${userId}`).emit(event, data);
};

/**
 * Emit event to specific ride room
 */
const emitToRide = (rideId, event, data) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }
  io.to(`ride_${rideId}`).emit(event, data);
};

/**
 * Check if user is online
 */
const isUserOnline = async (userId) => {
  if (!io) return false;
  
  const sockets = await io.in(`user_${userId}`).fetchSockets();
  return sockets.length > 0;
};

module.exports = {
  initializeSocketServer,
  getIO,
  emitToUser,
  emitToRide,
  isUserOnline
};
