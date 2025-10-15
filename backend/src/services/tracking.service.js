const db = require('../config/database');
const mapsService = require('./maps.service');
const locationService = require('./location.service');

/**
 * Tracking Service
 * Manages real-time ride tracking, location updates, and history
 */

/**
 * Start tracking for a ride
 * @param {Number} rideId - Ride ID
 * @param {Object} pickupLocation - {lat, lng}
 * @param {Object} dropoffLocation - {lat, lng}
 * @param {Object} driverLocation - {lat, lng}
 * @returns {Object} Tracking data
 */
const startTracking = async (rideId, pickupLocation, dropoffLocation, driverLocation) => {
  try {
    // Calculate route from driver to pickup
    const routeToPickup = await mapsService.calculateRoute(driverLocation, pickupLocation);

    // Calculate route from pickup to destination
    const routeToDestination = await mapsService.calculateRoute(pickupLocation, dropoffLocation);

    // Calculate distance to pickup
    const distanceToPickup = locationService.calculateHaversineDistance(
      driverLocation.lat,
      driverLocation.lng,
      pickupLocation.lat,
      pickupLocation.lng
    );

    // Insert tracking record
    const query = `
      INSERT INTO ride_tracking (
        ride_id,
        driver_location_lat,
        driver_location_lng,
        pickup_location_lat,
        pickup_location_lng,
        dropoff_location_lat,
        dropoff_location_lng,
        estimated_pickup_time,
        estimated_dropoff_time,
        distance_to_pickup,
        distance_to_destination,
        route_polyline,
        route_distance,
        route_duration,
        tracking_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      rideId,
      driverLocation.lat,
      driverLocation.lng,
      pickupLocation.lat,
      pickupLocation.lng,
      dropoffLocation.lat,
      dropoffLocation.lng,
      routeToPickup.duration_in_traffic,
      routeToPickup.duration_in_traffic + routeToDestination.duration_in_traffic,
      distanceToPickup,
      routeToDestination.distance,
      routeToDestination.polyline,
      routeToDestination.distance,
      routeToDestination.duration_in_traffic,
      'en_route_to_pickup',
    ];

    const result = await db.query(query, values);

    return {
      success: true,
      tracking: result.rows[0],
      routeToPickup,
      routeToDestination,
    };
  } catch (error) {
    console.error('Error starting tracking:', error);
    throw error;
  }
};

/**
 * Update driver location
 * @param {Number} rideId - Ride ID
 * @param {Object} location - {lat, lng, heading, speed}
 * @returns {Object} Updated tracking data with proximity info
 */
const updateLocation = async (rideId, location) => {
  try {
    // Get current tracking data
    const trackingQuery = `
      SELECT * FROM ride_tracking
      WHERE ride_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const trackingResult = await db.query(trackingQuery, [rideId]);

    if (trackingResult.rows.length === 0) {
      throw new Error('No active tracking found for this ride');
    }

    const tracking = trackingResult.rows[0];

    // Calculate distance to pickup
    const distanceToPickup = locationService.calculateHaversineDistance(
      location.lat,
      location.lng,
      tracking.pickup_location_lat,
      tracking.pickup_location_lng
    );

    // Calculate distance to destination
    const distanceToDestination = locationService.calculateHaversineDistance(
      location.lat,
      location.lng,
      tracking.dropoff_location_lat,
      tracking.dropoff_location_lng
    );

    // Get proximity status for pickup
    const proximityStatus = locationService.getProximityStatus(distanceToPickup);

    // Determine tracking status based on proximity
    let newTrackingStatus = tracking.tracking_status;
    if (tracking.tracking_status === 'en_route_to_pickup' && distanceToPickup <= 0.05) {
      // Within 50 meters
      newTrackingStatus = 'at_pickup';
    } else if (tracking.tracking_status === 'en_route_to_destination' && distanceToDestination <= 0.05) {
      newTrackingStatus = 'completed';
    }

    // Calculate new ETA
    const etaToPickup = locationService.calculateSimpleETA(distanceToPickup);
    const etaToDestination = locationService.calculateSimpleETA(distanceToDestination);

    // Update tracking
    const updateQuery = `
      UPDATE ride_tracking
      SET 
        driver_location_lat = $1,
        driver_location_lng = $2,
        driver_heading = $3,
        driver_speed = $4,
        distance_to_pickup = $5,
        distance_to_destination = $6,
        estimated_pickup_time = $7,
        estimated_dropoff_time = $8,
        tracking_status = $9,
        last_updated = CURRENT_TIMESTAMP
      WHERE ride_id = $10 AND is_active = TRUE
      RETURNING *
    `;

    const updateValues = [
      location.lat,
      location.lng,
      location.heading || 0,
      location.speed || 0,
      distanceToPickup,
      distanceToDestination,
      etaToPickup,
      etaToDestination,
      newTrackingStatus,
      rideId,
    ];

    const result = await db.query(updateQuery, updateValues);

    // Save to location history
    await saveLocationHistory(rideId, {
      lat: location.lat,
      lng: location.lng,
      speed: location.speed || 0,
      heading: location.heading || 0,
      accuracy: location.accuracy || null,
      tracking_status: newTrackingStatus,
    });

    return {
      success: true,
      tracking: result.rows[0],
      proximity: proximityStatus,
      statusChanged: newTrackingStatus !== tracking.tracking_status,
    };
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

/**
 * Save location to history
 * @param {Number} rideId - Ride ID
 * @param {Object} locationData - Location data
 * @returns {Object} Saved history record
 */
const saveLocationHistory = async (rideId, locationData) => {
  try {
    const query = `
      INSERT INTO ride_location_history (
        ride_id,
        lat,
        lng,
        speed,
        heading,
        accuracy,
        tracking_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      rideId,
      locationData.lat,
      locationData.lng,
      locationData.speed,
      locationData.heading,
      locationData.accuracy,
      locationData.tracking_status,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error saving location history:', error);
    // Don't throw error - history saving shouldn't break tracking
    return null;
  }
};

/**
 * Stop tracking for a ride
 * @param {Number} rideId - Ride ID
 * @returns {Object} Result
 */
const stopTracking = async (rideId) => {
  try {
    const query = `
      UPDATE ride_tracking
      SET 
        is_active = FALSE,
        tracking_status = 'completed'
      WHERE ride_id = $1 AND is_active = TRUE
      RETURNING *
    `;

    const result = await db.query(query, [rideId]);

    return {
      success: true,
      tracking: result.rows[0],
    };
  } catch (error) {
    console.error('Error stopping tracking:', error);
    throw error;
  }
};

/**
 * Get tracking data for a ride
 * @param {Number} rideId - Ride ID
 * @returns {Object} Tracking data
 */
const getTracking = async (rideId) => {
  try {
    const query = `
      SELECT * FROM ride_tracking
      WHERE ride_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [rideId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error getting tracking:', error);
    throw error;
  }
};

/**
 * Get location history for a ride
 * @param {Number} rideId - Ride ID
 * @param {Number} limit - Number of records to return
 * @returns {Array} Location history
 */
const getLocationHistory = async (rideId, limit = 100) => {
  try {
    const query = `
      SELECT * FROM ride_location_history
      WHERE ride_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    const result = await db.query(query, [rideId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error getting location history:', error);
    throw error;
  }
};

/**
 * Calculate proximity to pickup/dropoff
 * @param {Object} driverLocation - {lat, lng}
 * @param {Object} targetLocation - {lat, lng}
 * @returns {Object} Proximity information
 */
const calculateProximity = (driverLocation, targetLocation) => {
  const distance = locationService.calculateHaversineDistance(
    driverLocation.lat,
    driverLocation.lng,
    targetLocation.lat,
    targetLocation.lng
  );

  const proximityStatus = locationService.getProximityStatus(distance);
  const bearing = locationService.calculateBearing(driverLocation, targetLocation);
  const direction = locationService.getCompassDirection(bearing);

  return {
    distance,
    distanceFormatted: locationService.formatDistance(distance),
    bearing,
    direction,
    status: proximityStatus,
    isNearby: distance <= 0.5, // Within 500 meters
    hasArrived: distance <= 0.05, // Within 50 meters
  };
};

/**
 * Update tracking status manually
 * @param {Number} rideId - Ride ID
 * @param {String} status - New status
 * @returns {Object} Updated tracking
 */
const updateTrackingStatus = async (rideId, status) => {
  try {
    const validStatuses = ['idle', 'en_route_to_pickup', 'at_pickup', 'en_route_to_destination', 'completed'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid tracking status: ${status}`);
    }

    const query = `
      UPDATE ride_tracking
      SET tracking_status = $1
      WHERE ride_id = $2 AND is_active = TRUE
      RETURNING *
    `;

    const result = await db.query(query, [status, rideId]);

    return {
      success: true,
      tracking: result.rows[0],
    };
  } catch (error) {
    console.error('Error updating tracking status:', error);
    throw error;
  }
};

module.exports = {
  startTracking,
  updateLocation,
  stopTracking,
  getTracking,
  getLocationHistory,
  calculateProximity,
  saveLocationHistory,
  updateTrackingStatus,
};
