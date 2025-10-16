const trackingService = require('../services/tracking.service');
const rideStatusService = require('../services/rideStatus.service');
const notificationService = require('../services/notification.service');
const mapsService = require('../services/maps.service');
const db = require('../config/database');

/**
 * Start a ride (driver begins trip)
 * POST /api/tracking/rides/:id/start
 */
const startRide = async (req, res) => {
  try {
    const { id: rideId } = req.params;
    const driverId = req.user.id;

    // Check if ride exists and driver is assigned
    const ride = await rideStatusService.getRideDetails(rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.driver_id !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'You are not the driver for this ride'
      });
    }

    if (ride.ride_status !== 'at_pickup') {
      return res.status(400).json({
        success: false,
        message: `Cannot start ride from status: ${ride.ride_status}. Must be at_pickup.`
      });
    }

    // Start the ride
    const result = await rideStatusService.startRide(rideId, driverId);

    // Notify passenger
    await notificationService.notifyRideStarted(rideId, ride.passenger_id);

    return res.status(200).json({
      success: true,
      message: 'Ride started successfully',
      data: result
    });

  } catch (error) {
    console.error('Error starting ride:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to start ride'
    });
  }
};

/**
 * Complete a ride (driver ends trip)
 * POST /api/tracking/rides/:id/complete
 */
const completeRide = async (req, res) => {
  try {
    const { id: rideId } = req.params;
    const driverId = req.user.id;
    const { final_location } = req.body;

    // Check if ride exists and driver is assigned
    const ride = await rideStatusService.getRideDetails(rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.driver_id !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'You are not the driver for this ride'
      });
    }

    if (ride.ride_status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete ride from status: ${ride.ride_status}. Must be in_progress.`
      });
    }

    // Complete the ride
    const completionData = {
      final_location,
      completed_at: new Date()
    };

    const result = await rideStatusService.completeRide(rideId, driverId, completionData);

    // Notify passenger
    await notificationService.notifyRideCompleted(rideId, ride.passenger_id, result);

    return res.status(200).json({
      success: true,
      message: 'Ride completed successfully',
      data: result
    });

  } catch (error) {
    console.error('Error completing ride:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete ride'
    });
  }
};

/**
 * Cancel a ride
 * POST /api/tracking/rides/:id/cancel
 */
const cancelRide = async (req, res) => {
  try {
    const { id: rideId } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    // Check if ride exists
    const ride = await rideStatusService.getRideDetails(rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user is passenger or driver
    if (ride.passenger_id !== userId && ride.driver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this ride'
      });
    }

    if (ride.ride_status === 'completed' || ride.ride_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ride with status: ${ride.ride_status}`
      });
    }

    // Determine who cancelled
    const cancelledBy = ride.passenger_id === userId ? 'passenger' : 'driver';

    // Cancel the ride
    const result = await rideStatusService.cancelRide(rideId, userId, reason || 'No reason provided');

    // Notify the other party
    const notifyUserId = cancelledBy === 'passenger' ? ride.driver_id : ride.passenger_id;
    if (notifyUserId) {
      await notificationService.notifyRideCancelled(rideId, notifyUserId, cancelledBy, reason);
    }

    return res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      data: result
    });

  } catch (error) {
    console.error('Error cancelling ride:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel ride'
    });
  }
};

/**
 * Get tracking data for a ride
 * GET /api/tracking/rides/:id
 */
const getTracking = async (req, res) => {
  try {
    const { id: rideId } = req.params;
    const userId = req.user.id;

    // Check if ride exists
    const ride = await rideStatusService.getRideDetails(rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user is passenger or driver
    if (ride.passenger_id !== userId && ride.driver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this ride'
      });
    }

    // Get tracking data
    const tracking = await trackingService.getTracking(rideId);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'No tracking data available for this ride'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ride,
        tracking
      }
    });

  } catch (error) {
    console.error('Error fetching tracking:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tracking data'
    });
  }
};

/**
 * Get route information for a ride
 * GET /api/tracking/rides/:id/route
 */
