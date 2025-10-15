import api from './api'

// Vehicle API functions
export const vehicleAPI = {
  // Add a new vehicle
  addVehicle: async (vehicleData) => {
    const response = await api.post('/vehicles', vehicleData)
    return response.data
  },

  // Get current user's vehicles
  getMyVehicles: async () => {
    const response = await api.get('/vehicles/my-vehicles')
    return response.data
  },

  // Get single vehicle by ID
  getVehicle: async (vehicleId) => {
    const response = await api.get(`/vehicles/${vehicleId}`)
    return response.data
  },

  // Update vehicle
  updateVehicle: async (vehicleId, updates) => {
    const response = await api.put(`/vehicles/${vehicleId}`, updates)
    return response.data
  },

  // Delete vehicle
  deleteVehicle: async (vehicleId) => {
    const response = await api.delete(`/vehicles/${vehicleId}`)
    return response.data
  },
}

// Driver API functions
export const driverAPI = {
  // Toggle driver mode
  toggleDriverMode: async (isDriver) => {
    const response = await api.put('/users/toggle-driver', { is_driver: isDriver })
    return response.data
  },

  // Get public driver profile
  getPublicProfile: async (userId) => {
    const response = await api.get(`/users/${userId}/public-profile`)
    return response.data
  },
}

export default { ...vehicleAPI, ...driverAPI }
