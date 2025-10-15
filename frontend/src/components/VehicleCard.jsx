import { useState } from 'react'

function VehicleCard({ vehicle, onEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(vehicle.id)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div style={styles.card}>
      {/* Vehicle Icon */}
      <div style={styles.iconContainer}>
        <span style={styles.icon}>🚗</span>
      </div>

      {/* Vehicle Info */}
      <div style={styles.info}>
        <h3 style={styles.model}>{vehicle.model}</h3>
        
        <div style={styles.details}>
          <div style={styles.detailRow}>
            <span style={styles.label}>Color:</span>
            <div style={styles.colorInfo}>
              <span
                style={{
                  ...styles.colorDot,
                  backgroundColor: vehicle.color.toLowerCase(),
                }}
              />
              <span style={styles.value}>{vehicle.color}</span>
            </div>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.label}>Plate:</span>
            <span style={styles.plateValue}>{vehicle.license_plate}</span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.label}>Seats:</span>
            <span style={styles.value}>
              💺 {vehicle.total_seats} {vehicle.total_seats === 1 ? 'seat' : 'seats'}
            </span>
          </div>

          {vehicle.is_active !== undefined && (
            <div style={styles.detailRow}>
              <span
                style={{
                  ...styles.statusBadge,
                  ...(vehicle.is_active ? styles.activeStatus : styles.inactiveStatus),
                }}
              >
                {vehicle.is_active ? '✅ Active' : '⏸️ Inactive'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button
          onClick={() => onEdit(vehicle)}
          className="btn btn-outline"
          style={styles.editBtn}
          disabled={deleting}
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn"
          style={styles.deleteBtn}
          disabled={deleting}
        >
          {deleting ? '⏳' : '🗑️'} Delete
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Delete Vehicle?</h3>
            <p style={styles.modalText}>
              Are you sure you want to delete <strong>{vehicle.model}</strong> ({vehicle.license_plate})?
              This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-outline"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn"
                style={styles.confirmDeleteBtn}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
  },
  icon: {
    fontSize: '3rem',
  },
  info: {
    flex: 1,
  },
  model: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '1rem',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '600',
    minWidth: '50px',
  },
  value: {
    fontSize: '0.875rem',
    color: '#1e293b',
    fontWeight: '500',
  },
  colorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  colorDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid #cbd5e1',
  },
  plateValue: {
    fontSize: '0.875rem',
    color: '#1e293b',
    fontWeight: '700',
    fontFamily: 'monospace',
    backgroundColor: '#f8fafc',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
  },
  activeStatus: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  inactiveStatus: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  editBtn: {
    flex: 1,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.75rem',
  },
  modalText: {
    fontSize: '0.95rem',
    color: '#64748b',
    marginBottom: '1.5rem',
    lineHeight: '1.6',
  },
  modalActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
  },
}

export default VehicleCard
