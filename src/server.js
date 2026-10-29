const env = require('./config/env');
const app = require('./app');
const { connectDB, sequelize } = require('./config/database');
const { startExpireStalePaymentsJob, stopExpireStalePaymentsJob } = require('./jobs/expireStalePayments.job');

let server;

const startServer = async () => {
  try {
    // Attempt database connection
    try {
      await connectDB();
    } catch (dbError) {
      console.warn('Database connection warning (proceeding):', dbError.message);
    }

    server = app.listen(env.PORT, () => {
      console.log(`Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
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

startServer();

