import api from './api'

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Get current user profile
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/update-profile', profileData)
    return response.data
  },

  // Update password
  updatePassword: async (passwordData) => {
    const response = await api.put('/auth/update-password', passwordData)
    return response.data
  },

  // Deactivate account
  deactivateAccount: async () => {
    const response = await api.put('/auth/deactivate')
    return response.data
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },
}

export default authAPI
