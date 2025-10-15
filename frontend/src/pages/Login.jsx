import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setMessage('')
    
    const result = await login(formData.email, formData.password)
    
    setLoading(false)
    
    if (result.success) {
      setMessage('Login successful! Redirecting...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } else {
      setMessage(result.error)
    }
  }

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '2rem' }}>
      <div style={styles.formContainer}>
        <div className="card" style={styles.card}>
          <h1 style={styles.title}>Welcome Back!</h1>
          <p style={styles.subtitle}>Login to your TripSync account</p>
          
          {message && (
            <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@university.edu"
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? <span className="spinner"></span> : 'Login'}
            </button>
          </form>

          <p style={styles.footer}>
            Don't have an account?{' '}
            <Link to="/register" style={styles.link}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  formContainer: {
    maxWidth: '450px',
    margin: '0 auto',
  },
  card: {
    padding: '2.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    textAlign: 'center',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
    marginBottom: '2rem',
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    color: '#64748b',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
  },
}

export default Login
