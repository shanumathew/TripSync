import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapContainer from '../../components/maps/MapContainer';
import RideMap from '../../components/maps/RideMap';
import DriverInfoCard from '../../components/DriverInfoCard';
import ETABanner from '../../components/ETABanner';
import useSocket from '../../hooks/useSocket';
import trackingService from '../../services/trackingService';
import './PassengerTracking.css';

/**
 * PassengerTracking - Real-time ride tracking for passengers
 */
const PassengerTracking = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket({ autoConnect: true });

  const [ride, setRide] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  // Fetch initial tracking data
  const fetchTracking = useCallback(async () => {
    try {
      setLoading(true);
      const response = await trackingService.getTracking(rideId);
      
      if (response.success) {
        setRide(response.data.ride);
        setTracking(response.data.tracking);
        
        // Set initial driver location
        if (response.data.tracking?.driver_location_lat && response.data.tracking?.driver_location_lng) {
          setDriverLocation({
            lat: response.data.tracking.driver_location_lat,
            lng: response.data.tracking.driver_location_lng
          });
        }
      } else {
        setError('Failed to load tracking data');
      }
    } catch (err) {
      console.error('Error fetching tracking:', err);
      setError(err.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  // Join ride room when socket connects
  useEffect(() => {
    if (socket.connected && rideId) {
      socket.joinRide(rideId);
      fetchTracking();
    }

    return () => {
      if (socket.connected && rideId) {
        socket.leaveRide(rideId);
      }
    };
  }, [socket.connected, rideId]);

  // Listen to real-time updates
  useEffect(() => {
    if (!socket.connected) return;

    // Ride joined confirmation
    socket.on('ride:joined', (data) => {
      console.log('Joined ride:', data);
      if (data.ride) setRide(data.ride);
      if (data.tracking) setTracking(data.tracking);
    });

    // Location updates
    socket.on('tracking:location-updated', (data) => {
      console.log('Location updated:', data);
      
      if (data.location) {
        setDriverLocation(data.location);
      }
      
      if (data.tracking) {
        setTracking(prev => ({
          ...prev,
          ...data.tracking
        }));
      }
    });

    // Status changes
    socket.on('ride:status-changed', (data) => {
      console.log('Ride status changed:', data);
      setRide(prev => ({
        ...prev,
        ride_status: data.newStatus
      }));
    });

    socket.on('tracking:status-changed', (data) => {
      console.log('Tracking status changed:', data);
      setTracking(prev => ({
        ...prev,
        tracking_status: data.newStatus
      }));
    });

    // Ride started
    socket.on('ride:started', (data) => {
      console.log('Ride started:', data);
      setRide(prev => ({
        ...prev,
        ride_status: 'in_progress',
        started_at: data.startedAt
      }));
    });

    // Ride completed
    socket.on('ride:completed', (data) => {
      console.log('Ride completed:', data);
      setRide(prev => ({
        ...prev,
        ride_status: 'completed',
        completed_at: data.completedAt
      }));
      
      // Show completion message and redirect
      setTimeout(() => {
        navigate('/my-rides');
      }, 3000);
    });

    // Ride cancelled
    socket.on('ride:cancelled', (data) => {
      console.log('Ride cancelled:', data);
      setRide(prev => ({
        ...prev,
        ride_status: 'cancelled'
      }));
      
      alert(`Ride cancelled by ${data.cancelledBy}: ${data.reason || 'No reason provided'}`);
      
      setTimeout(() => {
        navigate('/my-rides');
      }, 2000);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message || 'Socket connection error');
    });

    // Cleanup listeners
    return () => {
      socket.off('ride:joined');
      socket.off('tracking:location-updated');
      socket.off('ride:status-changed');
      socket.off('tracking:status-changed');
      socket.off('ride:started');
      socket.off('ride:completed');
      socket.off('ride:cancelled');
      socket.off('error');
    };
  }, [socket.connected, navigate]);

  // Cancel ride handler
  const handleCancelRide = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) {
      return;
    }

    const reason = window.prompt('Please provide a reason (optional):');
    
    try {
      socket.cancelRide(rideId, reason || 'Passenger cancelled');
    } catch (err) {
      console.error('Error cancelling ride:', err);
      alert('Failed to cancel ride. Please try again.');
    }
  };

  // Get status text
  const getStatusText = () => {
    if (!ride) return '';
    
    const status = ride.ride_status;
    
    switch (status) {
      case 'driver_assigned':
        return 'Driver assigned';
      case 'driver_arriving':
        return 'Driver on the way to pickup';
      case 'at_pickup':
        return 'Driver has arrived at pickup location';
      case 'in_progress':
        return 'Trip in progress';
      case 'completed':
        return 'Trip completed';
      case 'cancelled':
        return 'Trip cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="passenger-tracking loading-state">
        <div className="spinner"></div>
        <p>Loading tracking information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="passenger-tracking error-state">
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/my-rides')}>Back to My Rides</button>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="passenger-tracking error-state">
        <h2>🔍 Ride Not Found</h2>
        <p>The ride you're looking for doesn't exist or you don't have access to it.</p>
        <button onClick={() => navigate('/my-rides')}>Back to My Rides</button>
      </div>
    );
  }

  const pickupLocation = ride.pickup_lat && ride.pickup_lng
    ? { lat: ride.pickup_lat, lng: ride.pickup_lng }
    : null;

  const dropoffLocation = ride.dropoff_lat && ride.dropoff_lng
    ? { lat: ride.dropoff_lat, lng: ride.dropoff_lng }
    : null;

  const showCancelButton = ['driver_assigned', 'driver_arriving', 'at_pickup'].includes(ride.ride_status);

  return (
    <div className="passenger-tracking">
      <div className="tracking-header">
        <button className="back-btn" onClick={() => navigate('/my-rides')}>
          ← Back
        </button>
        <h1>Track Your Ride</h1>
        <div className="connection-status">
          {socket.connected ? (
            <span className="status-indicator online">🟢 Live</span>
          ) : (
            <span className="status-indicator offline">🔴 Connecting...</span>
          )}
        </div>
      </div>

      <div className="tracking-content">
        <div className="tracking-sidebar">
          {tracking?.eta && tracking?.estimated_distance && (
            <ETABanner
              eta={tracking.eta}
              distance={tracking.estimated_distance}
              status={tracking.tracking_status}
              statusText={getStatusText()}
            />
          )}

          {ride.driver_username && (
            <DriverInfoCard
              driver={{
                username: ride.driver_username,
                rating: ride.driver_rating,
                total_rides: ride.driver_total_rides
              }}
              vehicle={{
                make: ride.vehicle_make,
                model: ride.vehicle_model,
                year: ride.vehicle_year,
                license_plate: ride.vehicle_license_plate,
                color: ride.vehicle_color
              }}
              onCall={() => alert('Call feature coming soon!')}
              onMessage={() => alert('Message feature coming soon!')}
            />
          )}

          {showCancelButton && (
            <button className="cancel-ride-btn" onClick={handleCancelRide}>
              ❌ Cancel Ride
            </button>
          )}

          <div className="ride-details">
            <h3>Trip Details</h3>
            <div className="detail-row">
              <span className="label">From:</span>
              <span className="value">{ride.pickup_address || 'Pickup location'}</span>
            </div>
            <div className="detail-row">
              <span className="label">To:</span>
              <span className="value">{ride.dropoff_address || 'Dropoff location'}</span>
            </div>
            {ride.passenger_count && (
              <div className="detail-row">
                <span className="label">Passengers:</span>
                <span className="value">{ride.passenger_count}</span>
              </div>
            )}
          </div>
        </div>

        <div className="tracking-map-container">
          <MapContainer>
            <RideMap
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              driverLocation={driverLocation}
              driverHeading={tracking?.driver_heading}
              driverName={ride.driver_username}
              route={tracking?.route_polyline}
              showTraffic={true}
              autoFitBounds={true}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default PassengerTracking;
