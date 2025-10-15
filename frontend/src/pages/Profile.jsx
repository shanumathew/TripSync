import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/authService'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    university: user?.university || '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await authAPI.updateProfile(formData)
      updateUser(response.data.user)
      setMessage('Profile updated successfully!')
      setEditing(false)
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      university: user?.university || '',
    })
    setEditing(false)
    setMessage('')
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={styles.profileContainer}>
        <h1 style={styles.title}>My Profile</h1>
        
        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <div className="card" style={styles.card}>
          <div style={styles.avatarSection}>
            <div style={styles.avatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={styles.userName}>{user?.name}</h2>
              <p style={styles.userEmail}>{user?.email}</p>
            </div>
          </div>

          <div style={styles.divider}></div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={user?.email}
                disabled
              />
              <span className="form-help">Email cannot be changed</span>
            </div>

            <div className="form-group">
              <label className="form-label">University</label>
              <input
                type="text"
                name="university"
                className="form-input"
                value={formData.university}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Trust Score</span>
                <span style={styles.infoValue}>⭐ {user?.trust_score || '5.0'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Total Rides</span>
                <span style={styles.infoValue}>🚗 {user?.total_rides || 0}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Completed</span>
                <span style={styles.infoValue}>✅ {user?.completed_rides || 0}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Status</span>
                <span style={styles.infoValue}>
                  {user?.is_verified ? '✅ Verified' : '⏳ Pending'}
                </span>
              </div>
            </div>

            <div style={styles.actions}>
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn btn-primary"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? <span className="spinner"></span> : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        <div className="card" style={styles.memberSince}>
          <p style={styles.memberText}>
            📅 Member since {new Date(user?.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  profileContainer: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
    color: '#1e293b',
  },
  card: {
    padding: '2rem',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: '700',
  },
  userName: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.25rem',
  },
  userEmail: {
    fontSize: '1rem',
    color: '#64748b',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e2e8f0',
    margin: '1.5rem 0',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginTop: '1.5rem',
    marginBottom: '1.5rem',
  },
  infoItem: {
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '0.25rem',
  },
  infoValue: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  memberSince: {
    backgroundColor: '#f1f5f9',
    padding: '1rem',
    textAlign: 'center',
  },
  memberText: {
    color: '#64748b',
    fontSize: '0.875rem',
    margin: 0,
  },
}

export default Profile
