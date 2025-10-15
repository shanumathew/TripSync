const { Client } = require('@googlemaps/google-maps-services-js');

// Initialize Google Maps client
const googleMapsClient = new Client({});

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error('⚠️ GOOGLE_MAPS_API_KEY not found in environment variables');
}

/**
 * Calculate route between origin and destination
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @param {Array} waypoints - Optional array of {lat, lng} waypoints
 * @returns {Object} Route details with distance, duration, polyline
 */
const calculateRoute = async (origin, destination, waypoints = []) => {
  try {
    const waypointsFormatted = waypoints.map(wp => `${wp.lat},${wp.lng}`);

    const response = await googleMapsClient.directions({
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        waypoints: waypointsFormatted.length > 0 ? waypointsFormatted : undefined,
        mode: 'driving',
        departure_time: 'now', // Get real-time traffic data
        traffic_model: 'best_guess',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    return {
      distance: leg.distance.value / 1000, // Convert meters to km
      duration: Math.ceil(leg.duration.value / 60), // Convert seconds to minutes
      duration_in_traffic: leg.duration_in_traffic 
        ? Math.ceil(leg.duration_in_traffic.value / 60) 
        : Math.ceil(leg.duration.value / 60),
      polyline: route.overview_polyline.points,
      start_address: leg.start_address,
      end_address: leg.end_address,
      steps: leg.steps.map(step => ({
        distance: step.distance.value / 1000,
        duration: Math.ceil(step.duration.value / 60),
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML tags
        start_location: step.start_location,
        end_location: step.end_location,
      })),
    };
  } catch (error) {
    console.error('Error calculating route:', error.message);
    throw new Error(`Failed to calculate route: ${error.message}`);
  }
};

/**
 * Calculate distance and duration between two points
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Object} Distance in km and duration in minutes
 */
const calculateDistance = async (origin, destination) => {
  try {
    const response = await googleMapsClient.distancematrix({
      params: {
        origins: [`${origin.lat},${origin.lng}`],
        destinations: [`${destination.lat},${destination.lng}`],
        mode: 'driving',
        departure_time: 'now',
        traffic_model: 'best_guess',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    const element = response.data.rows[0].elements[0];

    if (element.status !== 'OK') {
      throw new Error(`Route calculation failed: ${element.status}`);
    }

    return {
      distance: element.distance.value / 1000, // km
      duration: Math.ceil(element.duration.value / 60), // minutes
      duration_in_traffic: element.duration_in_traffic 
        ? Math.ceil(element.duration_in_traffic.value / 60)
        : Math.ceil(element.duration.value / 60),
    };
  } catch (error) {
    console.error('Error calculating distance:', error.message);
    throw new Error(`Failed to calculate distance: ${error.message}`);
  }
};

/**
 * Calculate ETA (Estimated Time of Arrival)
 * @param {Object} currentLocation - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Object} ETA details
 */
const calculateETA = async (currentLocation, destination) => {
  try {
    const distanceData = await calculateDistance(currentLocation, destination);
    
    const now = new Date();
    const etaDate = new Date(now.getTime() + distanceData.duration_in_traffic * 60000);

    return {
      distance_km: distanceData.distance,
      duration_minutes: distanceData.duration_in_traffic,
      eta_timestamp: etaDate.toISOString(),
      eta_formatted: etaDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
    };
  } catch (error) {
    console.error('Error calculating ETA:', error.message);
    throw new Error(`Failed to calculate ETA: ${error.message}`);
  }
};

/**
 * Get directions with turn-by-turn instructions
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Object} Detailed directions
 */
const getDirections = async (origin, destination) => {
  try {
    const response = await googleMapsClient.directions({
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: 'driving',
        departure_time: 'now',
        traffic_model: 'best_guess',
        alternatives: false,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    return {
      summary: route.summary,
      distance: leg.distance.value / 1000,
      duration: Math.ceil(leg.duration.value / 60),
      duration_in_traffic: leg.duration_in_traffic 
        ? Math.ceil(leg.duration_in_traffic.value / 60)
        : Math.ceil(leg.duration.value / 60),
      start_address: leg.start_address,
      end_address: leg.end_address,
      steps: leg.steps.map((step, index) => ({
        step_number: index + 1,
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distance: step.distance.text,
        duration: step.duration.text,
        maneuver: step.maneuver || 'straight',
        start_location: step.start_location,
        end_location: step.end_location,
      })),
      polyline: route.overview_polyline.points,
    };
  } catch (error) {
    console.error('Error getting directions:', error.message);
    throw new Error(`Failed to get directions: ${error.message}`);
  }
};

/**
 * Geocode address to coordinates
 * @param {String} address - Address string
 * @returns {Object} Coordinates {lat, lng}
 */
const geocodeAddress = async (address) => {
  try {
    const response = await googleMapsClient.geocode({
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }

    const location = response.data.results[0].geometry.location;

    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: response.data.results[0].formatted_address,
    };
  } catch (error) {
    console.error('Error geocoding address:', error.message);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
};

/**
 * Reverse geocode coordinates to address
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {String} Formatted address
 */
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await googleMapsClient.reverseGeocode({
      params: {
        latlng: `${lat},${lng}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Reverse geocoding failed: ${response.data.status}`);
    }

    return response.data.results[0].formatted_address;
  } catch (error) {
    console.error('Error reverse geocoding:', error.message);
    throw new Error(`Failed to reverse geocode: ${error.message}`);
  }
};

/**
 * Get nearby places (landmarks, etc.)
 * @param {Object} location - {lat, lng}
 * @param {String} type - Place type (e.g., 'restaurant', 'gas_station')
 * @param {Number} radius - Search radius in meters (default 1000m)
 * @returns {Array} Nearby places
 */
const getNearbyPlaces = async (location, type = 'point_of_interest', radius = 1000) => {
  try {
    const response = await googleMapsClient.placesNearby({
      params: {
        location: `${location.lat},${location.lng}`,
        radius,
        type,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${response.data.status}`);
    }

    return response.data.results.map(place => ({
      name: place.name,
      address: place.vicinity,
      location: place.geometry.location,
      types: place.types,
      rating: place.rating,
    }));
  } catch (error) {
    console.error('Error getting nearby places:', error.message);
    throw new Error(`Failed to get nearby places: ${error.message}`);
  }
};

module.exports = {
  calculateRoute,
  calculateDistance,
  calculateETA,
  getDirections,
  geocodeAddress,
  reverseGeocode,
  getNearbyPlaces,
};
