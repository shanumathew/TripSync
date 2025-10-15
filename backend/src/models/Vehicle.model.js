const db = require('../config/database');

class Vehicle {
  // ============================================
  // CREATE - Add a new vehicle
  // ============================================
  static async create(vehicleData) {
    try {
      const {
        user_id,
        model,
        color,
        license_plate,
        total_seats,
      } = vehicleData;

      const query = `
        INSERT INTO vehicles (
          user_id, model, color, license_plate, total_seats
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        user_id,
        model,
        color,
        license_plate.toUpperCase(), // Ensure uppercase
        total_seats,
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Handle duplicate license plate error
      if (error.code === '23505') {
        const duplicateError = new Error('License plate already registered');
        duplicateError.code = 'DUPLICATE_PLATE';
        throw duplicateError;
      }
      throw error;
    }
  }

  // ============================================
  // READ - Find vehicle by ID
  // ============================================
  static async findById(id) {
    try {
      const query = `
        SELECT 
          v.*,
          u.name as owner_name,
          u.email as owner_email,
          u.phone as owner_phone,
          u.driver_rating as owner_rating
        FROM vehicles v
        JOIN users u ON v.user_id = u.id
        WHERE v.id = $1
      `;

      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Get all vehicles by user
  // ============================================
  static async findByUserId(userId) {
    try {
      const query = `
        SELECT *
        FROM vehicles
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;

      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Get all active vehicles
  // ============================================
  static async findAllActive() {
    try {
      const query = `
        SELECT 
          v.*,
          u.name as owner_name,
          u.driver_rating as owner_rating,
          u.total_rides_as_driver
        FROM vehicles v
        JOIN users u ON v.user_id = u.id
        WHERE v.is_active = TRUE
        ORDER BY v.created_at DESC
      `;

      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Update vehicle details
  // ============================================
  static async update(id, userId, updates) {
    try {
      const { model, color, total_seats, is_active } = updates;

      // First verify the vehicle belongs to the user
      const checkQuery = `
        SELECT * FROM vehicles WHERE id = $1 AND user_id = $2
      `;
      const checkResult = await db.query(checkQuery, [id, userId]);
      
      if (checkResult.rows.length === 0) {
        const error = new Error('Vehicle not found or unauthorized');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (model !== undefined) {
        updateFields.push(`model = $${paramCount}`);
        values.push(model);
        paramCount++;
      }

      if (color !== undefined) {
        updateFields.push(`color = $${paramCount}`);
        values.push(color);
        paramCount++;
      }

      if (total_seats !== undefined) {
        updateFields.push(`total_seats = $${paramCount}`);
        values.push(total_seats);
        paramCount++;
      }

      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramCount}`);
        values.push(is_active);
        paramCount++;
      }

      // Always update updated_at
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (updateFields.length === 1) {
        // Only updated_at, no actual changes
        return checkResult.rows[0];
      }

      values.push(id, userId);

      const query = `
        UPDATE vehicles
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // DELETE - Delete vehicle
  // ============================================
  static async delete(id, userId) {
    try {
      // Verify ownership before deleting
      const query = `
        DELETE FROM vehicles
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await db.query(query, [id, userId]);
      
      if (result.rows.length === 0) {
        const error = new Error('Vehicle not found or unauthorized');
        error.code = 'NOT_FOUND';
        throw error;
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // HELPER - Count user's vehicles
  // ============================================
  static async countByUserId(userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM vehicles
        WHERE user_id = $1 AND is_active = TRUE
      `;

      const result = await db.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // HELPER - Check if license plate exists
  // ============================================
  static async checkLicensePlateExists(licensePlate, excludeVehicleId = null) {
    try {
      let query = `
        SELECT id FROM vehicles WHERE UPPER(license_plate) = UPPER($1)
      `;
      const values = [licensePlate];

      if (excludeVehicleId) {
        query += ` AND id != $2`;
        values.push(excludeVehicleId);
      }

      const result = await db.query(query, values);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // HELPER - Get vehicle with full user details
  // ============================================
  static async findByIdWithUser(id) {
    try {
      const query = `
        SELECT 
          v.*,
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'phone', u.phone,
            'university', u.university,
            'driver_rating', u.driver_rating,
            'total_rides', u.total_rides_as_driver,
            'is_verified', u.is_verified,
            'trust_score', u.trust_score
          ) as owner
        FROM vehicles v
        JOIN users u ON v.user_id = u.id
        WHERE v.id = $1
      `;

      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Vehicle;
