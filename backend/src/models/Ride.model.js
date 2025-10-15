const db = require('../config/database');

class Ride {
  // ============================================
  // CREATE - Post a new ride
  // ============================================
  static async create(rideData) {
    try {
      const {
        user_id,
        raw_message,
        destination,
        origin,
        direction,
        destination_lat,
        destination_lng,
        origin_lat,
        origin_lng,
        ride_time,
        flexibility_minutes,
        seats_available,
        estimated_cost,
        notes,
      } = rideData;

      const query = `
        INSERT INTO rides (
          user_id, raw_message, destination, origin, direction,
          destination_lat, destination_lng, origin_lat, origin_lng,
          ride_time, flexibility_minutes, seats_available, estimated_cost, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
        user_id,
        raw_message,
        destination,
        origin || null,
        direction || 'going_to',
        destination_lat || null,
        destination_lng || null,
        origin_lat || null,
        origin_lng || null,
        ride_time,
        flexibility_minutes || 30,
        seats_available || 1,
        estimated_cost || null,
        notes || null,
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find ride by ID
  // ============================================
  static async findById(id) {
    try {
      const query = `
        SELECT 
          r.*,
          u.name as user_name,
          u.email as user_email,
          u.phone as user_phone,
          u.trust_score as user_trust_score,
          u.profile_picture as user_profile_picture
        FROM rides r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = $1
      `;

      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Get all rides by user
  // ============================================
  static async findByUserId(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT *
        FROM rides
        WHERE user_id = $1
        ORDER BY ride_time DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Get active rides
  // ============================================
  static async findActive(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          r.*,
          u.name as user_name,
          u.trust_score as user_trust_score,
          u.profile_picture as user_profile_picture
        FROM rides r
        JOIN users u ON r.user_id = u.id
        WHERE r.status = 'active' 
          AND r.ride_time > NOW()
        ORDER BY r.ride_time ASC
        LIMIT $1 OFFSET $2
      `;

      const result = await db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find rides by destination
  // ============================================
  static async findByDestination(destination, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          r.*,
          u.name as user_name,
          u.trust_score as user_trust_score
        FROM rides r
        JOIN users u ON r.user_id = u.id
        WHERE r.destination ILIKE $1
          AND r.status = 'active'
          AND r.ride_time > NOW()
        ORDER BY r.ride_time ASC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [`%${destination}%`, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find rides by location proximity
  // ============================================
  static async findNearby(lat, lng, radiusKm = 10, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Haversine formula for distance calculation
      const query = `
        SELECT 
          r.*,
          u.name as user_name,
          u.trust_score as user_trust_score,
          (
            6371 * acos(
              cos(radians($1)) * cos(radians(r.destination_lat)) *
              cos(radians(r.destination_lng) - radians($2)) +
              sin(radians($1)) * sin(radians(r.destination_lat))
            )
          ) AS distance_km
        FROM rides r
        JOIN users u ON r.user_id = u.id
        WHERE r.destination_lat IS NOT NULL
          AND r.destination_lng IS NOT NULL
          AND r.status = 'active'
          AND r.ride_time > NOW()
        HAVING distance_km <= $3
        ORDER BY distance_km ASC, r.ride_time ASC
        LIMIT $4 OFFSET $5
      `;

      const result = await db.query(query, [lat, lng, radiusKm, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find rides by time range
  // ============================================
  static async findByTimeRange(startTime, endTime, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          r.*,
          u.name as user_name,
          u.trust_score as user_trust_score
        FROM rides r
        JOIN users u ON r.user_id = u.id
        WHERE r.ride_time BETWEEN $1 AND $2
          AND r.status = 'active'
        ORDER BY r.ride_time ASC
        LIMIT $3 OFFSET $4
      `;

      const result = await db.query(query, [startTime, endTime, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Update ride details
  // ============================================
  static async update(id, userId, updateData) {
    try {
      const allowedFields = [
        'destination',
        'origin',
        'destination_lat',
        'destination_lng',
        'origin_lat',
        'origin_lng',
        'ride_time',
        'flexibility_minutes',
        'seats_available',
        'estimated_cost',
        'notes',
      ];

      const updates = [];
      const values = [];
      let paramCount = 1;

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

      values.push(id, userId);

      const query = `
        UPDATE rides
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
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
  // UPDATE - Update ride status
  // ============================================
  static async updateStatus(id, userId, status) {
    try {
      const validStatuses = ['active', 'matched', 'completed', 'cancelled'];

      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      const query = `
        UPDATE rides
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `;

      const result = await db.query(query, [status, id, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // DELETE - Delete ride
  // ============================================
  static async delete(id, userId) {
    try {
      const query = `
        DELETE FROM rides
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

      const result = await db.query(query, [id, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // STATS - Get ride statistics for user
  // ============================================
  static async getUserRideStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_rides,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_rides,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rides,
          COUNT(CASE WHEN status = 'matched' THEN 1 END) as matched_rides
        FROM rides
        WHERE user_id = $1
      `;

      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // SEARCH - Advanced search with filters
  // ============================================
  static async search(filters, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const conditions = ['r.status = \'active\'', 'r.ride_time > NOW()'];
      const values = [];
      let paramCount = 1;

      if (filters.destination) {
        conditions.push(`r.destination ILIKE $${paramCount}`);
        values.push(`%${filters.destination}%`);
        paramCount++;
      }

      if (filters.origin) {
        conditions.push(`r.origin ILIKE $${paramCount}`);
        values.push(`%${filters.origin}%`);
        paramCount++;
      }

      if (filters.startTime) {
        conditions.push(`r.ride_time >= $${paramCount}`);
        values.push(filters.startTime);
        paramCount++;
      }

      if (filters.endTime) {
        conditions.push(`r.ride_time <= $${paramCount}`);
        values.push(filters.endTime);
        paramCount++;
      }

      if (filters.minSeats) {
        conditions.push(`r.seats_available >= $${paramCount}`);
        values.push(filters.minSeats);
        paramCount++;
      }

      values.push(limit, offset);

      const query = `
        SELECT 
          r.*,
          u.name as user_name,
          u.trust_score as user_trust_score,
          u.profile_picture as user_profile_picture
        FROM rides r
        JOIN users u ON r.user_id = u.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY r.ride_time ASC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Ride;
