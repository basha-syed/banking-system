const { query } = require('../config/db');

/**
 * Notification Model - Interacts with `notifications` table
 */
class NotificationModel {
  // Create notification for a user
  static async create(userId, title, message) {
    const result = await query(
      'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, 0)',
      [userId, title, message]
    );
    return result.insertId;
  }

  // Get notifications for a user
  static async getByUserId(userId, limit = 20) {
    return await query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  }
}

module.exports = NotificationModel;
