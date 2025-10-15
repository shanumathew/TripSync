import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={styles.navbar}>
      <div className="container" style={styles.container}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🚗</span>
          TripSync
        </Link>

        <div style={styles.navLinks}>
          {user ? (
            <>
              <Link to="/dashboard" style={styles.link}>
                Dashboard
              </Link>
              <Link to="/my-rides" style={styles.link}>
                My Rides
              </Link>
              <Link to="/vehicles" style={styles.link}>
                My Vehicles
              </Link>
              <Link to="/profile" style={styles.link}>
                Profile
              </Link>
              <div style={styles.userInfo}>
                <span style={styles.userName}>👋 {user.name}</span>
                <button onClick={handleLogout} className="btn btn-secondary" style={styles.logoutBtn}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" style={styles.authBtn}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={styles.authBtn}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

const styles = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 1000,
    padding: '1rem 0',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#2563eb',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    fontSize: '2rem',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  link: {
    color: '#64748b',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userName: {
    color: '#1e293b',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
  },
  authBtn: {
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
  },
}

export default Navbar
