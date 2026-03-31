/**
 * Socket.io Real-time Module
 * Handles live order updates, kitchen screen, and notifications
 */
const { Server } = require('socket.io');
const { verifyAccessToken } = require('./utils/jwt');
const logger = require('./utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // JWT authentication for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role, branch } = socket.user;
    logger.info(`Socket connected: user=${id} role=${role}`);

    // Join branch-specific room
    if (branch) {
      socket.join(`branch_${branch}`);
    }

    // Kitchen screen subscription
    socket.on('kitchen:join', (branchId) => {
      socket.join(`kitchen_${branchId}`);
      logger.info(`Socket ${socket.id} joined kitchen room for branch ${branchId}`);
    });

    // POS screen subscription
    socket.on('pos:join', (branchId) => {
      socket.join(`pos_${branchId}`);
    });

    // Table map subscription
    socket.on('tables:join', (branchId) => {
      socket.join(`tables_${branchId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user=${id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
