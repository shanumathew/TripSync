const db = require('../config/database');
const locationService = require('./location.service');

/**
 * Notification Service
 * Manages ride notifications and proximity alerts
 */

// Notification types
const NotificationType = {
  DRIVER_ASSIGNED: 'driver_assigned',
  DRIVER_NEARBY: 'driver_nearby',
  DRIVER_ARRIVED: 'driver_arrived',
  RIDE_STARTED: 'ride_started',
  ARRIVING_SOON: 'arriving_soon',
  RIDE_COMPLETED: 'ride_completed',
  RIDE_CANCELLED: 'ride_cancelled',
  ETA_UPDATED: 'eta_updated',
};

/**
 * Create notification
 * @param {Number} rideId - Ride ID
 * @param {Number} userId - User to notify
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} metadata - Additional data
 * @returns {Object} Created notification
 */
const createNotification = async (rideId, userId, type, title, message, metadata = {}) => {
  try {
    const query = `
      INSERT INTO ride_notifications (
        ride_id,
        user_id,
        notification_type,
        title,
        message,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [rideId, userId, type, title, message, JSON.stringify(metadata)];

    const result = await db.query(query, values);

    return {
      success: true,
      notification: result.rows[0],
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Check and send proximity-based notifications
 * @param {Number} rideId - Ride ID
 * @param {Object} driverLocation - {lat, lng}
 * @param {Object} pickupLocation - {lat, lng}
 * @param {Number} passengerId - Passenger user ID
 * @returns {Object} Notification sent (if any)
 */
const checkProximityNotifications = async (rideId, driverLocation, pickupLocation, passengerId) => {
  try {
    const distance = locationService.calculateHaversineDistance(
      driverLocation.lat,
      driverLocation.lng,
      pickupLocation.lat,
      pickupLocation.lng
    );

    // Check if we already sent this type of notification recently
    const recentCheckQuery = `
      SELECT * FROM ride_notifications
      WHERE ride_id = $1 
        AND user_id = $2 
        AND notification_type = $3
        AND created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    // Within 1 km - send "arriving soon" notification
    if (distance <= 1.0 && distance > 0.5) {
      const existing = await db.query(recentCheckQuery, [rideId, passengerId, NotificationType.ARRIVING_SOON]);
      
      if (existing.rows.length === 0) {
        return await createNotification(
          rideId,
          passengerId,
          NotificationType.ARRIVING_SOON,
          '🚗 Driver Arriving Soon',
          `Your driver is ${locationService.formatDistance(distance)} away`,
          { distance, eta: locationService.calculateSimpleETA(distance) }
        );
      }
    }

    // Within 500m - send "driver nearby" notification
    if (distance <= 0.5 && distance > 0.1) {
      const existing = await db.query(recentCheckQuery, [rideId, passengerId, NotificationType.DRIVER_NEARBY]);
      
      if (existing.rows.length === 0) {
        return await createNotification(
          rideId,
          passengerId,
          NotificationType.DRIVER_NEARBY,
          '📍 Driver Nearby',
          `Your driver is ${locationService.formatDistance(distance)} away`,
          { distance, eta: locationService.calculateSimpleETA(distance) }
        );
      }
    }

    // Within 100m - send "driver arrived" notification
    if (distance <= 0.1) {
      const existing = await db.query(recentCheckQuery, [rideId, passengerId, NotificationType.DRIVER_ARRIVED]);
      
      if (existing.rows.length === 0) {
        return await createNotification(
          rideId,
          passengerId,
          NotificationType.DRIVER_ARRIVED,
          '✅ Driver Has Arrived',
          'Your driver is waiting for you',
          { distance }
        );
      }
    }

    return { success: true, notificationSent: false };
  } catch (error) {
    console.error('Error checking proximity notifications:', error);
    // Don't throw error - notifications shouldn't break tracking
    return { success: false, error: error.message };
  }
};

/**
 * Send driver assigned notification
 * @param {Number} rideId - Ride ID
 * @param {Number} passengerId - Passenger ID
 * @param {Object} driverInfo - Driver details
 * @returns {Object} Notification
 */
const notifyDriverAssigned = async (rideId, passengerId, driverInfo) => {
  return await createNotification(
    rideId,
    passengerId,
    NotificationType.DRIVER_ASSIGNED,
    '🚗 Driver Assigned',
    `${driverInfo.name} is on the way!`,
    {
      driverId: driverInfo.id,
      driverName: driverInfo.name,
      driverRating: driverInfo.driver_rating,
      vehicle: driverInfo.vehicle,
    }
  );
};

