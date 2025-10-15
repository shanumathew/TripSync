const db = require('../config/database');

/**
 * Ride Status Service
 * Manages ride status transitions with state machine logic
 */

// Valid ride statuses
const RideStatus = {
  PENDING: 'pending',
  DRIVER_ASSIGNED: 'driver_assigned',
  DRIVER_ARRIVING: 'driver_arriving',
  AT_PICKUP: 'at_pickup',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Valid status transitions
const VALID_TRANSITIONS = {
  pending: ['driver_assigned', 'cancelled'],
  driver_assigned: ['driver_arriving', 'cancelled'],
  driver_arriving: ['at_pickup', 'cancelled'],
  at_pickup: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Check if status transition is valid
 * @param {String} currentStatus - Current ride status
 * @param {String} newStatus - Desired new status
 * @returns {Boolean} True if transition is valid
 */
const isValidTransition = (currentStatus, newStatus) => {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};

/**
 * Update ride status
 * @param {Number} rideId - Ride ID
 * @param {String} newStatus - New status
 * @param {Number} userId - User making the change (for validation)
 * @returns {Object} Updated ride
 */
const updateRideStatus = async (rideId, newStatus, userId = null) => {
  try {
    // Get current ride
    const getRideQuery = 'SELECT * FROM rides WHERE id = $1';
    const rideResult = await db.query(getRideQuery, [rideId]);

    if (rideResult.rows.length === 0) {
      throw new Error('Ride not found');
    }

    const ride = rideResult.rows[0];

    // Validate transition
    if (!isValidTransition(ride.ride_status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${ride.ride_status} to ${newStatus}`
      );
    }

    // Validate user authorization
    if (userId) {
      if (newStatus === RideStatus.CANCELLED && userId !== ride.user_id) {
        throw new Error('Only passenger can cancel ride');
      }
      if (['at_pickup', 'in_progress', 'completed'].includes(newStatus) && userId !== ride.driver_id) {
        throw new Error('Only driver can update ride progress');
      }
    }

    // Update ride status
    const updateQuery = `
      UPDATE rides
      SET ride_status = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(updateQuery, [newStatus, rideId]);

    return {
      success: true,
      ride: result.rows[0],
      previousStatus: ride.ride_status,
    };
  } catch (error) {
    console.error('Error updating ride status:', error);
    throw error;
  }
};

/**
 * Start a ride (transition to in_progress)
 * @param {Number} rideId - Ride ID
 * @param {Number} driverId - Driver ID
 * @returns {Object} Updated ride
 */
const startRide = async (rideId, driverId) => {
  try {
    // Get ride
    const getRideQuery = 'SELECT * FROM rides WHERE id = $1';
    const rideResult = await db.query(getRideQuery, [rideId]);

    if (rideResult.rows.length === 0) {
      throw new Error('Ride not found');
    }

    const ride = rideResult.rows[0];

    // Validate driver
    if (ride.driver_id !== driverId) {
      throw new Error('Only assigned driver can start ride');
    }

    // Validate current status
    if (ride.ride_status !== RideStatus.AT_PICKUP) {
      throw new Error(`Cannot start ride from status: ${ride.ride_status}. Must be at_pickup.`);
    }

    // Update to in_progress
    const updateQuery = `
      UPDATE rides
      SET 
        ride_status = $1,
        started_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(updateQuery, [RideStatus.IN_PROGRESS, rideId]);

    // Update tracking status
    const trackingQuery = `
      UPDATE ride_tracking
      SET tracking_status = 'en_route_to_destination'
      WHERE ride_id = $1 AND is_active = TRUE
    `;
    await db.query(trackingQuery, [rideId]);

    return {
      success: true,
      ride: result.rows[0],
      message: 'Ride started successfully',
    };
  } catch (error) {
    console.error('Error starting ride:', error);
    throw error;
  }
};

/**
 * Complete a ride
 * @param {Number} rideId - Ride ID
 * @param {Number} driverId - Driver ID
 * @param {Object} completionData - {actual_distance, actual_duration}
 * @returns {Object} Completed ride
 */
const completeRide = async (rideId, driverId, completionData = {}) => {
  try {
    // Get ride
    const getRideQuery = 'SELECT * FROM rides WHERE id = $1';
    const rideResult = await db.query(getRideQuery, [rideId]);

    if (rideResult.rows.length === 0) {
      throw new Error('Ride not found');
    }

    const ride = rideResult.rows[0];

    // Validate driver
    if (ride.driver_id !== driverId) {
      throw new Error('Only assigned driver can complete ride');
    }

    // Validate current status
    if (ride.ride_status !== RideStatus.IN_PROGRESS) {
      throw new Error(`Cannot complete ride from status: ${ride.ride_status}. Must be in_progress.`);
    }

    // Calculate actual duration if not provided
    let actualDuration = completionData.actual_duration;
    if (!actualDuration && ride.started_at) {
      const startTime = new Date(ride.started_at);
      const endTime = new Date();
      actualDuration = Math.ceil((endTime - startTime) / 60000); // minutes
    }

    // Update to completed
    const updateQuery = `
      UPDATE rides
      SET 
        ride_status = $1,
        completed_at = CURRENT_TIMESTAMP,
        actual_distance = $2,
        actual_duration = $3
      WHERE id = $4
      RETURNING *
    `;

    const result = await db.query(updateQuery, [
      RideStatus.COMPLETED,
      completionData.actual_distance || null,
      actualDuration,
      rideId,
    ]);

    // Stop tracking
    const trackingQuery = `
      UPDATE ride_tracking
      SET 
        is_active = FALSE,
        tracking_status = 'completed'
      WHERE ride_id = $1 AND is_active = TRUE
    `;
    await db.query(trackingQuery, [rideId]);

    // Update driver stats
    const driverStatsQuery = `
      UPDATE users
      SET total_rides_as_driver = total_rides_as_driver + 1
      WHERE id = $1
    `;
    await db.query(driverStatsQuery, [driverId]);

    return {
      success: true,
      ride: result.rows[0],
      message: 'Ride completed successfully',
    };
  } catch (error) {
    console.error('Error completing ride:', error);
    throw error;
  }
};

/**
 * Cancel a ride
 * @param {Number} rideId - Ride ID
 * @param {Number} userId - User cancelling (passenger or driver)
 * @param {String} reason - Cancellation reason
 * @returns {Object} Cancelled ride
 */
const cancelRide = async (rideId, userId, reason = null) => {
  try {
    // Get ride
    const getRideQuery = 'SELECT * FROM rides WHERE id = $1';
    const rideResult = await db.query(getRideQuery, [rideId]);

    if (rideResult.rows.length === 0) {
      throw new Error('Ride not found');
    }

    const ride = rideResult.rows[0];

    // Validate user is passenger or driver
    if (userId !== ride.user_id && userId !== ride.driver_id) {
      throw new Error('Only passenger or driver can cancel ride');
    }

    // Check if ride can be cancelled
    if ([RideStatus.COMPLETED, RideStatus.CANCELLED].includes(ride.ride_status)) {
      throw new Error(`Cannot cancel ride with status: ${ride.ride_status}`);
    }

    // Update to cancelled
    const updateQuery = `
      UPDATE rides
      SET ride_status = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(updateQuery, [RideStatus.CANCELLED, rideId]);

    // Stop tracking if active
    const trackingQuery = `
      UPDATE ride_tracking
      SET 
        is_active = FALSE,
        tracking_status = 'completed'
      WHERE ride_id = $1 AND is_active = TRUE
    `;
    await db.query(trackingQuery, [rideId]);

    return {
      success: true,
      ride: result.rows[0],
      message: 'Ride cancelled successfully',
      cancelledBy: userId === ride.user_id ? 'passenger' : 'driver',
      reason,
    };
  } catch (error) {
    console.error('Error cancelling ride:', error);
    throw error;
  }
};

/**
 * Assign driver to ride
 * @param {Number} rideId - Ride ID
 * @param {Number} driverId - Driver ID
 * @param {Number} vehicleId - Vehicle ID
 * @returns {Object} Updated ride
 */
const assignDriver = async (rideId, driverId, vehicleId) => {
  try {
    // Verify driver exists and is active
    const driverQuery = 'SELECT * FROM users WHERE id = $1 AND is_driver = TRUE';
    const driverResult = await db.query(driverQuery, [driverId]);

    if (driverResult.rows.length === 0) {
      throw new Error('Driver not found or not active');
    }

    // Verify vehicle exists and belongs to driver
    const vehicleQuery = 'SELECT * FROM vehicles WHERE id = $1 AND user_id = $2 AND is_active = TRUE';
    const vehicleResult = await db.query(vehicleQuery, [vehicleId, driverId]);

    if (vehicleResult.rows.length === 0) {
      throw new Error('Vehicle not found or not available');
    }

    // Update ride
    const updateQuery = `
      UPDATE rides
      SET 
        driver_id = $1,
        vehicle_id = $2,
        ride_status = $3
      WHERE id = $4
      RETURNING *
    `;

    const result = await db.query(updateQuery, [
      driverId,
      vehicleId,
      RideStatus.DRIVER_ASSIGNED,
      rideId,
    ]);

    return {
      success: true,
      ride: result.rows[0],
      message: 'Driver assigned successfully',
    };
  } catch (error) {
    console.error('Error assigning driver:', error);
    throw error;
  }
};

/**
 * Get ride with full details (user, driver, vehicle, tracking)
 * @param {Number} rideId - Ride ID
 * @returns {Object} Full ride details
 */
const getRideDetails = async (rideId) => {
  try {
    const query = `
      SELECT * FROM active_rides_with_tracking
      WHERE ride_id = $1
    `;

    const result = await db.query(query, [rideId]);

    if (result.rows.length === 0) {
      // Try getting from rides table if not in active view
      const fallbackQuery = `
        SELECT 
          r.*,
          u.name as passenger_name,
          u.phone as passenger_phone,
          d.name as driver_name,
          d.phone as driver_phone,
          v.model as vehicle_model,
          v.color as vehicle_color,
          v.license_plate
        FROM rides r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN users d ON r.driver_id = d.id
        LEFT JOIN vehicles v ON r.vehicle_id = v.id
        WHERE r.id = $1
      `;

      const fallbackResult = await db.query(fallbackQuery, [rideId]);
      
      if (fallbackResult.rows.length === 0) {
        throw new Error('Ride not found');
      }

      return fallbackResult.rows[0];
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error getting ride details:', error);
    throw error;
  }
};

module.exports = {
  RideStatus,
  isValidTransition,
  updateRideStatus,
  startRide,
  completeRide,
  cancelRide,
  assignDriver,
  getRideDetails,
};
