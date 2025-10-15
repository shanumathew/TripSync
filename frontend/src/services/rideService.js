import api from './api'

// Ride API functions
export const rideAPI = {
  // Test NLP parsing without creating ride
  testParse: async (text) => {
    const response = await api.post('/rides/parse-test', { text })
    return response.data
  },

  // Create ride with NLP parsing
  createRide: async (rideData) => {
    const response = await api.post('/rides', rideData)
    return response.data
  },

  // Get all rides
  getAllRides: async (params = {}) => {
    const response = await api.get('/rides', { params })
    return response.data
  },

  // Get current user's rides
  getMyRides: async () => {
    const response = await api.get('/rides/my-rides')
    return response.data
  },

  // Get ride by ID
  getRideById: async (id) => {
    const response = await api.get(`/rides/${id}`)
    return response.data
  },

  // Update ride
  updateRide: async (id, updates) => {
    const response = await api.put(`/rides/${id}`, updates)
    return response.data
  },

  // Delete (cancel) ride
  deleteRide: async (id) => {
    const response = await api.delete(`/rides/${id}`)
    return response.data
  },

  // Search rides
  searchRides: async (filters) => {
    const response = await api.post('/rides/search', filters)
    return response.data
  },
}

export default rideAPI
