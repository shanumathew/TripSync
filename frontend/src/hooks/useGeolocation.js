import { useState, useEffect, useCallback } from 'react';

/**
 * useGeolocation Hook
 * Tracks device GPS location with continuous updates
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to start tracking immediately
 * @param {number} options.updateInterval - Update interval in milliseconds (default: 5000)
 * @param {boolean} options.highAccuracy - Use high accuracy GPS (default: true)
 * @param {number} options.timeout - Position request timeout in ms (default: 10000)
 * @param {number} options.maximumAge - Maximum cached position age in ms (default: 0)
 * 
 * @returns {Object} Geolocation state and controls
 */
const useGeolocation = (options = {}) => {
  const {
    enabled = false,
    updateInterval = 5000, // 5 seconds default
    highAccuracy = true,
    timeout = 10000,
    maximumAge = 0
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [watchId, setWatchId] = useState(null);

  /**
   * Get current position once
   */
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ message: 'Geolocation is not supported by your browser' });
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed, // m/s
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        setLocation(locationData);
        setLoading(false);
        console.log('📍 Got current position:', locationData);
      },
      (err) => {
        setError({
          message: err.message,
          code: err.code
        });
        setLoading(false);
        console.error('❌ Geolocation error:', err);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge
      }
    );
  }, [highAccuracy, timeout, maximumAge]);

  /**
   * Start watching position (continuous updates)
   */
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ message: 'Geolocation is not supported by your browser' });
      return;
    }

    if (watching) {
      console.log('Already watching position');
      return;
    }

    console.log('🎯 Starting GPS tracking...');
    setError(null);
    setWatching(true);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed, // m/s
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        setLocation(locationData);
        console.log('📍 Location updated:', locationData);
      },
      (err) => {
        setError({
          message: err.message,
          code: err.code
        });
        console.error('❌ Geolocation error:', err);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge
      }
    );

    setWatchId(id);
  }, [watching, highAccuracy, timeout, maximumAge]);

  /**
   * Stop watching position
   */
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      console.log('🛑 Stopping GPS tracking...');
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setWatching(false);
    }
  }, [watchId]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Auto-start if enabled
   */
  useEffect(() => {
    if (enabled && !watching) {
      startWatching();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enabled]); // Only depend on enabled, not startWatching

  /**
   * Interval-based updates (additional polling)
   */
  useEffect(() => {
    if (!watching || !updateInterval) return;

    const intervalId = setInterval(() => {
      getCurrentPosition();
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [watching, updateInterval, getCurrentPosition]);

  return {
    // State
    location,
    error,
    loading,
    watching,
    
    // Actions
    getCurrentPosition,
    startWatching,
    stopWatching,
    clearError,
    
    // Computed
    isAvailable: !!navigator.geolocation,
    hasLocation: location !== null
  };
};

export default useGeolocation;
