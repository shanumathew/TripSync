import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/authService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const response = await authAPI.getMe()
        setUser(response.data.user)
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await authAPI.login({ email, password })
      
      const { user, token } = response.data
      
      // Save to localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Update state
      setUser(user)
      
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await authAPI.register(userData)
      
      const { user, token } = response.data
      
      // Save to localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Update state
      setUser(user)
      
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Clear state
    setUser(null)
    setError(null)
    
    // Call logout API (optional, for logging purposes)
    authAPI.logout().catch(() => {})
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
