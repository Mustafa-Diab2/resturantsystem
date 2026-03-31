/**
 * ServeX Backend – Entry Point
 * Initializes Express server with Socket.io and all middleware
 */
require('dotenv').config();
require('express-async-errors');

const http = require('http');
const app  = require('./app');
const { initSocket } = require('./socket');
const pool = require('./db/pool');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Verify DB connection on startup
pool.connect()
  .then(client => {
    logger.info('✅ PostgreSQL connected');
    client.release();
  })
  .catch(err => {
    logger.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  });

server.listen(PORT, () => {
  logger.info(`🚀 ServeX API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received – shutting down gracefully');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});
