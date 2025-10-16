import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.io server with JWT token
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    console.log('🔌 Connecting to Socket.io server...');

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected');
      this.connected = true;
    });

    this.socket.on('connected', (data) => {
      console.log('🎉 Connection confirmed:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket.io error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
    });

    return this.socket;
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect() {
    if (this.socket) {
      console.log('👋 Disconnecting from Socket.io...');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Join a ride room
   */
  joinRide(rideId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    console.log(`👥 Joining ride room: ${rideId}`);
    this.socket.emit('ride:join', { rideId });
  }

  /**
   * Leave a ride room
   */
  leaveRide(rideId) {
    if (!this.socket) return;

    console.log(`👋 Leaving ride room: ${rideId}`);
    this.socket.emit('ride:leave', { rideId });
  }

  /**
   * Driver: Update location in real-time
   */
  updateLocation(rideId, location) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('driver:location-update', {
      rideId,
      latitude: location.lat,
      longitude: location.lng,
      heading: location.heading || null,
      speed: location.speed || null
    });
  }

  /**
   * Driver: Start ride
   */
  startRide(rideId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    console.log(`🚗 Starting ride: ${rideId}`);
    this.socket.emit('driver:start-ride', { rideId });
  }

  /**
   * Driver: Complete ride
   */
  completeRide(rideId, finalLocation) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    console.log(`🏁 Completing ride: ${rideId}`);
    this.socket.emit('driver:complete-ride', { rideId, finalLocation });
  }

  /**
   * Cancel ride (passenger or driver)
   */
  cancelRide(rideId, reason) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    console.log(`❌ Cancelling ride: ${rideId}`);
    this.socket.emit('ride:cancel', { rideId, reason });
  }

  /**
   * Request current tracking data
   */
  requestTracking(rideId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('tracking:request', { rideId });
  }

  /**
   * Driver: Update status manually
   */
  updateStatus(rideId, status) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('driver:update-status', { rideId, status });
  }

  /**
   * Send message in ride
   */
  sendMessage(rideId, message) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('message:send', { rideId, message });
  }

  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    this.socket.on(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    // Remove from listeners map
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Subscribe once to an event
   */
  once(event, callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.once(event, callback);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event) {
    if (!this.socket) return;

    this.socket.removeAllListeners(event);
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
