import { useState, useEffect } from 'react'
import rideAPI from '../services/rideService'

function MyRides() {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all') // all, active, completed, cancelled

  useEffect(() => {
    fetchMyRides()
  }, [])

  const fetchMyRides = async () => {
    try {
      setLoading(true)
      const response = await rideAPI.getMyRides()
      console.log('My Rides Response:', response) // Debug log
      setRides(response.data?.rides || [])
    } catch (error) {
      setMessage('Failed to load your rides')
      console.error('Error fetching rides:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (rideId) => {
    if (!window.confirm('Are you sure you want to delete this ride?')) {
      return
    }

    try {
      await rideAPI.deleteRide(rideId)
      setMessage('✅ Ride deleted successfully')
      // Remove from local state
      setRides(rides.filter(ride => ride.id !== rideId))
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to delete ride')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleStatusUpdate = async (rideId, newStatus) => {
    try {
      await rideAPI.updateRide(rideId, { status: newStatus })
      setMessage(`✅ Ride status updated to ${newStatus}`)
      
      // Update local state
      setRides(rides.map(ride => 
        ride.id === rideId ? { ...ride, status: newStatus } : ride
      ))
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to update ride status')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: '#10b981', bg: '#d1fae5', text: '🟢 Active' },
      matched: { color: '#3b82f6', bg: '#dbeafe', text: '🔵 Matched' },
      completed: { color: '#8b5cf6', bg: '#ede9fe', text: '✅ Completed' },
      cancelled: { color: '#ef4444', bg: '#fee2e2', text: '❌ Cancelled' }
    }
    
    const badge = badges[status] || badges.active
    
    return (
      <span style={{
        ...styles.statusBadge,
        color: badge.color,
        backgroundColor: badge.bg
      }}>
        {badge.text}
      </span>
    )
  }

  const getDirectionIcon = (direction) => {
    return direction === 'going_to' ? '➡️' : '⬅️'
  }

  const filteredRides = filter === 'all' 
    ? rides 
    : rides.filter(ride => ride.status === filter)

  if (loading) {
    return (
      <div className="container" style={styles.container}>
        <div style={styles.loadingContainer}>
          <div className="spinner spinner-large"></div>
          <p>Loading your rides...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🚗 My Rides</h1>
        <p style={styles.subtitle}>
          Manage your posted rides and track their status
        </p>
      </div>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={styles.filterTabs}>
        <button
          onClick={() => setFilter('all')}
          style={{
            ...styles.filterTab,
            ...(filter === 'all' ? styles.filterTabActive : {})
          }}
        >
          All ({rides.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          style={{
            ...styles.filterTab,
            ...(filter === 'active' ? styles.filterTabActive : {})
          }}
        >
          Active ({rides.filter(r => r.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          style={{
            ...styles.filterTab,
            ...(filter === 'completed' ? styles.filterTabActive : {})
          }}
        >
          Completed ({rides.filter(r => r.status === 'completed').length})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          style={{
            ...styles.filterTab,
            ...(filter === 'cancelled' ? styles.filterTabActive : {})
          }}
        >
          Cancelled ({rides.filter(r => r.status === 'cancelled').length})
        </button>
      </div>

      {/* Rides List */}
      {filteredRides.length === 0 ? (
        <div className="card" style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <h3 style={styles.emptyTitle}>
            {filter === 'all' ? 'No rides posted yet' : `No ${filter} rides`}
          </h3>
          <p style={styles.emptyText}>
            {filter === 'all' 
              ? 'Post your first ride from the Dashboard!'
              : `You don't have any ${filter} rides at the moment.`
            }
          </p>
        </div>
      ) : (
        <div style={styles.ridesGrid}>
          {filteredRides.map(ride => (
            <div key={ride.id} className="card" style={styles.rideCard}>
              {/* Status Badge */}
              <div style={styles.cardHeader}>
                {getStatusBadge(ride.status)}
                <span style={styles.rideId}>ID: #{ride.id}</span>
              </div>

              {/* Original Message */}
              {ride.raw_message && (
                <div style={styles.rawMessage}>
                  <strong>💬 Original:</strong> "{ride.raw_message}"
                </div>
              )}

              {/* Route Info */}
              <div style={styles.routeInfo}>
                <div style={styles.routeItem}>
                  <span style={styles.routeLabel}>From:</span>
                  <span style={styles.routeValue}>
                    {ride.origin || 'Not specified'}
                  </span>
                </div>
                <div style={styles.routeArrow}>
                  {getDirectionIcon(ride.direction)}
                </div>
                <div style={styles.routeItem}>
                  <span style={styles.routeLabel}>To:</span>
                  <span style={styles.routeValue}>
                    {ride.destination}
                  </span>
                </div>
              </div>

              {/* Time and Seats */}
              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>🕐</span>
                  <div>
                    <div style={styles.detailLabel}>Departure Time</div>
                    <div style={styles.detailValue}>
                      {formatDateTime(ride.ride_time)}
                    </div>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>💺</span>
                  <div>
                    <div style={styles.detailLabel}>Seats Available</div>
                    <div style={styles.detailValue}>
                      {ride.seats_available} {ride.seats_available === 1 ? 'seat' : 'seats'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Created Date */}
              <div style={styles.createdDate}>
                Posted {new Date(ride.created_at).toLocaleDateString()}
              </div>

              {/* Action Buttons */}
              <div style={styles.actions}>
                {ride.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(ride.id, 'completed')}
                      className="btn btn-sm"
                      style={styles.btnSuccess}
                    >
                      ✅ Mark Completed
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(ride.id, 'cancelled')}
                      className="btn btn-sm btn-outline"
                    >
                      ❌ Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(ride.id)}
                  className="btn btn-sm"
                  style={styles.btnDanger}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#64748b',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  filterTabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  filterTab: {
    padding: '0.75rem 1.5rem',
    border: '2px solid #e2e8f0',
    backgroundColor: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#64748b',
    transition: 'all 0.2s',
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
    color: 'white',
    borderColor: '#2563eb',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '0.5rem',
  },
  emptyText: {
    fontSize: '1rem',
    color: '#64748b',
  },
  ridesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '1.5rem',
  },
  rideCard: {
    padding: '1.5rem',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  statusBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '700',
  },
  rideId: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  rawMessage: {
    backgroundColor: '#f8fafc',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.95rem',
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: '1.6',
  },
  routeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
  },
  routeItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  routeLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  routeValue: {
    fontSize: '1rem',
    color: '#1e293b',
    fontWeight: '600',
  },
  routeArrow: {
    fontSize: '1.5rem',
    color: '#3b82f6',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem',
  },
  detailItem: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'start',
  },
  detailIcon: {
    fontSize: '1.5rem',
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginBottom: '0.25rem',
  },
  detailValue: {
    fontSize: '0.95rem',
    color: '#1e293b',
    fontWeight: '600',
  },
  createdDate: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '1rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid #e2e8f0',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  btnSuccess: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
  },
  btnDanger: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
  },
}

export default MyRides
