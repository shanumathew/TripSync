const db = require('../config/database');

class Message {
  // ============================================
  // CREATE - Send a new message
  // ============================================
  static async create(messageData) {
    try {
      const { sender_id, receiver_id, match_id, message } = messageData;

      const query = `
        INSERT INTO messages (sender_id, receiver_id, match_id, message)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const values = [sender_id, receiver_id, match_id || null, message];
      const result = await db.query(query, values);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Find message by ID
  // ============================================
  static async findById(id) {
    try {
      const query = `
        SELECT 
          msg.*,
          sender.name as sender_name,
          sender.profile_picture as sender_picture,
          receiver.name as receiver_name,
          receiver.profile_picture as receiver_picture
        FROM messages msg
        JOIN users sender ON msg.sender_id = sender.id
        JOIN users receiver ON msg.receiver_id = receiver.id
        WHERE msg.id = $1
      `;

      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Get conversation between two users
  // ============================================
  static async getConversation(user1_id, user2_id, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          msg.*,
          sender.name as sender_name,
          sender.profile_picture as sender_picture
        FROM messages msg
        JOIN users sender ON msg.sender_id = sender.id
        WHERE (msg.sender_id = $1 AND msg.receiver_id = $2)
           OR (msg.sender_id = $2 AND msg.receiver_id = $1)
        ORDER BY msg.created_at DESC
        LIMIT $3 OFFSET $4
      `;

      const result = await db.query(query, [user1_id, user2_id, limit, offset]);
      return result.rows.reverse(); // Reverse to show oldest first
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Get all conversations for a user
  // ============================================
  static async getUserConversations(userId) {
    try {
      const query = `
        SELECT DISTINCT ON (other_user_id)
          other_user_id,
          other_user_name,
          other_user_picture,
          last_message,
          last_message_time,
          unread_count
        FROM (
          SELECT 
            CASE 
              WHEN msg.sender_id = $1 THEN msg.receiver_id
              ELSE msg.sender_id
            END as other_user_id,
            CASE 
              WHEN msg.sender_id = $1 THEN receiver.name
              ELSE sender.name
            END as other_user_name,
            CASE 
              WHEN msg.sender_id = $1 THEN receiver.profile_picture
              ELSE sender.profile_picture
            END as other_user_picture,
            msg.message as last_message,
            msg.created_at as last_message_time,
            (
              SELECT COUNT(*)
              FROM messages
              WHERE sender_id = CASE 
                  WHEN msg.sender_id = $1 THEN msg.receiver_id
                  ELSE msg.sender_id
                END
                AND receiver_id = $1
                AND is_read = false
            ) as unread_count
          FROM messages msg
          JOIN users sender ON msg.sender_id = sender.id
          JOIN users receiver ON msg.receiver_id = receiver.id
          WHERE msg.sender_id = $1 OR msg.receiver_id = $1
          ORDER BY msg.created_at DESC
        ) conversations
        ORDER BY other_user_id, last_message_time DESC
      `;

      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Get messages for a match
  // ============================================
  static async getMatchMessages(matchId, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          msg.*,
          sender.name as sender_name,
          sender.profile_picture as sender_picture
        FROM messages msg
        JOIN users sender ON msg.sender_id = sender.id
        WHERE msg.match_id = $1
        ORDER BY msg.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [matchId, limit, offset]);
      return result.rows.reverse();
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Get unread messages for user
  // ============================================
  static async getUnreadMessages(userId) {
    try {
      const query = `
        SELECT 
          msg.*,
          sender.name as sender_name,
          sender.profile_picture as sender_picture
        FROM messages msg
        JOIN users sender ON msg.sender_id = sender.id
        WHERE msg.receiver_id = $1 AND msg.is_read = false
        ORDER BY msg.created_at DESC
      `;

      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // READ - Get unread count for user
  // ============================================
  static async getUnreadCount(userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM messages
        WHERE receiver_id = $1 AND is_read = false
      `;

      const result = await db.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Mark message as read
  // ============================================
  static async markAsRead(id, userId) {
    try {
      const query = `
        UPDATE messages
        SET is_read = true
        WHERE id = $1 AND receiver_id = $2
        RETURNING *
      `;

      const result = await db.query(query, [id, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Mark all messages from a user as read
  // ============================================
  static async markConversationAsRead(receiverId, senderId) {
    try {
      const query = `
        UPDATE messages
        SET is_read = true
        WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
        RETURNING COUNT(*) as updated_count
      `;

      const result = await db.query(query, [receiverId, senderId]);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // UPDATE - Mark all messages in a match as read
  // ============================================
  static async markMatchMessagesAsRead(matchId, userId) {
    try {
      const query = `
        UPDATE messages
        SET is_read = true
        WHERE match_id = $1 AND receiver_id = $2 AND is_read = false
        RETURNING COUNT(*) as updated_count
      `;

      const result = await db.query(query, [matchId, userId]);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // DELETE - Delete message
  // ============================================
  static async delete(id, userId) {
    try {
      const query = `
        DELETE FROM messages
        WHERE id = $1 AND sender_id = $2
        RETURNING id
      `;

      const result = await db.query(query, [id, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // DELETE - Delete conversation
  // ============================================
  static async deleteConversation(userId, otherUserId) {
    try {
      const query = `
        DELETE FROM messages
        WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
      `;

      const result = await db.query(query, [userId, otherUserId]);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // SEARCH - Search messages by text
  // ============================================
  static async search(userId, searchText, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          msg.*,
          sender.name as sender_name,
          receiver.name as receiver_name
        FROM messages msg
        JOIN users sender ON msg.sender_id = sender.id
        JOIN users receiver ON msg.receiver_id = receiver.id
        WHERE (msg.sender_id = $1 OR msg.receiver_id = $1)
          AND msg.message ILIKE $2
        ORDER BY msg.created_at DESC
        LIMIT $3 OFFSET $4
      `;

      const result = await db.query(query, [userId, `%${searchText}%`, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // STATS - Get messaging statistics
  // ============================================
  static async getStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN sender_id = $1 THEN 1 END) as sent_messages,
          COUNT(CASE WHEN receiver_id = $1 THEN 1 END) as received_messages,
          COUNT(CASE WHEN receiver_id = $1 AND is_read = false THEN 1 END) as unread_messages,
          COUNT(DISTINCT CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END) as unique_conversations
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
      `;

      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // VALIDATION - Check if users can message each other
  // ============================================
  static async canMessage(senderId, receiverId) {
    try {
      // Check if users have a match or active ride together
      const query = `
        SELECT COUNT(*) as count
        FROM matches m
        JOIN rides r1 ON m.ride1_id = r1.id
        JOIN rides r2 ON m.ride2_id = r2.id
        WHERE ((r1.user_id = $1 AND r2.user_id = $2)
           OR (r1.user_id = $2 AND r2.user_id = $1))
          AND m.status IN ('accepted', 'completed')
      `;

      const result = await db.query(query, [senderId, receiverId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Message;
