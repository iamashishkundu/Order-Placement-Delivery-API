const http = require('http');
const env = require('./config/env');
const app = require('./app');
const { connectDB, sequelize } = require('./config/database');
const { startExpireStalePaymentsJob, stopExpireStalePaymentsJob } = require('./jobs/expireStalePayments.job');
const { initSocketServer, closeSocketServer } = require('./realtime/socket.server');

const server = http.createServer(app);
initSocketServer(server);

const startServer = async () => {
  try {
    // Attempt database connection
    try {
      await connectDB();
    } catch (dbError) {
      console.warn('Database connection warning (proceeding):', dbError.message);
    }

    server.listen(env.PORT, () => {
      console.log(`Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
      console.log(`Socket.IO real-time engine attached and ready.`);
      startExpireStalePaymentsJob();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  stopExpireStalePaymentsJob();

  try {
    await closeSocketServer();
    console.log('Socket.IO server closed.');
  } catch (socketErr) {
    console.error('Error closing Socket.IO server:', socketErr.message);
  }

  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await sequelize.close();
        console.log('Database connection closed.');
      } catch (err) {
        console.error('Error closing database connection:', err.message);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = {
  server,
  startServer,
  gracefulShutdown,
};
