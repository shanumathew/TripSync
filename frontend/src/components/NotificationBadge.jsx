import React, { useEffect, useState } from 'react';
import trackingService from '../services/trackingService';
import './NotificationBadge.css';

/**
 * NotificationBadge - Display unread notification count
 */
const NotificationBadge = ({ onClick }) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      setLoading(true);
      const response = await trackingService.getUnreadCount();
      if (response.success && response.data) {
        setCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Expose refresh method
  useEffect(() => {
    window.refreshNotificationBadge = fetchUnreadCount;
  }, []);

  if (count === 0) {
    return (
      <button className="notification-badge-btn" onClick={onClick}>
        🔔
      </button>
    );
  }

  return (
    <button className="notification-badge-btn" onClick={onClick}>
      🔔
      <span className="badge-count">{count > 99 ? '99+' : count}</span>
    </button>
  );
};

export default NotificationBadge;
