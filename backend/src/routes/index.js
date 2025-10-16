const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'TripSync API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API version info
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to TripSync API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      rides: '/api/rides',
      tracking: '/api/tracking',
      vehicles: '/api/vehicles',
      matches: '/api/matches',
      users: '/api/users',
    },
  });
});

// Import route modules
const authRoutes = require('./auth.routes');
const rideRoutes = require('./ride.routes');
const vehicleRoutes = require('./vehicle.routes');
const trackingRoutes = require('./tracking.routes');
// const matchRoutes = require('./match.routes');
// const userRoutes = require('./user.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/rides', rideRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/tracking', trackingRoutes);
// router.use('/matches', matchRoutes);
// router.use('/users', userRoutes);

module.exports = router;
