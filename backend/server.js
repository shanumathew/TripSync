const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./src/config');
const logger = require('./src/middleware/logger');
const { errorHandler } = require('./src/middleware/errorHandler');
const routes = require('./src/routes');
const db = require('./src/config/database');

// Initialize Express app
const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(logger);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================
// API ROUTES
// ============================================

app.use('/api', routes);

// 404 handler for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use(errorHandler);

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

const PORT = config.port;

// Test database connection before starting server
const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('✅ Database connection verified');

    // Start the server
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log(`🚀 TripSync Backend Server Started`);
      console.log(`🚀 Environment: ${config.nodeEnv}`);
      console.log(`🚀 Port: ${PORT}`);
      console.log(`🚀 URL: http://localhost:${PORT}`);
      console.log(`🚀 Health Check: http://localhost:${PORT}/api/health`);
      console.log('🚀 ========================================');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('💤 Process terminated');
        db.pool.end();
      });
    });

    process.on('SIGINT', () => {
      console.log('👋 SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('💤 Process terminated');
        db.pool.end();
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
