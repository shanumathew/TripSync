const db = require('../config/database');

class Match {
  // ============================================
  // CREATE - Create a new match
  // ============================================
  static async create(matchData) {
    try {
      const {
        ride1_id,
        ride2_id,
        match_score,
        time_score,
        location_score,
        trust_score,
        initiated_by,
      } = matchData;

      const query = `
        INSERT INTO matches (
          ride1_id, ride2_id, match_score, time_score, 
          location_score, trust_score, initiated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        ride1_id,
        ride2_id,
        match_score,
        time_score || null,
        location_score || null,
        trust_score || null,
        initiated_by,
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find match by ID
  // ============================================
  static async findById(id) {
    try {
      const query = `
        SELECT 
          m.*,
          r1.destination as ride1_destination,
          r1.ride_time as ride1_time,
          r1.user_id as ride1_user_id,
          u1.name as ride1_user_name,
          u1.phone as ride1_user_phone,
          u1.trust_score as ride1_user_trust,
          r2.destination as ride2_destination,
          r2.ride_time as ride2_time,
          r2.user_id as ride2_user_id,
          u2.name as ride2_user_name,
          u2.phone as ride2_user_phone,
          u2.trust_score as ride2_user_trust
        FROM matches m
        JOIN rides r1 ON m.ride1_id = r1.id
        JOIN rides r2 ON m.ride2_id = r2.id
        JOIN users u1 ON r1.user_id = u1.id
        JOIN users u2 ON r2.user_id = u2.id
        WHERE m.id = $1
      `;

      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find matches for a specific ride
  // ============================================
  static async findByRideId(rideId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          m.*,
          CASE 
            WHEN m.ride1_id = $1 THEN r2.id
            ELSE r1.id
          END as matched_ride_id,
          CASE 
            WHEN m.ride1_id = $1 THEN r2.destination
            ELSE r1.destination
          END as matched_destination,
          CASE 
            WHEN m.ride1_id = $1 THEN r2.ride_time
            ELSE r1.ride_time
          END as matched_ride_time,
          CASE 
            WHEN m.ride1_id = $1 THEN u2.id
            ELSE u1.id
          END as matched_user_id,
          CASE 
            WHEN m.ride1_id = $1 THEN u2.name
            ELSE u1.name
          END as matched_user_name,
          CASE 
            WHEN m.ride1_id = $1 THEN u2.trust_score
            ELSE u1.trust_score
          END as matched_user_trust,
          CASE 
            WHEN m.ride1_id = $1 THEN u2.phone
            ELSE u1.phone
          END as matched_user_phone
        FROM matches m
        JOIN rides r1 ON m.ride1_id = r1.id
        JOIN rides r2 ON m.ride2_id = r2.id
        JOIN users u1 ON r1.user_id = u1.id
        JOIN users u2 ON r2.user_id = u2.id
        WHERE (m.ride1_id = $1 OR m.ride2_id = $1)
        ORDER BY m.match_score DESC, m.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [rideId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find matches for a user
  // ============================================
  static async findByUserId(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          m.*,
          r1.destination as ride1_destination,
          r1.ride_time as ride1_time,
          r2.destination as ride2_destination,
          r2.ride_time as ride2_time,
          CASE 
            WHEN r1.user_id = $1 THEN u2.name
            ELSE u1.name
          END as other_user_name,
          CASE 
            WHEN r1.user_id = $1 THEN u2.trust_score
            ELSE u1.trust_score
          END as other_user_trust
        FROM matches m
        JOIN rides r1 ON m.ride1_id = r1.id
        JOIN rides r2 ON m.ride2_id = r2.id
        JOIN users u1 ON r1.user_id = u1.id
        JOIN users u2 ON r2.user_id = u2.id
        WHERE r1.user_id = $1 OR r2.user_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find pending matches for user
  // ============================================
  static async findPendingByUserId(userId) {
    try {
      const query = `
        SELECT 
          m.*,
          r1.destination as ride1_destination,
          r1.user_id as ride1_user_id,
          r2.destination as ride2_destination,
          r2.user_id as ride2_user_id,
          CASE 
            WHEN r1.user_id = $1 THEN u2.name
            ELSE u1.name
          END as other_user_name
        FROM matches m
        JOIN rides r1 ON m.ride1_id = r1.id
        JOIN rides r2 ON m.ride2_id = r2.id
        JOIN users u1 ON r1.user_id = u1.id
        JOIN users u2 ON r2.user_id = u2.id
        WHERE (r1.user_id = $1 OR r2.user_id = $1)
          AND m.status = 'pending'
        ORDER BY m.created_at DESC
      `;

      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Update match status (accept/reject)
  // ============================================
  static async updateStatus(id, status, userId) {
    try {
      const validStatuses = ['pending', 'accepted', 'rejected', 'completed'];

      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      // Check if user is part of this match
      const checkQuery = `
        SELECT m.* FROM matches m
        JOIN rides r1 ON m.ride1_id = r1.id
        JOIN rides r2 ON m.ride2_id = r2.id
        WHERE m.id = $1 AND (r1.user_id = $2 OR r2.user_id = $2)
      `;

      const checkResult = await db.query(checkQuery, [id, userId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Unauthorized: User is not part of this match');
      }

      const updateQuery = `
        UPDATE matches
        SET status = $1::match_status, 
            updated_at = CURRENT_TIMESTAMP,
            accepted_at = CASE WHEN $1 = 'accepted' THEN CURRENT_TIMESTAMP ELSE accepted_at END,
            completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = $2
        RETURNING *
      `;

      const result = await db.query(updateQuery, [status, id]);

      // If accepted, update ride statuses
      if (status === 'accepted') {
        const match = result.rows[0];
        await db.query(
          `UPDATE rides SET status = 'matched' WHERE id IN ($1, $2)`,
          [match.ride1_id, match.ride2_id]
        );
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Complete match
  // ============================================
  static async complete(id, userId) {
    try {
      return await this.updateStatus(id, 'completed', userId);
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // DELETE - Delete match
  // ============================================
  static async delete(id, userId) {
    try {
      // Check if user initiated the match
      const query = `
        DELETE FROM matches
        WHERE id = $1 AND initiated_by = $2
        RETURNING id
      `;

      const result = await db.query(query, [id, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // VALIDATION - Check if match already exists
  // ============================================
  static async matchExists(ride1_id, ride2_id) {
    try {
      const query = `
        SELECT id FROM matches
        WHERE (ride1_id = $1 AND ride2_id = $2)
           OR (ride1_id = $2 AND ride2_id = $1)
      `;

      const result = await db.query(query, [ride1_id, ride2_id]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // STATS - Get match statistics
  // ============================================
  static async getStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_matches,
          COUNT(CASE WHEN m.status = 'pending' THEN 1 END) as pending_matches,
          COUNT(CASE WHEN m.status = 'accepted' THEN 1 END) as accepted_matches,
          COUNT(CASE WHEN m.status = 'rejected' THEN 1 END) as rejected_matches,
          COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_matches,
          AVG(m.match_score) as average_match_score
        FROM matches m
        JOIN rides r1 ON m.ride1_id = r1.id
        JOIN rides r2 ON m.ride2_id = r2.id
        WHERE r1.user_id = $1 OR r2.user_id = $1
      `;

      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // SEARCH - Find potential matches for a ride
  // ============================================
  static async findPotentialMatches(rideId, minScore = 50, limit = 10) {
    try {
      // This is a simplified version - will be enhanced in Part 6 with matching algorithm
      const query = `
        SELECT 
          r.*,
          u.name as user_name,
          u.trust_score as user_trust_score,
          u.phone as user_phone
        FROM rides r
        JOIN users u ON r.user_id = u.id
        WHERE r.id != $1
          AND r.status = 'active'
          AND r.ride_time > NOW()
        ORDER BY r.ride_time ASC
        LIMIT $2
      `;

      const result = await db.query(query, [rideId, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Match;
