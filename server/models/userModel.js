const { query } = require('../config/db');

/**
 * User Model - Interacts with `users` table
 */
class UserModel {
  // Find user by email address
  static async findByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  // Find user by unique ID
  static async findById(id) {
    const rows = await query(
      'SELECT id, full_name, email, phone, role, profile_pic, is_blocked, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // Find user with password hash (for login validation)
  static async findByIdWithPassword(id) {
    const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // Create a new user record
  static async create({ fullName, email, phone, passwordHash, role = 'user' }) {
    const result = await query(
      'INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, phone, passwordHash, role]
    );
    return result.insertId;
  }

  // Update user profile info
  static async updateProfile(id, { fullName, phone, profilePic }) {
    await query(
      'UPDATE users SET full_name = ?, phone = ?, profile_pic = COALESCE(?, profile_pic) WHERE id = ?',
      [fullName, phone, profilePic || null, id]
    );
    return this.findById(id);
  }

  // Update user password
  static async updatePassword(id, newPasswordHash) {
    await query('UPDATE users SET password = ? WHERE id = ?', [newPasswordHash, id]);
  }

  // Admin: Toggle block status
  static async setBlockedStatus(id, isBlocked) {
    await query('UPDATE users SET is_blocked = ? WHERE id = ?', [isBlocked ? 1 : 0, id]);
  }

  // Admin: Get all registered users with their account numbers and balances
  static async getAllUsers() {
    const sql = `
      SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_blocked, u.created_at,
             a.account_number, a.balance, a.status as account_status, a.account_type
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      ORDER BY u.created_at DESC
    `;
    return await query(sql);
  }
}

module.exports = UserModel;
