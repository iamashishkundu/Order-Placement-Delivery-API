const { Server } = require('socket.io');
const env = require('../config/env');
const { socketAuthMiddleware } = require('./socket.auth');
const { registerSocketHandlers } = require('./socket.handlers');

let io = null;

/**
 * Parses allowed CORS origins from environment variable.
 */
const getCorsOrigins = () => {
  const origins = env.SOCKET_CORS_ORIGINS || '*';
  if (origins === '*' || origins.trim() === '') {
    return '*';
  }
  return origins.split(',').map((o) => o.trim());
};

/**
 * Initializes and attaches Socket.IO to the Node HTTP server.
 *
 * @param {import('http').Server} httpServer - Node.js HTTP server instance
 * @returns {import('socket.io').Server} Initialized Socket.IO server instance
 */
const initSocketServer = (httpServer) => {
  if (io) {
    return io;
  }

  const corsOrigins = getCorsOrigins();

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: corsOrigins !== '*',
    },
    // Keep ping interval and timeout sensible for web and mobile clients
    pingInterval: 25000,
    pingTimeout: 20000,
    // Future extension point: Redis adapter can be attached here
    // adapter: createAdapter(pubClient, subClient)
  });

  // Apply handshake authentication middleware
  io.use(socketAuthMiddleware);

  // Register connection handlers
  io.on('connection', (socket) => {
    registerSocketHandlers(io, socket);
  });

  return io;
};

/**
 * Returns active Socket.IO server instance, or null if not yet initialized.
 *
 * @returns {import('socket.io').Server|null}
 */
const getIO = () => {
  return io;
};

/**
 * Closes the Socket.IO server connection pool.
 */
const closeSocketServer = async () => {
  if (io) {
    await new Promise((resolve) => {
      io.close(() => {
        io = null;
        resolve();
      });
    });
  }
};

module.exports = {
  initSocketServer,
  getIO,
  closeSocketServer,
};