/**
 * Send ride started notification
 * @param {Number} rideId - Ride ID
 * @param {Number} passengerId - Passenger ID
 * @returns {Object} Notification
 */
const notifyRideStarted = async (rideId, passengerId) => {
  return await createNotification(
    rideId,
    passengerId,
    NotificationType.RIDE_STARTED,
    '🚀 Ride Started',
    'Your ride has begun. Enjoy your trip!',
    { startedAt: new Date().toISOString() }
  );
};

/**
 * Send ride completed notification
 * @param {Number} rideId - Ride ID
 * @param {Number} passengerId - Passenger ID
 * @param {Object} rideData - Ride completion data
 * @returns {Object} Notification
 */
const notifyRideCompleted = async (rideId, passengerId, rideData = {}) => {
  return await createNotification(
    rideId,
    passengerId,
    NotificationType.RIDE_COMPLETED,
    '✅ Ride Completed',
    'Thank you for riding with us! Please rate your experience.',
    {
      completedAt: new Date().toISOString(),
      distance: rideData.actual_distance,
      duration: rideData.actual_duration,
    }
  );
};

/**
 * Send ride cancelled notification
 * @param {Number} rideId - Ride ID
 * @param {Number} userId - User to notify
 * @param {String} cancelledBy - Who cancelled ('passenger' or 'driver')
 * @param {String} reason - Cancellation reason
 * @returns {Object} Notification
 */
const notifyRideCancelled = async (rideId, userId, cancelledBy, reason = null) => {
  const message = cancelledBy === 'driver' 
    ? 'Your driver has cancelled the ride.' 
    : 'The ride has been cancelled.';

  return await createNotification(
    rideId,
    userId,
    NotificationType.RIDE_CANCELLED,
    '❌ Ride Cancelled',
    reason ? `${message} Reason: ${reason}` : message,
    { cancelledBy, reason, cancelledAt: new Date().toISOString() }
  );
};

/**
 * Send ETA updated notification
 * @param {Number} rideId - Ride ID
 * @param {Number} passengerId - Passenger ID
 * @param {Number} newETA - New ETA in minutes
 * @returns {Object} Notification
 */
const notifyETAUpdated = async (rideId, passengerId, newETA) => {
  return await createNotification(
    rideId,
    passengerId,
    NotificationType.ETA_UPDATED,
    '⏱️ ETA Updated',
    `Your driver will arrive in ${locationService.formatDuration(newETA)}`,
    { eta: newETA }
  );
};

/**
 * Get notifications for a user
 * @param {Number} userId - User ID
 * @param {Boolean} unreadOnly - Get only unread notifications
 * @param {Number} limit - Number of notifications to return
 * @returns {Array} Notifications
 */
const getUserNotifications = async (userId, unreadOnly = false, limit = 50) => {
  try {
    let query = `
      SELECT * FROM ride_notifications
      WHERE user_id = $1
    `;

    if (unreadOnly) {
      query += ' AND is_read = FALSE';
    }

    query += `
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [userId, limit]);

    return {
      success: true,
      notifications: result.rows,
      count: result.rows.length,
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {String} notificationId - Notification ID (UUID)
 * @returns {Object} Updated notification
 */
const markAsRead = async (notificationId) => {
  try {
    const query = `
      UPDATE ride_notifications
      SET 
        is_read = TRUE,
        read_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [notificationId]);

    return {
      success: true,
      notification: result.rows[0],
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {Number} userId - User ID
 * @returns {Object} Result
 */
const markAllAsRead = async (userId) => {
  try {
    const query = `
      UPDATE ride_notifications
      SET 
        is_read = TRUE,
        read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = FALSE
    `;

    const result = await db.query(query, [userId]);

    return {
      success: true,
      markedCount: result.rowCount,
    };
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 * @param {Number} userId - User ID
 * @returns {Number} Unread count
 */
const getUnreadCount = async (userId) => {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM ride_notifications
      WHERE user_id = $1 AND is_read = FALSE
    `;

    const result = await db.query(query, [userId]);

    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Delete old notifications (cleanup)
 * @param {Number} daysOld - Delete notifications older than this many days
 * @returns {Object} Result
 */
const deleteOldNotifications = async (daysOld = 30) => {
  try {
    const query = `
      DELETE FROM ride_notifications
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
    `;

    const result = await db.query(query);

    return {
      success: true,
      deletedCount: result.rowCount,
    };
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    throw error;
  }
};

module.exports = {
  NotificationType,
  createNotification,
  checkProximityNotifications,
  notifyDriverAssigned,
  notifyRideStarted,
  notifyRideCompleted,
  notifyRideCancelled,
  notifyETAUpdated,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteOldNotifications,
};
