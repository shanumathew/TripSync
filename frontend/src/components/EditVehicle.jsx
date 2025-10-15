import { useState } from 'react'
import { vehicleAPI } from '../services/vehicleService'

function EditVehicle({ vehicle, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    model: vehicle.model || '',
    color: vehicle.color || '',
    license_plate: vehicle.license_plate || '',
    total_seats: vehicle.total_seats || 1,
    is_active: vehicle.is_active !== undefined ? vehicle.is_active : true
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const validateField = (name, value) => {
    switch (name) {
      case 'model':
        return value.trim().length < 2 ? 'Model must be at least 2 characters' : ''
      case 'color':
        return value.trim().length < 2 ? 'Color must be at least 2 characters' : ''
      case 'license_plate':
        if (value.trim().length < 4) return 'License plate must be at least 4 characters'
        if (!/^[A-Z0-9]+$/.test(value)) return 'Only uppercase letters and numbers allowed'
        return ''
      case 'total_seats':
        const seats = parseInt(value)
        if (isNaN(seats) || seats < 1 || seats > 8) return 'Seats must be between 1 and 8'
        return ''
      default:
        return ''
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    // Auto-uppercase license plate
    const finalValue = name === 'license_plate' ? newValue.toUpperCase() : newValue
    
    setFormData(prev => ({ ...prev, [name]: finalValue }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    const error = validateField(name, value)
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    Object.keys(formData).forEach(key => {
      if (key !== 'is_active') {
        const error = validateField(key, formData[key])
        if (error) newErrors[key] = error
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setMessage('❌ Please fix all errors before submitting')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await vehicleAPI.updateVehicle(vehicle.id, formData)
      setMessage('✅ Vehicle updated successfully!')
      
      setTimeout(() => {
        onSuccess(response.data.vehicle)
      }, 1000)
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update vehicle'
      setMessage('❌ ' + errorMsg)
      setLoading(false)
    }
  }

  return (
    <div className="card" style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>✏️ Edit Vehicle</h2>
        <button
          onClick={onCancel}
          className="btn btn-outline btn-sm"
          style={styles.cancelBtn}
        >
          ✖ Cancel
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Vehicle Model */}
        <div className="form-group">
          <label htmlFor="model" className="label">
            Vehicle Model <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input ${errors.model ? 'input-error' : ''}`}
            placeholder="e.g., Honda City, Toyota Camry"
            required
          />
          {errors.model && <span className="error-text">{errors.model}</span>}
        </div>

        {/* Vehicle Color */}
        <div className="form-group">
          <label htmlFor="color" className="label">
            Color <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input ${errors.color ? 'input-error' : ''}`}
            placeholder="e.g., White, Black, Silver"
            required
          />
          {errors.color && <span className="error-text">{errors.color}</span>}
        </div>

        {/* License Plate */}
        <div className="form-group">
          <label htmlFor="license_plate" className="label">
            License Plate <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="license_plate"
            name="license_plate"
            value={formData.license_plate}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input ${errors.license_plate ? 'input-error' : ''}`}
            placeholder="e.g., TN01AB1234"
            required
            style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
          />
          {errors.license_plate && <span className="error-text">{errors.license_plate}</span>}
          <small style={styles.hint}>Only uppercase letters and numbers (auto-converted)</small>
        </div>

        {/* Total Seats */}
        <div className="form-group">
          <label htmlFor="total_seats" className="label">
            Available Seats <span style={styles.required}>*</span>
          </label>
          <input
            type="number"
            id="total_seats"
            name="total_seats"
            value={formData.total_seats}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input ${errors.total_seats ? 'input-error' : ''}`}
            min="1"
            max="8"
            required
          />
          {errors.total_seats && <span className="error-text">{errors.total_seats}</span>}
          <small style={styles.hint}>Number of passenger seats (excluding driver): 1-8</small>
        </div>

        {/* Is Active Checkbox */}
        <div className="form-group">
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              style={styles.checkbox}
            />
            <span style={styles.checkboxText}>
              Vehicle is active and available for rides
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || Object.keys(errors).length > 0}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Updating...
              </>
            ) : (
              '💾 Update Vehicle'
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
    margin: '2rem auto',
    padding: '2rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e2e8f0',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  cancelBtn: {
    padding: '0.5rem 1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  required: {
    color: '#dc2626',
    fontWeight: '700',
  },
  hint: {
    display: 'block',
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '1rem',
    color: '#475569',
    fontWeight: '500',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '1rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e2e8f0',
  },
}

export default EditVehicle
