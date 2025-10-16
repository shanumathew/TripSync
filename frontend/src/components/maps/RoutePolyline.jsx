import React, { useEffect, useState } from 'react';
import { Polyline } from '@react-google-maps/api';

/**
 * RoutePolyline - Display route path on the map
 * Supports both encoded polyline strings and coordinate arrays
 */
const RoutePolyline = ({ 
  encodedPolyline, 
  path, 
  strokeColor = '#4285F4', 
  strokeOpacity = 0.8,
  strokeWeight = 5,
  geodesic = true,
  onClick
}) => {
  const [decodedPath, setDecodedPath] = useState([]);

  // Decode polyline string to coordinates
  useEffect(() => {
    if (!encodedPolyline || typeof window === 'undefined' || !window.google) {
      if (path) {
        setDecodedPath(path);
      }
      return;
    }

    try {
      // Use Google Maps geometry library to decode polyline
      const decoded = window.google.maps.geometry.encoding.decodePath(encodedPolyline);
      const coordinates = decoded.map(point => ({
        lat: point.lat(),
        lng: point.lng()
      }));
      setDecodedPath(coordinates);
    } catch (error) {
      console.error('Error decoding polyline:', error);
      if (path) {
        setDecodedPath(path);
      }
    }
  }, [encodedPolyline, path]);

  if (!decodedPath || decodedPath.length === 0) {
    return null;
  }

  const options = {
    strokeColor,
    strokeOpacity,
    strokeWeight,
    geodesic,
    clickable: !!onClick
  };

  return (
    <Polyline
      path={decodedPath}
      options={options}
      onClick={onClick}
    />
  );
};

export default RoutePolyline;
