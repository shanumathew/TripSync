import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import MyRides from './pages/MyRides'
import MyVehicles from './pages/MyVehicles'
import BookRideSimple from './pages/BookRideSimple'
import PassengerTracking from './pages/tracking/PassengerTracking'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main style={{ flex: 1, paddingTop: '80px' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-rides"
                element={
                  <ProtectedRoute>
                    <MyRides />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <ProtectedRoute>
                    <MyVehicles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book-ride"
                element={
                  <ProtectedRoute>
                    <BookRideSimple />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/track/:rideId"
                element={
                  <ProtectedRoute>
                    <PassengerTracking />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
