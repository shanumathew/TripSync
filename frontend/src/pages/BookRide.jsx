import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import MapContainer from '../components/maps/MapContainer';
import useGeolocation from '../hooks/useGeolocation';
import rideService from '../services/rideService';
import './BookRide.css';

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

/**
 * BookRide - Search pickup/drop locations and create a ride
 */
const BookRide = () => {
  const navigate = useNavigate();
  const { location } = useGeolocation({ enabled: true });

  const [map, setMap] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [pickupInput, setPickupInput] = useState('');
  const [dropoffInput, setDropoffInput] = useState('');
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [fare, setFare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const pickupAutocompleteRef = useRef(null);
  const dropoffAutocompleteRef = useRef(null);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);

  // Wait for Google Maps to load
  useEffect(() => {
    const checkGoogleLoaded = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleLoaded(true);
        clearInterval(checkGoogleLoaded);
      }
    }, 100);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkGoogleLoaded);
      if (!window.google) {
        console.error('Google Maps failed to load');
      }
    }, 10000);

    return () => {
      clearInterval(checkGoogleLoaded);
      clearTimeout(timeout);
    };
  }, []);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!isGoogleLoaded || !pickupInputRef.current || !dropoffInputRef.current) {
      console.log('Google Maps not ready yet:', { isGoogleLoaded, pickup: !!pickupInputRef.current, dropoff: !!dropoffInputRef.current });
      return;
    }

    console.log('✅ Initializing Google Places Autocomplete...');

    // Pickup autocomplete
    pickupAutocompleteRef.current = new window.google.maps.places.Autocomplete(
      pickupInputRef.current,
      {
        componentRestrictions: { country: 'in' },
        fields: ['address_components', 'geometry', 'name', 'formatted_address'],
      }
    );

    pickupAutocompleteRef.current.addListener('place_changed', () => {
      const place = pickupAutocompleteRef.current.getPlace();
      console.log('Pickup place selected:', place);
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setPickup(location);
        setPickupInput(place.formatted_address || place.name);
        
        // Center map on pickup
        if (map) {
          map.panTo(location);
        }
      }
    });

    // Dropoff autocomplete
    dropoffAutocompleteRef.current = new window.google.maps.places.Autocomplete(
      dropoffInputRef.current,
      {
        componentRestrictions: { country: 'in' },
        fields: ['address_components', 'geometry', 'name', 'formatted_address'],
      }
    );

    dropoffAutocompleteRef.current.addListener('place_changed', () => {
      const place = dropoffAutocompleteRef.current.getPlace();
      console.log('Dropoff place selected:', place);
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setDropoff(location);
        setDropoffInput(place.formatted_address || place.name);
      }
    });

    console.log('✅ Autocomplete initialized successfully');
  }, [isGoogleLoaded, map]);

  // Calculate route when both locations are selected
  useEffect(() => {
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

  // Use current location for pickup
  const handleUseCurrentLocation = () => {
    if (location) {
      setPickup({ lat: location.lat, lng: location.lng });
      
      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: location.lat, lng: location.lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setPickupInput(results[0].formatted_address);
        }
      });

      if (map) {
        map.panTo({ lat: location.lat, lng: location.lng });
      }
    }
  };

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
        pickup_location: pickupInput,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        dropoff_location: dropoffInput,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
        fare: fare,
        distance: distance,
        estimated_duration: duration,
      };

      const response = await rideService.createRide(rideData);

      if (response.success) {
        // Navigate to tracking page
        navigate(`/track/${response.data.ride.id}`);
      } else {
        setError(response.message || 'Failed to create ride');
      }
    } catch (err) {
      console.error('Error creating ride:', err);
      setError(err.message || 'Failed to create ride');
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
            <p>Enter your pickup and drop-off locations</p>
            {!isGoogleLoaded && (
              <div style={{ 
                marginTop: '10px', 
                padding: '8px 12px', 
                background: '#fff3cd', 
                borderRadius: '6px',
                fontSize: '13px',
                color: '#856404'
              }}>
                ⏳ Loading Google Maps...
              </div>
            )}
          </div>

          <div className="search-form">
            {/* Pickup Location */}
            <div className="input-group">
              <label>
                <span className="input-icon pickup-icon">📍</span>
                Pickup Location
              </label>
              <div className="input-wrapper">
                <input
                  ref={pickupInputRef}
                  type="text"
                  className="location-input"
                  placeholder={isGoogleLoaded ? "Enter pickup location..." : "Loading..."}
                  value={pickupInput}
                  onChange={(e) => setPickupInput(e.target.value)}
                  disabled={!isGoogleLoaded}
                />
                {location && (
                  <button 
                    className="current-location-btn"
                    onClick={handleUseCurrentLocation}
                    title="Use current location"
                  >
                    <span>📍</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dropoff Location */}
            <div className="input-group">
              <label>
                <span className="input-icon dropoff-icon">🎯</span>
                Drop-off Location
              </label>
              <input
                ref={dropoffInputRef}
                type="text"
                className="location-input"
                placeholder={isGoogleLoaded ? "Enter drop-off location..." : "Loading..."}
                value={dropoffInput}
                onChange={(e) => setDropoffInput(e.target.value)}
                disabled={!isGoogleLoaded}
              />
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
              <p>💡 Tip: Click on the map to set locations</p>
              <p>🔒 Safe & Secure Payment</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="map-panel">
          <MapContainer>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={location || pickup || DEFAULT_CENTER}
              zoom={13}
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
                  label={{
                    text: 'Pickup',
                    color: '#34A853',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    className: 'marker-label'
                  }}
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
                  label={{
                    text: 'Drop-off',
                    color: '#EA4335',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                />
              )}

              {/* Route Polyline */}
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: true, // We're using custom markers
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

export default BookRide;
