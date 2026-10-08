const { query } = require('../config/db');

/**
 * OTP Model - Interacts with `otp` table
 */
class OTPModel {
  // Generate random 6-digit OTP code
  static generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create new OTP entry (valid for 10 minutes)
  static async createOTP(userId, type = 'registration') {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Invalidate prior unused OTPs of same type for user
    await query(
      'UPDATE otp SET is_used = 1 WHERE user_id = ? AND type = ? AND is_used = 0',
      [userId, type]
    );

    const result = await query(
      'INSERT INTO otp (user_id, code, type, expires_at, is_used) VALUES (?, ?, ?, ?, 0)',
      [userId, code, type, expiresAt]
    );

    return { id: result.insertId, code, expiresAt };
  }

  // Verify OTP code
  static async verifyOTP(userId, code, type) {
    const sql = `
      SELECT * FROM otp 
      WHERE user_id = ? AND code = ? AND type = ? AND is_used = 0 AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;
    const rows = await query(sql, [userId, code, type]);
    
    if (rows.length > 0) {
      // Mark OTP as used
      await query('UPDATE otp SET is_used = 1 WHERE id = ?', [rows[0].id]);
      return true;
    }
    return false;
  }
}

module.exports = OTPModel;
