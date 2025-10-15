import { useState, useEffect } from 'react'
import { vehicleAPI } from '../services/vehicleService'
import VehicleCard from '../components/VehicleCard'
import AddVehicle from '../components/AddVehicle'
import EditVehicle from '../components/EditVehicle'
import DriverToggle from '../components/DriverToggle'

function MyVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const response = await vehicleAPI.getMyVehicles()
      console.log('Vehicles Response:', response)
      setVehicles(response.data?.vehicles || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      setMessage('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSuccess = (newVehicle) => {
    setVehicles(prev => [...prev, newVehicle])
    setShowAddForm(false)
    setMessage('✅ Vehicle added successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle)
  }

  const handleEditSuccess = (updatedVehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v))
    setEditingVehicle(null)
    setMessage('✅ Vehicle updated successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDelete = async (vehicleId) => {
    try {
      await vehicleAPI.deleteVehicle(vehicleId)
      setVehicles(prev => prev.filter(v => v.id !== vehicleId))
      setMessage('✅ Vehicle deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to delete vehicle')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="container" style={styles.container}>
        <div style={styles.loadingContainer}>
          <div className="spinner spinner-large"></div>
          <p>Loading your vehicles...</p>
        </div>
      </div>
    )
  }

  // Show Add Vehicle Form
  if (showAddForm) {
    return (
      <div className="container" style={styles.container}>
        <AddVehicle
          onSuccess={handleAddSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    )
  }

  // Show Edit Vehicle Form
  if (editingVehicle) {
    return (
      <div className="container" style={styles.container}>
        <EditVehicle
          vehicle={editingVehicle}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingVehicle(null)}
        />
      </div>
    )
  }

  return (
    <div className="container" style={styles.container}>
      {/* Driver Toggle Section */}
      <DriverToggle />

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🚗 My Vehicles</h1>
          <p style={styles.subtitle}>
            Manage your registered vehicles
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
          style={styles.addButton}
        >
          ➕ Add Vehicle
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {/* Empty State */}
      {vehicles.length === 0 ? (
        <div className="card" style={styles.emptyState}>
          <div style={styles.emptyIcon}>🚙</div>
          <h3 style={styles.emptyTitle}>No Vehicles Yet</h3>
          <p style={styles.emptyText}>
            You haven't added any vehicles yet. Add your first vehicle to start offering rides as a driver!
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
            style={styles.emptyButton}
          >
            ➕ Add Your First Vehicle
          </button>
          <div style={styles.benefits}>
            <h4 style={styles.benefitsTitle}>Why add a vehicle?</h4>
            <ul style={styles.benefitsList}>
              <li>✅ Become a driver and offer rides</li>
              <li>✅ Earn money by sharing your journey</li>
              <li>✅ Help fellow students commute</li>
              <li>✅ Flexible schedule - drive when you want</li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          {/* Vehicles Count */}
          <div style={styles.count}>
            <span style={styles.countText}>
              {vehicles.length} {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'} Registered
            </span>
            <button
              onClick={fetchVehicles}
              className="btn btn-outline btn-sm"
              style={styles.refreshBtn}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Vehicles Grid */}
          <div style={styles.grid}>
            {vehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
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
  loadingContainer: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
  },
  addButton: {
    whiteSpace: 'nowrap',
  },
  count: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  countText: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#475569',
  },
  refreshBtn: {
    fontSize: '0.875rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  emptyIcon: {
    fontSize: '5rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.75rem',
  },
  emptyText: {
    fontSize: '1.1rem',
    color: '#64748b',
    marginBottom: '2rem',
    maxWidth: '500px',
    margin: '0 auto 2rem',
    lineHeight: '1.6',
  },
  emptyButton: {
    fontSize: '1.1rem',
    padding: '0.75rem 2rem',
  },
  benefits: {
    marginTop: '3rem',
    paddingTop: '2rem',
    borderTop: '1px solid #e2e8f0',
  },
  benefitsTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '1rem',
  },
  benefitsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    textAlign: 'left',
    maxWidth: '400px',
    margin: '0 auto',
  },
}

export default MyVehicles
