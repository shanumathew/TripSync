import { useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';

/**
 * useSocket Hook
 * Manages Socket.io connection and provides real-time event handling
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Auto-connect on mount (default: true)
 * 
 * @returns {Object} Socket state and methods
 */
const useSocket = (options = {}) => {
  const { autoConnect = true } = options;
  const { user, token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const listenersRef = useRef([]);

  /**
   * Connect to Socket.io server
   */
  const connect = useCallback(() => {
    if (!token) {
      console.error('No auth token available');
      setError({ message: 'Not authenticated' });
      return;
    }

    try {
      socketService.connect(token);
      
      // Listen to connection status
      socketService.on('connect', () => {
        setConnected(true);
        setError(null);
      });

      socketService.on('disconnect', () => {
        setConnected(false);
      });

      socketService.on('error', (err) => {
        setError({ message: err.message || 'Socket error' });
      });

      socketService.on('connect_error', (err) => {
        setError({ message: err.message || 'Connection error' });
      });

    } catch (err) {
      setError({ message: err.message });
    }
  }, [token]);

  /**
   * Disconnect from Socket.io server
   */
  const disconnect = useCallback(() => {
    // Remove all listeners
    listenersRef.current.forEach(({ event, callback }) => {
      socketService.off(event, callback);
    });
    listenersRef.current = [];

    socketService.disconnect();
    setConnected(false);
  }, []);

  /**
   * Subscribe to an event
   */
  const on = useCallback((event, callback) => {
    socketService.on(event, callback);
    listenersRef.current.push({ event, callback });
  }, []);

  /**
   * Unsubscribe from an event
   */
  const off = useCallback((event, callback) => {
    socketService.off(event, callback);
    listenersRef.current = listenersRef.current.filter(
      (listener) => !(listener.event === event && listener.callback === callback)
    );
  }, []);

  /**
   * Subscribe once to an event
   */
  const once = useCallback((event, callback) => {
    socketService.once(event, callback);
  }, []);

  /**
   * Emit an event
   */
  const emit = useCallback((event, data) => {
    if (!socketService.isConnected()) {
      console.error('Socket not connected');
      return;
    }
    socketService.socket.emit(event, data);
  }, []);

  /**
   * Join a ride room
   */
  const joinRide = useCallback((rideId) => {
    socketService.joinRide(rideId);
  }, []);

  /**
   * Leave a ride room
   */
  const leaveRide = useCallback((rideId) => {
    socketService.leaveRide(rideId);
  }, []);

  /**
   * Update driver location
   */
  const updateLocation = useCallback((rideId, location) => {
    socketService.updateLocation(rideId, location);
  }, []);

  /**
   * Start ride
   */
  const startRide = useCallback((rideId) => {
    socketService.startRide(rideId);
  }, []);

  /**
   * Complete ride
   */
  const completeRide = useCallback((rideId, finalLocation) => {
    socketService.completeRide(rideId, finalLocation);
  }, []);

  /**
   * Cancel ride
   */
  const cancelRide = useCallback((rideId, reason) => {
    socketService.cancelRide(rideId, reason);
  }, []);

  /**
   * Request tracking data
   */
  const requestTracking = useCallback((rideId) => {
    socketService.requestTracking(rideId);
  }, []);

  /**
   * Update status
   */
  const updateStatus = useCallback((rideId, status) => {
    socketService.updateStatus(rideId, status);
  }, []);

  /**
   * Send message
   */
  const sendMessage = useCallback((rideId, message) => {
    socketService.sendMessage(rideId, message);
  }, []);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    if (autoConnect && token && !connected) {
      connect();
    }

    return () => {
      // Cleanup listeners on unmount
      listenersRef.current.forEach(({ event, callback }) => {
        socketService.off(event, callback);
      });
    };
  }, [autoConnect, token]); // Only depend on autoConnect and token

  return {
    // State
    connected,
    error,
    isConnected: socketService.isConnected(),
    
    // Connection control
    connect,
    disconnect,
    
    // Event handling
    on,
    off,
    once,
    emit,
    
    // Ride actions
    joinRide,
    leaveRide,
    updateLocation,
    startRide,
    completeRide,
    cancelRide,
    requestTracking,
    updateStatus,
    sendMessage
  };
};

export default useSocket;
