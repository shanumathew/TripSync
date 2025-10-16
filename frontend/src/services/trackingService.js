import api from './api';

/**
 * Tracking Service - REST API calls for tracking
 */

/**
 * Get tracking data for a ride
 */
export const getTracking = async (rideId) => {
  const response = await api.get(`/tracking/rides/${rideId}`);
  return response.data;
};

/**
 * Get route information for a ride
 */
export const getRoute = async (rideId) => {
  const response = await api.get(`/tracking/rides/${rideId}/route`);
  return response.data;
};

/**
 * Get location history for a ride
 */
export const getLocationHistory = async (rideId, limit = 1000) => {
  const response = await api.get(`/tracking/rides/${rideId}/history`, {
    params: { limit }
  });
  return response.data;
};

/**
 * Update driver location (fallback for non-Socket.io)
 */
export const updateLocation = async (rideId, location) => {
  const response = await api.post(`/tracking/rides/${rideId}/location`, {
    latitude: location.lat,
    longitude: location.lng,
    heading: location.heading || null,
    speed: location.speed || null
  });
  return response.data;
};

/**
 * Driver: Start a ride
 */
export const startRide = async (rideId) => {
  const response = await api.post(`/tracking/rides/${rideId}/start`);
  return response.data;
};

/**
 * Driver: Complete a ride
 */
export const completeRide = async (rideId, finalLocation) => {
  const response = await api.post(`/tracking/rides/${rideId}/complete`, {
    final_location: finalLocation
  });
  return response.data;
};

/**
 * Cancel a ride (passenger or driver)
 */
export const cancelRide = async (rideId, reason) => {
  const response = await api.post(`/tracking/rides/${rideId}/cancel`, {
    reason
  });
  return response.data;
};

/**
 * Get user notifications
 */
export const getNotifications = async (unreadOnly = false, limit = 50) => {
  const response = await api.get('/tracking/notifications', {
    params: {
      unread_only: unreadOnly,
      limit
    }
  });
  return response.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
  const response = await api.get('/tracking/notifications/unread-count');
  return response.data;
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/tracking/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async () => {
  const response = await api.put('/tracking/notifications/read-all');
  return response.data;
};

const trackingService = {
  getTracking,
  getRoute,
  getLocationHistory,
  updateLocation,
  startRide,
  completeRide,
  cancelRide,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead
};

export default trackingService;
