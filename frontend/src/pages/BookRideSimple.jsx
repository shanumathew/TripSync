import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import MapContainer from '../components/maps/MapContainer';
import rideService from '../services/rideService';
import './BookRideSimple.css';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 }; // Delhi

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

// Popular locations in Delhi
const POPULAR_LOCATIONS = [
  { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { name: 'India Gate', lat: 28.6129, lng: 77.2295 },
  { name: 'Red Fort', lat: 28.6562, lng: 77.2410 },
  { name: 'Qutub Minar', lat: 28.5244, lng: 77.1855 },
  { name: 'Lotus Temple', lat: 28.5535, lng: 77.2588 },
  { name: 'Akshardham Temple', lat: 28.6127, lng: 77.2773 },
  { name: 'IGI Airport Terminal 3', lat: 28.5562, lng: 77.0999 },
  { name: 'Noida Sector 18', lat: 28.5678, lng: 77.3232 },
  { name: 'Nehru Place', lat: 28.5494, lng: 77.2501 },
  { name: 'Chandni Chowk', lat: 28.6506, lng: 77.2303 },
];

/**
 * BookRideSimple - Book a ride using dropdown selection (no autocomplete)
 */
const BookRideSimple = () => {
  const navigate = useNavigate();

  const [map, setMap] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [pickupName, setPickupName] = useState('');
  const [dropoffName, setDropoffName] = useState('');
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [fare, setFare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle pickup selection
  const handlePickupSelect = (e) => {
    const selectedIndex = e.target.value;
    if (selectedIndex) {
      const location = POPULAR_LOCATIONS[selectedIndex];
      setPickup({ lat: location.lat, lng: location.lng });
      setPickupName(location.name);
      
      if (map) {
        map.panTo({ lat: location.lat, lng: location.lng });
      }
    } else {
      setPickup(null);
      setPickupName('');
    }
  };

  // Handle dropoff selection
  const handleDropoffSelect = (e) => {
    const selectedIndex = e.target.value;
    if (selectedIndex) {
      const location = POPULAR_LOCATIONS[selectedIndex];
      setDropoff({ lat: location.lat, lng: location.lng });
      setDropoffName(location.name);
    } else {
      setDropoff(null);
      setDropoffName('');
    }
  };

  // Calculate route when both locations are selected
  React.useEffect(() => {
    if (!pickup || !dropoff || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: pickup,
        destination: dropoff,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
          
          const route = result.routes[0].legs[0];
          setDistance(route.distance.text);
          setDuration(route.duration.text);
          
          // Calculate fare (₹10 base + ₹12 per km)
          const distanceKm = route.distance.value / 1000;
          const calculatedFare = Math.round(10 + (distanceKm * 12));
          setFare(calculatedFare);

          // Fit map to show entire route
          if (map) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(pickup);
            bounds.extend(dropoff);
            map.fitBounds(bounds);
          }
        } else {
          console.error('Directions request failed:', status);
          setError('Failed to calculate route');
        }
      }
    );
  }, [pickup, dropoff, map]);

  // Create ride
  const handleBookRide = async () => {
    if (!pickup || !dropoff) {
      setError('Please select both pickup and drop-off locations');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rideData = {
        pickup_location: pickupName,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        dropoff_location: dropoffName,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
        fare: fare,
        distance: distance,
        estimated_duration: duration,
      };

      console.log('Creating ride with data:', rideData);

      const response = await rideService.createRide(rideData);

      if (response.success) {
        console.log('Ride created:', response.data.ride);
        // Navigate to tracking page
        navigate(`/track/${response.data.ride.id}`);
      } else {
        setError(response.message || 'Failed to create ride');
      }
    } catch (err) {
      console.error('Error creating ride:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

  const onLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  return (
    <div className="book-ride-page">
      <div className="book-ride-container">
        {/* Left Panel - Search Form */}
        <div className="search-panel">
          <div className="panel-header">
            <h2>🚗 Book a Ride</h2>
            <p>Select your pickup and drop-off locations</p>
          </div>

          <div className="search-form">
            {/* Pickup Location */}
            <div className="input-group">
              <label>
                <span className="input-icon pickup-icon">📍</span>
                Pickup Location
              </label>
              <select
                className="location-select"
                onChange={handlePickupSelect}
                value={pickup ? POPULAR_LOCATIONS.findIndex(loc => 
                  loc.lat === pickup.lat && loc.lng === pickup.lng
                ) : ''}
              >
                <option value="">-- Select Pickup Location --</option>
                {POPULAR_LOCATIONS.map((location, index) => (
                  <option key={index} value={index}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropoff Location */}
            <div className="input-group">
              <label>
                <span className="input-icon dropoff-icon">🎯</span>
                Drop-off Location
              </label>
              <select
                className="location-select"
                onChange={handleDropoffSelect}
                value={dropoff ? POPULAR_LOCATIONS.findIndex(loc => 
                  loc.lat === dropoff.lat && loc.lng === dropoff.lng
                ) : ''}
              >
                <option value="">-- Select Drop-off Location --</option>
                {POPULAR_LOCATIONS.map((location, index) => (
                  <option key={index} value={index}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Route Info */}
            {distance && duration && fare && (
              <div className="route-info">
                <div className="info-card">
                  <div className="info-item">
                    <span className="info-icon">📏</span>
                    <div>
                      <div className="info-label">Distance</div>
                      <div className="info-value">{distance}</div>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">⏱️</span>
                    <div>
                      <div className="info-label">Duration</div>
                      <div className="info-value">{duration}</div>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">💰</span>
                    <div>
                      <div className="info-label">Estimated Fare</div>
                      <div className="info-value">₹{fare}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Book Button */}
            <button
              className="book-ride-btn"
              onClick={handleBookRide}
              disabled={!pickup || !dropoff || loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Booking...
                </>
              ) : (
                <>
                  <span>🚗</span>
                  Book Ride - ₹{fare || '0'}
                </>
              )}
            </button>

            {/* Info Text */}
            <div className="info-text">
              <p>💡 Tip: Select locations from dropdown to see route</p>
              <p>🔒 Safe & Secure Payment</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="map-panel">
          <MapContainer>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={pickup || DEFAULT_CENTER}
              zoom={12}
              onLoad={onLoad}
              options={mapOptions}
            >
              {/* Pickup Marker */}
              {pickup && (
                <Marker
                  position={pickup}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="#34A853" stroke="white" stroke-width="3"/>
                        <text x="20" y="28" font-size="20" text-anchor="middle" fill="white" font-weight="bold">P</text>
                      </svg>
                    `),
                    scaledSize: new window.google.maps.Size(40, 40),
                    anchor: new window.google.maps.Point(20, 20),
                  }}
                  title={pickupName}
                />
              )}

              {/* Dropoff Marker */}
              {dropoff && (
                <Marker
                  position={dropoff}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="#EA4335" stroke="white" stroke-width="3"/>
                        <text x="20" y="28" font-size="20" text-anchor="middle" fill="white" font-weight="bold">D</text>
                      </svg>
                    `),
                    scaledSize: new window.google.maps.Size(40, 40),
                    anchor: new window.google.maps.Point(20, 20),
                  }}
                  title={dropoffName}
                />
              )}

              {/* Route Polyline */}
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: '#4285F4',
                      strokeWeight: 5,
                      strokeOpacity: 0.8,
                    },
                  }}
                />
              )}
            </GoogleMap>
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default BookRideSimple;
