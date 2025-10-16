import React from 'react';
import './DriverInfoCard.css';

/**
 * DriverInfoCard - Display driver information
 */
const DriverInfoCard = ({ driver, vehicle, onCall, onMessage }) => {
  if (!driver) {
    return (
      <div className="driver-info-card loading">
        <p>Loading driver information...</p>
      </div>
    );
  }

  const rating = driver.rating || driver.average_rating || 0;
  const totalRides = driver.total_rides || driver.total_rides_as_driver || 0;

  return (
    <div className="driver-info-card">
      <div className="driver-header">
        <div className="driver-avatar">
          {driver.profile_image ? (
            <img src={driver.profile_image} alt={driver.username} />
          ) : (
            <div className="avatar-placeholder">
              {driver.username?.charAt(0).toUpperCase() || 'D'}
            </div>
          )}
        </div>
        
        <div className="driver-details">
          <h3 className="driver-name">{driver.username || 'Driver'}</h3>
          
          <div className="driver-rating">
            <span className="stars">
              {'⭐'.repeat(Math.floor(rating))}
              {rating % 1 >= 0.5 && '✨'}
            </span>
            <span className="rating-text">
              {rating.toFixed(1)} ({totalRides} rides)
            </span>
          </div>
        </div>
      </div>

      {vehicle && (
        <div className="vehicle-info">
          <div className="vehicle-icon">🚗</div>
          <div className="vehicle-details">
            <p className="vehicle-model">
              {vehicle.make} {vehicle.model} {vehicle.year}
            </p>
            <p className="vehicle-plate">{vehicle.license_plate}</p>
            {vehicle.color && (
              <p className="vehicle-color">Color: {vehicle.color}</p>
            )}
          </div>
        </div>
      )}

      <div className="driver-actions">
        {onCall && (
          <button className="action-btn call-btn" onClick={onCall}>
            📞 Call
          </button>
        )}
        {onMessage && (
          <button className="action-btn message-btn" onClick={onMessage}>
            💬 Message
          </button>
        )}
      </div>
    </div>
  );
};

export default DriverInfoCard;
