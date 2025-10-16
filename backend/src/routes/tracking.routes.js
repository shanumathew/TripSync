const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/tracking.controller');
const { protect } = require('../middleware/auth');

/**
 * All tracking routes require authentication
 */

// Ride control routes
router.post('/rides/:id/start', protect, trackingController.startRide);
router.post('/rides/:id/complete', protect, trackingController.completeRide);
router.post('/rides/:id/cancel', protect, trackingController.cancelRide);

// Tracking data routes
router.get('/rides/:id', protect, trackingController.getTracking);
router.get('/rides/:id/route', protect, trackingController.getRoute);
router.get('/rides/:id/history', protect, trackingController.getLocationHistory);

// Location update (fallback for non-Socket.io)
router.post('/rides/:id/location', protect, trackingController.updateLocation);

// Notification routes
router.get('/notifications', protect, trackingController.getNotifications);
router.put('/notifications/read-all', protect, trackingController.markAllNotificationsRead);
router.get('/notifications/unread-count', protect, trackingController.getUnreadCount);
router.put('/notifications/:id/read', protect, trackingController.markNotificationRead);

module.exports = router;
