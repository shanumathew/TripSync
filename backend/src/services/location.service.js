/**
 * Location Service
 * Handles location calculations, distance, bearing, geofencing
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {Number} lat1 - First point latitude
 * @param {Number} lng1 - First point longitude
 * @param {Number} lat2 - Second point latitude
 * @param {Number} lng2 - Second point longitude
 * @returns {Number} Distance in kilometers
 */
const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Convert degrees to radians
 * @param {Number} degrees
 * @returns {Number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 * @param {Number} radians
 * @returns {Number} Degrees
 */
const toDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

/**
 * Check if a location is near a target location (geofencing)
 * @param {Object} currentLocation - {lat, lng}
 * @param {Object} targetLocation - {lat, lng}
 * @param {Number} radiusKm - Radius in kilometers
 * @returns {Boolean} True if within radius
 */
const isNearLocation = (currentLocation, targetLocation, radiusKm) => {
  const distance = calculateHaversineDistance(
    currentLocation.lat,
    currentLocation.lng,
    targetLocation.lat,
    targetLocation.lng
  );
  return distance <= radiusKm;
};

/**
 * Calculate bearing (direction) between two points
 * @param {Object} from - {lat, lng}
 * @param {Object} to - {lat, lng}
 * @returns {Number} Bearing in degrees (0-360, where 0/360 is North)
 */
const calculateBearing = (from, to) => {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const dLng = toRadians(to.lng - from.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360; // Normalize to 0-360

  return Math.round(bearing);
};

/**
 * Get compass direction from bearing
 * @param {Number} bearing - Bearing in degrees (0-360)
 * @returns {String} Compass direction (N, NE, E, SE, S, SW, W, NW)
 */
const getCompassDirection = (bearing) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Calculate estimated time of arrival based on distance and average speed
 * @param {Number} distanceKm - Distance in kilometers
 * @param {Number} averageSpeedKmh - Average speed in km/h (default 40 km/h for city driving)
 * @returns {Number} ETA in minutes
 */
const calculateSimpleETA = (distanceKm, averageSpeedKmh = 40) => {
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.ceil(hours * 60);
  return minutes;
};

/**
 * Get proximity status based on distance
 * @param {Number} distanceKm - Distance in kilometers
 * @returns {Object} Status object with message and code
 */
const getProximityStatus = (distanceKm) => {
  const distanceMeters = distanceKm * 1000;

  if (distanceMeters <= 50) {
    return {
      code: 'arrived',
      message: 'Arrived at location',
      distance: distanceKm,
    };
  } else if (distanceMeters <= 100) {
    return {
      code: 'very_close',
      message: 'Very close (within 100m)',
      distance: distanceKm,
    };
  } else if (distanceMeters <= 500) {
    return {
      code: 'nearby',
      message: 'Nearby (within 500m)',
      distance: distanceKm,
    };
  } else if (distanceMeters <= 1000) {
    return {
      code: 'approaching',
      message: 'Approaching (within 1km)',
      distance: distanceKm,
    };
  } else if (distanceKm <= 5) {
    return {
      code: 'close',
      message: `${distanceKm.toFixed(1)} km away`,
      distance: distanceKm,
    };
  } else {
    return {
      code: 'far',
      message: `${distanceKm.toFixed(1)} km away`,
      distance: distanceKm,
    };
  }
};

/**
 * Validate GPS coordinates
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Boolean} True if valid
 */
const isValidCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Calculate center point (midpoint) between two coordinates
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {Object} Center point {lat, lng}
 */
const calculateMidpoint = (point1, point2) => {
  const lat1 = toRadians(point1.lat);
  const lng1 = toRadians(point1.lng);
  const lat2 = toRadians(point2.lat);
  const lng2 = toRadians(point2.lng);

  const bX = Math.cos(lat2) * Math.cos(lng2 - lng1);
  const bY = Math.cos(lat2) * Math.sin(lng2 - lng1);

  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bX) * (Math.cos(lat1) + bX) + bY * bY)
  );
  const lng3 = lng1 + Math.atan2(bY, Math.cos(lat1) + bX);

  return {
    lat: toDegrees(lat3),
    lng: toDegrees(lng3),
  };
};

/**
 * Calculate bounding box around a point
 * @param {Object} center - {lat, lng}
 * @param {Number} radiusKm - Radius in kilometers
 * @returns {Object} Bounding box {north, south, east, west}
 */
const calculateBoundingBox = (center, radiusKm) => {
  const lat = toRadians(center.lat);
  const lng = toRadians(center.lng);
  const radiusRadians = radiusKm / 6371; // Earth radius in km

  const latMin = lat - radiusRadians;
  const latMax = lat + radiusRadians;

  const deltaLng = Math.asin(Math.sin(radiusRadians) / Math.cos(lat));
  const lngMin = lng - deltaLng;
  const lngMax = lng + deltaLng;

  return {
    north: toDegrees(latMax),
    south: toDegrees(latMin),
    east: toDegrees(lngMax),
    west: toDegrees(lngMin),
  };
};

/**
 * Check if coordinates are within bounding box
 * @param {Object} point - {lat, lng}
 * @param {Object} bounds - {north, south, east, west}
 * @returns {Boolean} True if within bounds
 */
const isWithinBounds = (point, bounds) => {
  return (
    point.lat >= bounds.south &&
    point.lat <= bounds.north &&
    point.lng >= bounds.west &&
    point.lng <= bounds.east
  );
};

/**
 * Format distance for display
 * @param {Number} distanceKm - Distance in kilometers
 * @returns {String} Formatted distance string
 */
const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  } else {
    return `${Math.round(distanceKm)} km`;
  }
};

/**
 * Format duration for display
 * @param {Number} minutes - Duration in minutes
 * @returns {String} Formatted duration string
 */
const formatDuration = (minutes) => {
  if (minutes < 1) {
    return '< 1 min';
  } else if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
};

/**
 * Calculate speed between two location points
 * @param {Object} point1 - {lat, lng, timestamp}
 * @param {Object} point2 - {lat, lng, timestamp}
 * @returns {Number} Speed in km/h
 */
const calculateSpeed = (point1, point2) => {
  const distance = calculateHaversineDistance(
    point1.lat,
    point1.lng,
    point2.lat,
    point2.lng
  );

  const timeDiff = (new Date(point2.timestamp) - new Date(point1.timestamp)) / 1000; // seconds
  const hours = timeDiff / 3600;

  if (hours === 0) return 0;

  const speed = distance / hours;
  return Math.round(speed * 10) / 10; // Round to 1 decimal place
};

module.exports = {
  calculateHaversineDistance,
  isNearLocation,
  calculateBearing,
  getCompassDirection,
  calculateSimpleETA,
  getProximityStatus,
  isValidCoordinates,
  calculateMidpoint,
  calculateBoundingBox,
  isWithinBounds,
  formatDistance,
  formatDuration,
  calculateSpeed,
  toRadians,
  toDegrees,
};
