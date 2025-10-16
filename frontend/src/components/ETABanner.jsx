import React, { useEffect, useState } from 'react';
import './ETABanner.css';

/**
 * ETABanner - Display estimated arrival time
 */
const ETABanner = ({ eta, distance, status, statusText }) => {
  const [formattedETA, setFormattedETA] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  // Format ETA and calculate time remaining
  useEffect(() => {
    if (!eta) {
      setFormattedETA('');
      setTimeRemaining('');
      return;
    }

    const updateTime = () => {
      const etaDate = new Date(eta);
      const now = new Date();
      const diff = etaDate - now;

      if (diff <= 0) {
        setTimeRemaining('Arrived');
        setFormattedETA(etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        setTimeRemaining(`${hours}h ${mins}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes} min`);
      } else {
        setTimeRemaining(`${seconds} sec`);
      }

      setFormattedETA(etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [eta]);

  // Format distance
  const formatDistance = (dist) => {
    if (!dist) return '';
    
    const km = parseFloat(dist);
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  // Get status color
  const getStatusClass = () => {
    if (!status) return 'default';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('arrived') || statusLower.includes('at_pickup')) {
      return 'arrived';
    }
    if (statusLower.includes('nearby') || statusLower.includes('close')) {
      return 'nearby';
    }
    if (statusLower.includes('progress') || statusLower.includes('en_route')) {
      return 'in-progress';
    }
    return 'default';
  };

  return (
    <div className={`eta-banner ${getStatusClass()}`}>
      <div className="eta-content">
        {timeRemaining && (
          <div className="eta-time">
            <div className="eta-value">{timeRemaining}</div>
            <div className="eta-label">
              {timeRemaining === 'Arrived' ? 'Driver Arrived' : 'ETA'}
            </div>
          </div>
        )}

        {distance && (
          <div className="eta-distance">
            <div className="distance-value">{formatDistance(distance)}</div>
            <div className="distance-label">Away</div>
          </div>
        )}

        {formattedETA && timeRemaining !== 'Arrived' && (
          <div className="eta-clock">
            <span className="clock-icon">🕐</span>
            <span className="clock-time">{formattedETA}</span>
          </div>
        )}
      </div>

      {statusText && (
        <div className="eta-status">
          <span className="status-dot"></span>
          {statusText}
        </div>
      )}
    </div>
  );
};

export default ETABanner;
