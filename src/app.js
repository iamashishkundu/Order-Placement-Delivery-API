const express = require('express');
const cors = require('cors');
const { loadRoutes } = require('./config/routeLoader');
const errorHandler = require('./common/middlewares/errorHandler');
const { apiLimiter } = require('./common/middlewares/rateLimiter');
const ApiError = require('./common/utils/ApiError');
const ERROR_CODES = require('./common/constants/errorCodes');
const { successResponse } = require('./common/utils/apiResponse');
const stripeWebhookRouter = require('./webhooks/stripe/handleStripeWebhook/handleStripeWebhook.route');
const paymentResultRouter = require('./webhooks/stripe/paymentResultPages.route');

const app = express();

// Stripe webhook endpoint mounted explicitly BEFORE express.json with express.raw
app.use(
  ['/webhooks/stripe', '/api/v1/webhooks/stripe'],
  express.raw({ type: 'application/json' }),
  stripeWebhookRouter
);

// Payment result landing pages (HTML UI for redirect after checkout)
app.use(paymentResultRouter);

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general API rate limiting
app.use('/api', apiLimiter);

// Health check endpoints
app.get('/health', (req, res) => {
  return successResponse(res, 200, 'Server is running and healthy.', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/v1/health', (req, res) => {
  return successResponse(res, 200, 'API v1 is running and healthy.', {
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Dynamic Route Loader for modules
loadRoutes(app);

// 404 Handler for undefined routes
app.use((req, res, next) => {
  next(
    ApiError.notFound(
      ERROR_CODES.NOT_FOUND,
      `Cannot ${req.method} ${req.originalUrl} - Route not found.`
    )
  );
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
