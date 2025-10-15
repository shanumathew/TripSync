import { useState } from 'react'
import { driverAPI } from '../services/vehicleService'
import { useAuth } from '../context/AuthContext'

function DriverToggle() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleToggle = async () => {
    const newStatus = !user?.is_driver
    
    setLoading(true)
    setMessage('')

    try {
      const response = await driverAPI.toggleDriverMode(newStatus)
      
      // Update user context with new driver status
      if (updateUser && response.data?.user) {
        updateUser(response.data.user)
      }

      setMessage(`✅ ${response.message || 'Driver mode updated successfully!'}`)
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update driver mode'
      setMessage('❌ ' + errorMsg)
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const isDriver = user?.is_driver || false

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h3 style={styles.title}>
            {isDriver ? '🚗 Driver Mode' : '👤 Passenger Mode'}
          </h3>
          <span style={{
            ...styles.statusBadge,
            ...(isDriver ? styles.driverBadge : styles.passengerBadge)
          }}>
            {isDriver ? 'Active Driver' : 'Passenger Only'}
          </span>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div style={styles.content}>
        {isDriver ? (
          <div style={styles.info}>
            <p style={styles.infoText}>
              ✅ You are currently registered as a <strong>driver</strong>. You can post available rides and earn by sharing your journey with fellow students.
            </p>
            <div style={styles.stats}>
              <div style={styles.statItem}>
                <span style={styles.statIcon}>⭐</span>
                <div>
                  <div style={styles.statLabel}>Driver Rating</div>
                  <div style={styles.statValue}>{user?.driver_rating || '5.0'} / 5.0</div>
                </div>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statIcon}>🚗</span>
                <div>
                  <div style={styles.statLabel}>Rides Completed</div>
                  <div style={styles.statValue}>{user?.total_rides_as_driver || 0} rides</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.info}>
            <p style={styles.infoText}>
              You are currently in <strong>passenger mode</strong>. Switch to driver mode to offer rides and earn money by sharing your journey!
            </p>
            <div style={styles.benefits}>
              <h4 style={styles.benefitsTitle}>Benefits of becoming a driver:</h4>
              <ul style={styles.benefitsList}>
                <li>💰 Earn money by sharing rides</li>
                <li>🌍 Reduce carbon footprint</li>
                <li>🤝 Help fellow students commute</li>
                <li>📅 Flexible schedule - drive when you want</li>
              </ul>
            </div>
          </div>
        )}

        <div style={styles.toggleSection}>
          <button
            onClick={handleToggle}
            disabled={loading}
            className="btn"
            style={{
              ...styles.toggleButton,
              ...(isDriver ? styles.disableButton : styles.enableButton)
            }}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : isDriver ? (
              '⏸️ Disable Driver Mode'
            ) : (
              '🚗 Enable Driver Mode'
            )}
          </button>
          
          {!isDriver && (
            <p style={styles.note}>
              <strong>Note:</strong> You need to add at least one vehicle before enabling driver mode.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '2rem',
  },
  header: {
    marginBottom: '1.5rem',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  statusBadge: {
    fontSize: '0.875rem',
    fontWeight: '700',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
  },
  driverBadge: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  passengerBadge: {
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  info: {
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  infoText: {
    fontSize: '1rem',
    color: '#475569',
    lineHeight: '1.6',
    marginBottom: '1rem',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  statIcon: {
    fontSize: '2rem',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '0.25rem',
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  benefits: {
    marginTop: '1rem',
  },
  benefitsTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '0.75rem',
  },
  benefitsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  toggleSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0',
  },
  toggleButton: {
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: '700',
    minWidth: '250px',
    border: 'none',
    color: 'white',
  },
  enableButton: {
    backgroundColor: '#10b981',
  },
  disableButton: {
    backgroundColor: '#64748b',
  },
  note: {
    fontSize: '0.875rem',
    color: '#64748b',
    textAlign: 'center',
    margin: 0,
  },
}

export default DriverToggle
