import { useState } from 'react'
import { vehicleAPI } from '../services/vehicleService'

function AddVehicle({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    model: '',
    color: '',
    license_plate: '',
    total_seats: 4,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Validation functions
  const validateModel = (model) => {
    if (!model.trim()) return 'Model is required'
    if (model.length < 2) return 'Model must be at least 2 characters'
    if (model.length > 50) return 'Model must be less than 50 characters'
    return null
  }

  const validateColor = (color) => {
    if (!color.trim()) return 'Color is required'
    if (color.length < 3) return 'Color must be at least 3 characters'
    if (color.length > 20) return 'Color must be less than 20 characters'
    return null
  }

  const validateLicensePlate = (plate) => {
    if (!plate.trim()) return 'License plate is required'
    if (!/^[A-Z0-9\s]+$/i.test(plate)) return 'License plate must be alphanumeric'
    if (plate.length < 4) return 'License plate seems too short'
    if (plate.length > 20) return 'License plate is too long'
    return null
  }

  const validateSeats = (seats) => {
    const num = parseInt(seats)
    if (isNaN(num)) return 'Seats must be a number'
    if (num < 1) return 'Must have at least 1 seat'
    if (num > 8) return 'Cannot exceed 8 seats'
    return null
  }

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Auto-uppercase license plate
    const processedValue = name === 'license_plate' 
      ? value.toUpperCase().replace(/[^A-Z0-9\s]/g, '')
      : value

    setFormData(prev => ({ ...prev, [name]: processedValue }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Validate all fields
  const validateForm = () => {
    const newErrors = {}
    
    const modelError = validateModel(formData.model)
    if (modelError) newErrors.model = modelError
    
    const colorError = validateColor(formData.color)
    if (colorError) newErrors.color = colorError
    
    const plateError = validateLicensePlate(formData.license_plate)
    if (plateError) newErrors.license_plate = plateError
    
    const seatsError = validateSeats(formData.total_seats)
    if (seatsError) newErrors.total_seats = seatsError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate
    if (!validateForm()) {
      setMessage('Please fix the errors above')
      return
    }
    
    setLoading(true)
    setMessage('')
    
    try {
      const result = await vehicleAPI.addVehicle(formData)
      
      // Success
      setMessage('✅ Vehicle added successfully!')
      
      // Reset form
      setFormData({
        model: '',
        color: '',
        license_plate: '',
        total_seats: 4,
      })
      
      // Notify parent
      if (onSuccess) {
        setTimeout(() => onSuccess(result.data), 1500)
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to add vehicle'
      setMessage('❌ ' + errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    return formData.model.trim() &&
           formData.color.trim() &&
           formData.license_plate.trim() &&
           formData.total_seats >= 1 &&
           formData.total_seats <= 8
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🚗 Add New Vehicle</h2>
        <p style={styles.subtitle}>Register your vehicle to become a driver</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Vehicle Model */}
        <div className="form-group">
          <label className="form-label">
            Vehicle Model <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className={`form-input ${errors.model ? 'input-error' : ''}`}
            placeholder="e.g., Honda City, Toyota Camry"
            maxLength={50}
          />
          {errors.model && <span className="form-error">{errors.model}</span>}
          <span className="form-help">Enter your vehicle's make and model</span>
        </div>

        {/* Color */}
        <div className="form-group">
          <label className="form-label">
            Color <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className={`form-input ${errors.color ? 'input-error' : ''}`}
            placeholder="e.g., White, Black, Silver"
            maxLength={20}
          />
          {errors.color && <span className="form-error">{errors.color}</span>}
          <span className="form-help">Vehicle color for identification</span>
        </div>

        {/* License Plate */}
        <div className="form-group">
          <label className="form-label">
            License Plate <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="license_plate"
            value={formData.license_plate}
            onChange={handleChange}
            className={`form-input ${errors.license_plate ? 'input-error' : ''}`}
            placeholder="e.g., TN 01 AB 1234"
            maxLength={20}
            style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
          />
          {errors.license_plate && <span className="form-error">{errors.license_plate}</span>}
          <span className="form-help">Alphanumeric only (automatically uppercased)</span>
        </div>

        {/* Total Seats */}
        <div className="form-group">
          <label className="form-label">
            Available Seats <span style={styles.required}>*</span>
          </label>
          <input
            type="number"
            name="total_seats"
            value={formData.total_seats}
            onChange={handleChange}
            className={`form-input ${errors.total_seats ? 'input-error' : ''}`}
            min="1"
            max="8"
            style={{ maxWidth: '150px' }}
          />
          {errors.total_seats && <span className="form-error">{errors.total_seats}</span>}
          <span className="form-help">Number of seats available for passengers (1-8)</span>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !isFormValid()}
            style={{ flex: 1 }}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              '✅ Add Vehicle'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  required: {
    color: '#ef4444',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
}

export default AddVehicle
