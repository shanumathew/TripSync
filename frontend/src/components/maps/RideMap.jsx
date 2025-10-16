import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import DriverMarker from './DriverMarker';
import RoutePolyline from './RoutePolyline';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 }; // Delhi, India
const DEFAULT_ZOOM = 13;

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
  borderRadius: '8px'
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

/**
 * RideMap - Main map component with markers and route
 */
const RideMap = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  pickupLocation,
  dropoffLocation,
  driverLocation,
  driverHeading,
  driverName,
  route,
  onMapClick,
  showTraffic = false,
  autoFitBounds = true
}) => {
  const [map, setMap] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [trafficLayer, setTrafficLayer] = useState(null);

  // Map load callback
  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    
    // Initialize traffic layer
    if (window.google) {
      const traffic = new window.google.maps.TrafficLayer();
      setTrafficLayer(traffic);
    }
  }, []);

  // Map unmount callback
  const onUnmount = useCallback(() => {
    setMap(null);
    setTrafficLayer(null);
  }, []);

  // Auto-fit map bounds to show all markers
  useEffect(() => {
    if (!map || !autoFitBounds) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    if (pickupLocation) {
      bounds.extend(pickupLocation);
      hasPoints = true;
    }

    if (dropoffLocation) {
      bounds.extend(dropoffLocation);
      hasPoints = true;
    }

    if (driverLocation) {
      bounds.extend(driverLocation);
      hasPoints = true;
    }

    if (hasPoints) {
      map.fitBounds(bounds);
      
      // Add padding
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      map.fitBounds(bounds, padding);
    }
  }, [map, pickupLocation, dropoffLocation, driverLocation, autoFitBounds]);

  // Toggle traffic layer
  useEffect(() => {
    if (!trafficLayer || !map) return;

    if (showTraffic) {
      trafficLayer.setMap(map);
    } else {
      trafficLayer.setMap(null);
    }
  }, [trafficLayer, map, showTraffic]);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={onMapClick}
      options={mapOptions}
    >
      {/* Pickup Location Marker */}
      {pickupLocation && (
        <>
          <Marker
            position={pickupLocation}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
                  <path fill="#34A853" d="M16 0C7.2 0 0 7.2 0 16c0 11.8 16 26 16 26s16-14.2 16-26C32 7.2 24.8 0 16 0z"/>
                  <circle fill="#FFFFFF" cx="16" cy="16" r="8"/>
                  <text x="16" y="20" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="#34A853">P</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 42),
              anchor: new window.google.maps.Point(16, 42)
            }}
            title="Pickup Location"
            onClick={() => setSelectedMarker('pickup')}
            zIndex={900}
          />
          
          {selectedMarker === 'pickup' && (
            <InfoWindow
              position={pickupLocation}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div style={{ padding: '8px' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#34A853' }}>📍 Pickup</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  {pickupLocation.lat.toFixed(6)}, {pickupLocation.lng.toFixed(6)}
                </p>
              </div>
            </InfoWindow>
          )}
        </>
      )}

      {/* Dropoff Location Marker */}
      {dropoffLocation && (
        <>
          <Marker
            position={dropoffLocation}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
                  <path fill="#EA4335" d="M16 0C7.2 0 0 7.2 0 16c0 11.8 16 26 16 26s16-14.2 16-26C32 7.2 24.8 0 16 0z"/>
                  <circle fill="#FFFFFF" cx="16" cy="16" r="8"/>
                  <text x="16" y="20" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="#EA4335">D</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 42),
              anchor: new window.google.maps.Point(16, 42)
            }}
            title="Dropoff Location"
            onClick={() => setSelectedMarker('dropoff')}
            zIndex={900}
          />
          
          {selectedMarker === 'dropoff' && (
            <InfoWindow
              position={dropoffLocation}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div style={{ padding: '8px' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#EA4335' }}>🎯 Dropoff</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  {dropoffLocation.lat.toFixed(6)}, {dropoffLocation.lng.toFixed(6)}
                </p>
              </div>
            </InfoWindow>
          )}
        </>
      )}

      {/* Driver Location Marker */}
      {driverLocation && (
        <>
          <DriverMarker
            position={driverLocation}
            heading={driverHeading}
            driverName={driverName}
            onClick={() => setSelectedMarker('driver')}
          />
          
          {selectedMarker === 'driver' && (
            <InfoWindow
              position={driverLocation}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div style={{ padding: '8px' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#4285F4' }}>🚗 {driverName || 'Driver'}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  Current Location
                </p>
                {driverHeading !== null && driverHeading !== undefined && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>
                    Heading: {driverHeading}°
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </>
      )}

      {/* Route Polyline */}
      {route && (
        <RoutePolyline
          encodedPolyline={typeof route === 'string' ? route : null}
          path={Array.isArray(route) ? route : null}
          strokeColor="#4285F4"
          strokeWeight={5}
          strokeOpacity={0.8}
        />
      )}
    </GoogleMap>
  );
};

export default RideMap;
