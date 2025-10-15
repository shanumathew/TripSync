const db = require('../config/database');

class User {
  // ============================================
  // CREATE - Register new user
  // ============================================
  static async create({ email, password, name, university, phone }) {
    try {
      // Password should already be hashed by the controller
      const query = `
        INSERT INTO users (email, password, name, university, phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, name, university, phone, trust_score, total_rides, 
                  completed_rides, is_verified, is_active, created_at, updated_at
      `;

      const values = [email, password, name, university, phone || null];
      const result = await db.query(query, values);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find user by ID
  // ============================================
  static async findById(id) {
    try {
      const query = `
        SELECT id, email, name, university, phone, profile_picture, 
               trust_score, total_rides, completed_rides, is_verified, 
               is_active, created_at, updated_at
        FROM users
        WHERE id = $1 AND is_active = true
      `;

      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find user by email
  // ============================================
  static async findByEmail(email) {
    try {
      const query = `
        SELECT id, email, password, name, university, phone, profile_picture,
               trust_score, total_rides, completed_rides, is_verified, 
               is_active, created_at, updated_at
        FROM users
        WHERE email = $1
      `;

      const result = await db.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Get all users (with pagination)
  // ============================================
  static async findAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT id, email, name, university, phone, profile_picture,
               trust_score, total_rides, completed_rides, is_verified,
               created_at
        FROM users
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await db.query(query, [limit, offset]);

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM users WHERE is_active = true`;
      const countResult = await db.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      return {
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find users by university
  // ============================================
  static async findByUniversity(university, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT id, email, name, university, phone, profile_picture,
               trust_score, total_rides, completed_rides, created_at
        FROM users
        WHERE university = $1 AND is_active = true
        ORDER BY trust_score DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [university, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Update user profile
  // ============================================
  static async update(id, updateData) {
    try {
      const allowedFields = ['name', 'phone', 'profile_picture', 'university'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      // Build dynamic update query
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);

      const query = `
        UPDATE users
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING id, email, name, university, phone, profile_picture,
                  trust_score, total_rides, completed_rides, is_verified,
                  is_active, created_at, updated_at
      `;

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Update password
  // ============================================
  static async updatePassword(id, hashedPassword) {
    try {
      // Password should already be hashed by the controller
      const query = `
        UPDATE users
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
      `;

      const result = await db.query(query, [hashedPassword, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Verify email
  // ============================================
  static async verifyEmail(id) {
    try {
      const query = `
        UPDATE users
        SET is_verified = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, is_verified
      `;

      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Update trust score
  // ============================================
  static async updateTrustScore(id, score) {
    try {
      const query = `
        UPDATE users
        SET trust_score = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, trust_score
      `;

      const result = await db.query(query, [score, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // DELETE - Soft delete user (deactivate)
  // ============================================
  static async softDelete(id) {
    try {
      const query = `
        UPDATE users
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `;

      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // DELETE - Hard delete user (permanent)
  // ============================================
  static async hardDelete(id) {
    try {
      const query = `DELETE FROM users WHERE id = $1 RETURNING id`;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Toggle driver status
  // ============================================
  static async updateDriverStatus(id, isDriver) {
    try {
      const query = `
        UPDATE users
        SET is_driver = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, name, university, phone, profile_picture,
                  trust_score, total_rides, completed_rides, is_verified,
                  is_active, is_driver, driver_rating, total_rides_as_driver,
                  created_at, updated_at
      `;

      const result = await db.query(query, [isDriver, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // VALIDATION - Check if email exists
  // ============================================
  static async emailExists(email) {
    try {
      const query = `SELECT id FROM users WHERE email = $1`;
      const result = await db.query(query, [email]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
