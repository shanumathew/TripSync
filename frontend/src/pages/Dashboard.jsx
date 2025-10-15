import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { rideAPI } from '../services/rideService'

const Dashboard = () => {
  const { user } = useAuth()
  
  // Ride posting state
  const [rideText, setRideText] = useState('')
  const [seats, setSeats] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Test parsing as user types (debounced)
  const handleTextChange = (e) => {
    const text = e.target.value
    setRideText(text)
    setMessage('')
    
    // Clear preview if text is empty
    if (!text.trim()) {
      setParsedData(null)
      setShowPreview(false)
    }
  }

  // Preview parsing without creating ride
  const handlePreviewParse = async () => {
    if (!rideText.trim()) {
      setMessage('Please enter ride details')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const result = await rideAPI.testParse(rideText)
      
      if (result.status === 'success') {
        setParsedData(result.data.parsed.data)
        setShowPreview(true)
        
        if (!result.data.validation.isValid) {
          setMessage(result.data.validation.errors.join('. '))
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to parse ride intent')
    } finally {
      setLoading(false)
    }
  }

  // Submit ride
  const handleSubmitRide = async (e) => {
    e.preventDefault()

    if (!rideText.trim()) {
      setMessage('Please enter ride details')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const result = await rideAPI.createRide({
        text: rideText,
        seats: seats
      })

      if (result.status === 'success') {
        setMessage('✅ Ride posted successfully!')
        setParsedData(result.data.parsed)
        setShowPreview(true)
        
        // Clear form after 3 seconds
        setTimeout(() => {
          setRideText('')
          setSeats(1)
          setParsedData(null)
          setShowPreview(false)
          setMessage('')
        }, 3000)
      }
    } catch (error) {
      const errorData = error.response?.data
      if (errorData?.errors) {
        setMessage(errorData.errors.join('. '))
      } else {
        setMessage(errorData?.message || 'Failed to create ride')
      }
      
      // Show suggestions if available
      if (errorData?.suggestions) {
        console.log('Suggestions:', errorData.suggestions)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={styles.welcomeSection}>
        <h1 style={styles.greeting}>
          {getGreeting()}, {user?.name}! 👋
        </h1>
        <p style={styles.university}>
          {user?.university}
        </p>
      </div>

      <div style={styles.grid}>
        <div className="card" style={styles.statsCard}>
          <div style={styles.statIcon}>🚗</div>
          <div style={styles.statNumber}>{user?.total_rides || 0}</div>
          <div style={styles.statLabel}>Total Rides</div>
        </div>

        <div className="card" style={styles.statsCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statNumber}>{user?.completed_rides || 0}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>

        <div className="card" style={styles.statsCard}>
          <div style={styles.statIcon}>⭐</div>
          <div style={styles.statNumber}>{user?.trust_score || '5.0'}</div>
          <div style={styles.statLabel}>Trust Score</div>
        </div>

        <div className="card" style={styles.statsCard}>
          <div style={styles.statIcon}>
            {user?.is_verified ? '✅' : '⏳'}
          </div>
          <div style={styles.statLabel}>
            {user?.is_verified ? 'Verified' : 'Pending Verification'}
          </div>
        </div>
      </div>

      <div className="card" style={styles.mainCard}>
        <h2 style={styles.cardTitle}>📍 Post a New Ride</h2>
        <p style={styles.cardSubtitle}>
          Tell us where you're going in natural language!
        </p>
        
        {message && (
          <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmitRide}>
          <div className="form-group">
            <label className="form-label">Where are you going?</label>
            <textarea
              className="form-input"
              value={rideText}
              onChange={handleTextChange}
              placeholder='Try: "Going to airport tomorrow at 8 AM" or "Need ride to campus Friday 3pm"'
              rows="4"
              style={styles.textarea}
            />
            <span className="form-help">
              Be specific! Include location, time, and date for best results.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Available Seats</label>
            <input
              type="number"
              className="form-input"
              value={seats}
              onChange={(e) => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="8"
              style={{ maxWidth: '150px' }}
            />
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={handlePreviewParse}
              className="btn btn-outline"
              disabled={loading || !rideText.trim()}
            >
              {loading ? <span className="spinner spinner-primary"></span> : '🔍 Preview Parse'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !rideText.trim()}
            >
              {loading ? <span className="spinner"></span> : '🚀 Post Ride'}
            </button>
          </div>
        </form>

        {showPreview && parsedData && (
          <div style={styles.previewCard}>
            <h3 style={styles.previewTitle}>🎯 Parsed Data Preview</h3>
            <div style={styles.previewGrid}>
              <div style={styles.previewItem}>
                <strong>From:</strong> {parsedData.origin || 'Not specified'}
              </div>
              <div style={styles.previewItem}>
                <strong>To:</strong> {parsedData.destination || 'Not specified'}
              </div>
              <div style={styles.previewItem}>
                <strong>Direction:</strong> {parsedData.direction || 'N/A'}
              </div>
              <div style={styles.previewItem}>
                <strong>Time:</strong> {parsedData.humanReadableTime || 'Not specified'}
              </div>
              <div style={styles.previewItem}>
                <strong>Locations Found:</strong> {parsedData.allLocations?.join(', ') || 'None'}
              </div>
              <div style={styles.previewItem}>
                <strong>Confidence:</strong> {parsedData.confidence ? (parsedData.confidence.overall * 100).toFixed(0) + '%' : 'N/A'}
              </div>
            </div>
          </div>
        )}

        <div style={styles.examplesCard}>
          <h4 style={styles.examplesTitle}>💡 Example Inputs:</h4>
          <ul style={styles.examplesList}>
            <li>"Going to airport tomorrow morning at 8 AM"</li>
            <li>"Need ride from downtown to campus Friday 3 PM"</li>
            <li>"Headed to State University today at 5:30pm"</li>
            <li>"Coming from airport Sunday afternoon"</li>
            <li>"Flight at 6am, need ride to airport"</li>
          </ul>
        </div>
      </div>

      <div className="card" style={styles.infoCard}>
        <h3 style={styles.infoTitle}>🎉 Welcome to TripSync!</h3>
        <p style={styles.infoText}>
          Your authentication is working perfectly! You can now:
        </p>
        <ul style={styles.list}>
          <li>✅ View your profile</li>
          <li>✅ Update your information</li>
          <li>✅ Securely logout</li>
          <li>⏳ Post rides (coming with NLP parser)</li>
          <li>⏳ Find ride matches (coming soon)</li>
          <li>⏳ Chat with other students (coming soon)</li>
        </ul>
      </div>
    </div>
  )
}

const styles = {
  welcomeSection: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  greeting: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  university: {
    fontSize: '1.25rem',
    color: '#64748b',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statsCard: {
    textAlign: 'center',
    padding: '2rem 1rem',
  },
  statIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: '0.25rem',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500',
  },
  mainCard: {
    marginBottom: '2rem',
    padding: '2rem',
  },
  cardTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#1e293b',
  },
  cardSubtitle: {
    fontSize: '1rem',
    color: '#64748b',
    marginBottom: '1.5rem',
  },
  textarea: {
    resize: 'vertical',
    minHeight: '100px',
    fontFamily: 'inherit',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  previewCard: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  previewTitle: {
    fontSize: '1.2rem',
    marginBottom: '1rem',
    color: '#333',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  previewItem: {
    padding: '0.75rem',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
  },
  examplesCard: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f0f7ff',
    borderRadius: '8px',
    border: '1px solid #d0e8ff',
  },
  examplesTitle: {
    fontSize: '1.1rem',
    marginBottom: '0.75rem',
    color: '#333',
  },
  examplesList: {
    listStylePosition: 'inside',
    color: '#555',
    lineHeight: '1.8',
    margin: 0,
    paddingLeft: '1rem',
  },
  comingSoon: {
    backgroundColor: '#f1f5f9',
    borderRadius: '0.75rem',
    padding: '3rem 2rem',
    textAlign: 'center',
  },
  comingSoonIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  comingSoonTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '0.5rem',
  },
  comingSoonText: {
    fontSize: '1rem',
    color: '#64748b',
    marginBottom: '1.5rem',
  },
  exampleText: {
    fontSize: '0.875rem',
    color: '#64748b',
    textAlign: 'left',
    maxWidth: '400px',
    margin: '0 auto',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    lineHeight: '1.8',
  },
  infoCard: {
    backgroundColor: '#dbeafe',
    border: '2px solid #93c5fd',
  },
  infoTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: '1rem',
  },
  infoText: {
    fontSize: '1rem',
    color: '#1e40af',
    marginBottom: '1rem',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
}

export default Dashboard
