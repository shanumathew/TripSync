const trackingService = require('../services/tracking.service');
const rideStatusService = require('../services/rideStatus.service');
const notificationService = require('../services/notification.service');

module.exports = (io, socket) => {
  
  /**
   * Join a ride room (for real-time tracking)
   * Emitted by: Passenger or Driver when viewing ride
   */
  socket.on('ride:join', async (data) => {
    try {
      const { rideId } = data;
      const userId = socket.user.user_id;

      // Verify user is part of this ride
      const ride = await rideStatusService.getRideDetails(rideId);
      
      if (!ride) {
        socket.emit('error', { message: 'Ride not found' });
        return;
      }

      if (ride.passenger_id !== userId && ride.driver_id !== userId) {
        socket.emit('error', { message: 'Not authorized to join this ride' });
        return;
      }

      // Join the ride room
      socket.join(`ride_${rideId}`);
      
      console.log(`👥 User ${socket.user.username} joined ride room: ride_${rideId}`);

      // Send current tracking data
      const tracking = await trackingService.getTracking(rideId);
      
      socket.emit('ride:joined', {
        rideId,
        ride,
        tracking
      });

      // Notify others in the room
      socket.to(`ride_${rideId}`).emit('ride:user-joined', {
        userId,
        username: socket.user.username,
        role: ride.driver_id === userId ? 'driver' : 'passenger'
      });

    } catch (error) {
      console.error('Error joining ride:', error);
      socket.emit('error', { message: 'Failed to join ride' });
    }
  });

  /**
   * Leave a ride room
   */
  socket.on('ride:leave', (data) => {
    try {
      const { rideId } = data;
      
      socket.leave(`ride_${rideId}`);
      console.log(`👋 User ${socket.user.username} left ride room: ride_${rideId}`);

      // Notify others in the room
      socket.to(`ride_${rideId}`).emit('ride:user-left', {
        userId: socket.user.user_id,
        username: socket.user.username
      });

    } catch (error) {
      console.error('Error leaving ride:', error);
    }
  });

  /**
   * Driver: Update location in real-time
   * Emitted by: Driver app every 3-5 seconds
   */
  socket.on('driver:location-update', async (data) => {
    try {
      const { rideId, latitude, longitude, heading, speed } = data;
      const driverId = socket.user.user_id;

      if (!socket.user.is_driver) {
        socket.emit('error', { message: 'Only drivers can update location' });
        return;
      }

      // Verify driver is assigned to this ride
      const ride = await rideStatusService.getRideDetails(rideId);
      
      if (!ride) {
        socket.emit('error', { message: 'Ride not found' });
        return;
      }

      if (ride.driver_id !== driverId) {
        socket.emit('error', { message: 'You are not the driver for this ride' });
        return;
      }

      // Update location in database
      const location = {
        latitude,
        longitude,
        heading: heading || null,
        speed: speed || null,
        timestamp: new Date()
      };

      const result = await trackingService.updateLocation(rideId, location);

      // Broadcast to ride room (passenger and any other listeners)
      io.to(`ride_${rideId}`).emit('tracking:location-updated', {
        rideId,
        location: {
          lat: latitude,
          lng: longitude,
          heading,
          speed
        },
        tracking: result,
        timestamp: new Date().toISOString()
      });

      // Check for proximity notifications
      if (ride.ride_status !== 'in_progress') {
        await notificationService.checkProximityNotifications(
          rideId,
          { lat: latitude, lng: longitude },
          { lat: ride.pickup_lat, lng: ride.pickup_lng },
          ride.passenger_id
        );
      }

      // If status changed due to proximity, broadcast it
      if (result.tracking_status !== ride.tracking_status) {
        io.to(`ride_${rideId}`).emit('tracking:status-changed', {
          rideId,
          oldStatus: ride.tracking_status,
          newStatus: result.tracking_status,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error updating driver location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  /**
   * Driver: Start ride
   */
  socket.on('driver:start-ride', async (data) => {
    try {
      const { rideId } = data;
      const driverId = socket.user.user_id;

      if (!socket.user.is_driver) {
        socket.emit('error', { message: 'Only drivers can start rides' });
        return;
      }

      // Start the ride
      const result = await rideStatusService.startRide(rideId, driverId);

      // Get ride details for notification
      const ride = await rideStatusService.getRideDetails(rideId);

      // Notify passenger
      await notificationService.notifyRideStarted(rideId, ride.passenger_id);

      // Broadcast to ride room
      io.to(`ride_${rideId}`).emit('ride:started', {
        rideId,
        startedAt: result.started_at,
        status: 'in_progress',
        timestamp: new Date().toISOString()
      });

      socket.emit('driver:ride-started', {
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error starting ride:', error);
      socket.emit('error', { message: error.message || 'Failed to start ride' });
    }
  });

  /**
   * Driver: Complete ride
   */
  socket.on('driver:complete-ride', async (data) => {
    try {
      const { rideId, finalLocation } = data;
      const driverId = socket.user.user_id;

      if (!socket.user.is_driver) {
        socket.emit('error', { message: 'Only drivers can complete rides' });
        return;
      }

      // Complete the ride
      const completionData = {
        final_location: finalLocation,
        completed_at: new Date()
      };

      const result = await rideStatusService.completeRide(rideId, driverId, completionData);

      // Get ride details for notification
      const ride = await rideStatusService.getRideDetails(rideId);

      // Notify passenger
      await notificationService.notifyRideCompleted(rideId, ride.passenger_id, result);

      // Broadcast to ride room
      io.to(`ride_${rideId}`).emit('ride:completed', {
        rideId,
        completedAt: result.completed_at,
        duration: result.actual_duration,
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      socket.emit('driver:ride-completed', {
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error completing ride:', error);
      socket.emit('error', { message: error.message || 'Failed to complete ride' });
    }
  });

  /**
   * Cancel ride (passenger or driver)
   */
  socket.on('ride:cancel', async (data) => {
    try {
      const { rideId, reason } = data;
      const userId = socket.user.user_id;

      // Get ride details
      const ride = await rideStatusService.getRideDetails(rideId);
      
      if (!ride) {
        socket.emit('error', { message: 'Ride not found' });
        return;
      }

      // Check authorization
      if (ride.passenger_id !== userId && ride.driver_id !== userId) {
        socket.emit('error', { message: 'Not authorized to cancel this ride' });
        return;
      }

      // Determine who cancelled
      const cancelledBy = ride.passenger_id === userId ? 'passenger' : 'driver';

      // Cancel the ride
      const result = await rideStatusService.cancelRide(rideId, userId, reason || 'No reason provided');

      // Notify the other party
      const notifyUserId = cancelledBy === 'passenger' ? ride.driver_id : ride.passenger_id;
      if (notifyUserId) {
        await notificationService.notifyRideCancelled(rideId, notifyUserId, cancelledBy, reason);
      }

      // Broadcast to ride room
      io.to(`ride_${rideId}`).emit('ride:cancelled', {
        rideId,
        cancelledBy,
        reason,
        timestamp: new Date().toISOString()
      });

      socket.emit('ride:cancel-success', {
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error cancelling ride:', error);
      socket.emit('error', { message: error.message || 'Failed to cancel ride' });
    }
  });

  /**
   * Request current tracking data
   */
  socket.on('tracking:request', async (data) => {
    try {
      const { rideId } = data;
      const userId = socket.user.user_id;

      // Verify user is part of this ride
      const ride = await rideStatusService.getRideDetails(rideId);
      
      if (!ride) {
        socket.emit('error', { message: 'Ride not found' });
        return;
      }

      if (ride.passenger_id !== userId && ride.driver_id !== userId) {
        socket.emit('error', { message: 'Not authorized to view this ride' });
        return;
      }

      // Get tracking data
      const tracking = await trackingService.getTracking(rideId);

      socket.emit('tracking:data', {
        rideId,
        ride,
        tracking,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching tracking:', error);
      socket.emit('error', { message: 'Failed to fetch tracking data' });
    }
  });

  /**
   * Passenger: Send message to driver
   */
  socket.on('message:send', async (data) => {
    try {
      const { rideId, message } = data;
      const userId = socket.user.user_id;

      // Verify user is part of this ride
      const ride = await rideStatusService.getRideDetails(rideId);
      
      if (!ride) {
        socket.emit('error', { message: 'Ride not found' });
        return;
      }

      if (ride.passenger_id !== userId && ride.driver_id !== userId) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      // Broadcast message to ride room
      io.to(`ride_${rideId}`).emit('message:received', {
        rideId,
        from: {
          userId,
          username: socket.user.username,
          role: ride.driver_id === userId ? 'driver' : 'passenger'
        },
        message,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  /**
   * Driver: Update status manually
   */
  socket.on('driver:update-status', async (data) => {
    try {
      const { rideId, status } = data;
      const driverId = socket.user.user_id;

      if (!socket.user.is_driver) {
        socket.emit('error', { message: 'Only drivers can update status' });
        return;
      }

      // Update status
      const result = await rideStatusService.updateRideStatus(rideId, status, driverId);

      // Broadcast to ride room
      io.to(`ride_${rideId}`).emit('ride:status-changed', {
        rideId,
        newStatus: status,
        timestamp: new Date().toISOString()
      });

      socket.emit('driver:status-updated', {
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error updating status:', error);
      socket.emit('error', { message: error.message || 'Failed to update status' });
    }
  });

};
