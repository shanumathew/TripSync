import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const Home = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  return (
    <div className="container" style={{ paddingTop: '3rem' }}>
      <div style={styles.hero}>
        <h1 style={styles.title}>
          Welcome to <span style={styles.highlight}>TripSync</span> 🚗
        </h1>
        <p style={styles.subtitle}>
          The smart ride-sharing platform for university students
        </p>
        <p style={styles.description}>
          Share rides, save money, and make friends. Connect with fellow students
          going your way with our intelligent matching system.
        </p>
        
        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>🎯</div>
            <h3>Smart Matching</h3>
            <p>AI-powered algorithm finds the perfect ride matches</p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>🔒</div>
            <h3>Safe & Secure</h3>
            <p>University-verified users and trust scoring system</p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>💬</div>
            <h3>Easy Communication</h3>
            <p>Chat directly with your ride matches</p>
          </div>
        </div>

        <div style={styles.cta}>
          <Link to="/register" className="btn btn-primary" style={styles.ctaBtn}>
            Get Started
          </Link>
          <Link to="/login" className="btn btn-outline" style={styles.ctaBtn}>
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  hero: {
    textAlign: 'center',
    maxWidth: '900px',
    margin: '0 auto',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '800',
    marginBottom: '1rem',
    color: '#1e293b',
  },
  highlight: {
    color: '#2563eb',
  },
  subtitle: {
    fontSize: '1.5rem',
    color: '#64748b',
    marginBottom: '1rem',
  },
  description: {
    fontSize: '1.125rem',
    color: '#64748b',
    marginBottom: '3rem',
    lineHeight: '1.8',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem',
  },
  feature: {
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '1rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  featureIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  cta: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '2rem',
  },
  ctaBtn: {
    fontSize: '1.125rem',
    padding: '0.875rem 2rem',
  },
}

export default Home