const getRoute = async (req, res) => {
  try {
    const { id: rideId } = req.params;
    const userId = req.user.id;

    // Check if ride exists
    const ride = await rideStatusService.getRideDetails(rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user is passenger or driver
    if (ride.passenger_id !== userId && ride.driver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this ride'
      });
    }

    // Get tracking data for route
    const tracking = await trackingService.getTracking(rideId);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'No route data available for this ride'
      });
    }

    // Get detailed directions if driver location is available
    let directions = null;
    if (tracking.driver_location_lat && tracking.driver_location_lng) {
      const origin = {
        lat: tracking.driver_location_lat,
        lng: tracking.driver_location_lng
      };
      
      const destination = ride.ride_status === 'in_progress' 
        ? { lat: ride.dropoff_lat, lng: ride.dropoff_lng }
        : { lat: ride.pickup_lat, lng: ride.pickup_lng };

      try {
        directions = await mapsService.getDirections(origin, destination);
      } catch (error) {
        console.error('Error fetching directions:', error);
        // Continue without directions
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        route_polyline: tracking.route_polyline,
        estimated_distance: tracking.estimated_distance,
        estimated_duration: tracking.estimated_duration,
        eta: tracking.eta,
        directions
      }
    });

  } catch (error) {
    console.error('Error fetching route:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch route data'
    });
  }
};

/**
 * Update driver location (fallback for non-Socket.io updates)
 * POST /api/tracking/rides/:id/location
 */
const updateLocation = async (req, res) => {
  try {
    const { id: rideId } = req.params;
    const driverId = req.user.id;
    const { latitude, longitude, heading, speed } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Check if ride exists and driver is assigned
    const ride = await rideStatusService.getRideDetails(rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.driver_id !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'You are not the driver for this ride'
      });
    }

    // Only allow location updates for active rides
    const activeStatuses = ['driver_arriving', 'at_pickup', 'in_progress'];
    if (!activeStatuses.includes(ride.ride_status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update location for ride with status: ${ride.ride_status}`
      });
    }

    // Update location
    const location = {
      latitude,
      longitude,
      heading: heading || null,
      speed: speed || null,
      timestamp: new Date()
    };

    const result = await trackingService.updateLocation(rideId, location);

    // Check for proximity notifications
    if (ride.ride_status !== 'in_progress') {
      await notificationService.checkProximityNotifications(
        rideId,
        { lat: latitude, lng: longitude },
        { lat: ride.pickup_lat, lng: ride.pickup_lng },
        ride.passenger_id
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error updating location:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update location'
    });
  }
};

/**
 * Get location history for a ride
 * GET /api/tracking/rides/:id/history
 */
const getLocationHistory = async (req, res) => {
  try {
    const { id: rideId } = req.params;
    const userId = req.user.id;
    const { limit } = req.query;

    // Check if ride exists
    const ride = await rideStatusService.getRideDetails(rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user is passenger or driver
    if (ride.passenger_id !== userId && ride.driver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this ride'
      });
    }

    // Get location history
    const history = await trackingService.getLocationHistory(rideId, limit ? parseInt(limit) : 1000);

    return res.status(200).json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error fetching location history:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch location history'
    });
  }
};

/**
 * Get user notifications
 * GET /api/tracking/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only, limit } = req.query;

    const unreadOnly = unread_only === 'true';
    const limitValue = limit ? parseInt(limit) : 50;

    const notifications = await notificationService.getUserNotifications(userId, unreadOnly, limitValue);

    return res.status(200).json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notifications'
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/tracking/notifications/:id/read
 */
const markNotificationRead = async (req, res) => {
  try {
    const { id: notificationId } = req.params;

    await notificationService.markAsRead(notificationId);

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/tracking/notifications/read-all
 */
const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await notificationService.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all notifications as read'
    });
  }
};

/**
 * Get unread notification count
 * GET /api/tracking/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await notificationService.getUnreadCount(userId);

    return res.status(200).json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch unread count'
    });
  }
};

module.exports = {
  startRide,
  completeRide,
  cancelRide,
  getTracking,
  getRoute,
  updateLocation,
  getLocationHistory,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount
};
