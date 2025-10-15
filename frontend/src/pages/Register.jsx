import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    phone: '',
    password: '',
    confirmPassword: '',
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
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    } else if (!formData.email.endsWith('.edu')) {
      newErrors.email = 'Must be a university email (.edu)'
    }
    
    if (!formData.university.trim()) {
      newErrors.university = 'University is required'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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
    
    const { confirmPassword, ...userData } = formData
    
    const result = await register(userData)
    
    setLoading(false)
    
    if (result.success) {
      setMessage('Registration successful! Redirecting...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } else {
      setMessage(result.error)
    }
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={styles.formContainer}>
        <div className="card" style={styles.card}>
          <h1 style={styles.title}>Create Your Account</h1>
          <p style={styles.subtitle}>Join TripSync and start sharing rides!</p>
          
          {message && (
            <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">University Email *</label>
              <input
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@university.edu"
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
              <span className="form-help">Must be a valid university email ending in .edu</span>
            </div>

            <div className="form-group">
              <label className="form-label">University *</label>
              <input
                type="text"
                name="university"
                className={`form-input ${errors.university ? 'error' : ''}`}
                value={formData.university}
                onChange={handleChange}
                placeholder="State University"
              />
              {errors.university && <span className="form-error">{errors.university}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="1234567890"
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
              <span className="form-help">At least 6 characters with uppercase, lowercase, and number</span>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? <span className="spinner"></span> : 'Create Account'}
            </button>
          </form>

          <p style={styles.footer}>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  formContainer: {
    maxWidth: '500px',
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

export default Register
