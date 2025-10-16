import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';
import useGeolocation from '../../hooks/useGeolocation';
import useSocket from '../../hooks/useSocket';
import './DashboardMap.css';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 }; // Delhi

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px'
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  clickableIcons: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

/**
 * DashboardMap - Show nearby available drivers in real-time
 */
const DashboardMap = ({ onDriverSelect, searchRadius = 5 }) => {
  const [map, setMap] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  
  const { location, error, startWatching, stopWatching, watching } = useGeolocation({
    enabled: false,
    updateInterval: 10000, // Update every 10 seconds
    highAccuracy: true
  });
  
  const socket = useSocket({ autoConnect: false });

  // Use user's location as center
  useEffect(() => {
    if (location) {
      setCenter({ lat: location.lat, lng: location.lng });
      setShowLocationPrompt(false);
    }
  }, [location]);

  // Start location tracking
  const handleEnableLocation = () => {
    startWatching();
    // Auto-hide prompt after 3 seconds (whether successful or not)
    setTimeout(() => {
      setShowLocationPrompt(false);
    }, 3000);
  };

  // Mock nearby drivers - Show immediately on component mount
  useEffect(() => {
    // Simulate fetching nearby available drivers
    const mockDrivers = [
      {
        id: 'driver1',
        name: 'Raj Kumar',
        location: { lat: 28.6145, lng: 77.2095 },
        vehicle: 'Honda City',
        rating: 4.8,
        available: true,
        eta: '2 min'
      },
      {
        id: 'driver2',
        name: 'Amit Singh',
        location: { lat: 28.6135, lng: 77.2100 },
        vehicle: 'Maruti Swift',
        rating: 4.5,
        available: true,
        eta: '3 min'
      },
      {
        id: 'driver3',
        name: 'Priya Sharma',
        location: { lat: 28.6150, lng: 77.2085 },
        vehicle: 'Hyundai i20',
        rating: 4.9,
        available: true,
        eta: '4 min'
      },
      {
        id: 'driver4',
        name: 'Vikram Patel',
        location: { lat: 28.6140, lng: 77.2105 },
        vehicle: 'Toyota Innova',
        rating: 4.7,
        available: true,
        eta: '5 min'
      },
      {
        id: 'driver5',
        name: 'Sneha Reddy',
        location: { lat: 28.6130, lng: 77.2080 },
        vehicle: 'Ford EcoSport',
        rating: 4.6,
        available: true,
        eta: '6 min'
      }
    ];

    console.log('🚗 Setting mock drivers:', mockDrivers);
    setNearbyDrivers(mockDrivers);

    // In production: Fetch real drivers from API
    // const fetchNearbyDrivers = async () => {
    //   if (location) {
    //     const response = await api.get('/drivers/nearby', {
    //       params: {
    //         lat: location.lat,
    //         lng: location.lng,
    //         radius: searchRadius
    //       }
    //     });
    //     setNearbyDrivers(response.data.drivers);
    //   }
    // };
    
    // fetchNearbyDrivers();
    // const interval = setInterval(fetchNearbyDrivers, 10000);
    // return () => clearInterval(interval);
  }, []); // Run once on mount, not dependent on location

  const onLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  const handleDriverClick = (driver) => {
    setSelectedDriver(driver);
    if (onDriverSelect) {
      onDriverSelect(driver);
    }
  };

  // Get driver marker icon
  const getDriverIcon = () => {
    return {
      path: 'M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z',
      fillColor: '#34A853',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 0.5,
      anchor: new window.google.maps.Point(11.5, 23.5)
    };
  };

  // Don't block the map if location fails - show mock drivers anyway
  // Users can still enable location later if they want

  return (
    <div className="dashboard-map-container">
      {/* Optional: Show location prompt only if not watching and no error */}
      {showLocationPrompt && !watching && !error && (
        <div className="location-prompt">
          <div className="prompt-content">
            <div className="prompt-icon">📍</div>
            <h3>Enable Location (Optional)</h3>
            <p>Enable location to center the map on your position</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="enable-location-btn" onClick={handleEnableLocation}>
                Enable Location
              </button>
              <button 
                className="skip-location-btn" 
                onClick={() => setShowLocationPrompt(false)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="map-header">
        <div className="map-title">
          <span className="map-icon">🗺️</span>
          <h3>Nearby Drivers</h3>
          {watching && (
            <span className="live-indicator">
              <span className="pulse-dot"></span>
              Live
            </span>
          )}
        </div>
        <div className="map-stats">
          <span className="stat-item">
            <span className="stat-icon">🚗</span>
            {nearbyDrivers.length} available
          </span>
          <span className="stat-item">
            <span className="stat-icon">📍</span>
            {searchRadius} km radius
          </span>
        </div>
      </div>

      <div className="map-wrapper">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={14}
          onLoad={onLoad}
          options={mapOptions}
        >
          {/* User's location marker */}
          {location && (
            <>
              <Marker
                position={{ lat: location.lat, lng: location.lng }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3
                }}
                title="Your Location"
                zIndex={1000}
              />
              
              {/* Search radius circle */}
              <Circle
                center={{ lat: location.lat, lng: location.lng }}
                radius={searchRadius * 1000} // Convert km to meters
                options={{
                  fillColor: '#4285F4',
                  fillOpacity: 0.1,
                  strokeColor: '#4285F4',
                  strokeOpacity: 0.3,
                  strokeWeight: 2
                }}
              />
            </>
          )}

          {/* Nearby driver markers */}
          {nearbyDrivers.length > 0 ? (
            nearbyDrivers.map((driver) => {
              console.log('🚗 Rendering driver:', driver.name, 'at', driver.location);
              return (
                <Marker
                  key={driver.id}
                  position={driver.location}
                  icon={getDriverIcon()}
                  title={driver.name}
                  onClick={() => handleDriverClick(driver)}
                  animation={window.google.maps.Animation.DROP}
                  zIndex={900}
                />
              );
            })
          ) : (
            <div style={{ display: 'none' }}>
              {console.log('⚠️ No nearby drivers to display')}
            </div>
          )}
        </GoogleMap>
      </div>

      {/* Driver info panel */}
      {selectedDriver && (
        <div className="driver-info-panel">
          <button 
            className="close-panel-btn"
            onClick={() => setSelectedDriver(null)}
          >
            ✕
          </button>
          
          <div className="driver-panel-header">
            <div className="driver-avatar">
              {selectedDriver.name.charAt(0)}
            </div>
            <div className="driver-panel-details">
              <h4>{selectedDriver.name}</h4>
              <div className="driver-rating">
                {'⭐'.repeat(Math.floor(selectedDriver.rating))}
                <span className="rating-value">{selectedDriver.rating}</span>
              </div>
            </div>
          </div>

          <div className="driver-panel-info">
            <div className="info-row">
              <span className="info-label">🚗 Vehicle:</span>
              <span className="info-value">{selectedDriver.vehicle}</span>
            </div>
            <div className="info-row">
              <span className="info-label">⏱️ ETA:</span>
              <span className="info-value">{selectedDriver.eta}</span>
            </div>
            <div className="info-row">
              <span className="info-label">📍 Status:</span>
              <span className="info-value available">Available</span>
            </div>
          </div>

          <button className="request-driver-btn">
            Request This Driver
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardMap;
