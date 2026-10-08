const { query } = require('../config/db');

/**
 * Account Model - Interacts with `accounts` table
 */
class AccountModel {
  // Find account details by user ID
  static async findByUserId(userId) {
    const rows = await query('SELECT * FROM accounts WHERE user_id = ?', [userId]);
    return rows[0] || null;
  }

  // Find account details by account number
  static async findByAccountNumber(accountNumber) {
    const rows = await query('SELECT * FROM accounts WHERE account_number = ?', [accountNumber]);
    return rows[0] || null;
  }

  // Get account joined with owner full name and email
  static async getAccountWithUser(accountNumber) {
    const sql = `
      SELECT a.*, u.full_name, u.email, u.is_blocked as user_blocked
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.account_number = ?
    `;
    const rows = await query(sql, [accountNumber]);
    return rows[0] || null;
  }

  // Create a new bank account with auto-generated 10-digit account number
  static async createAccount(userId, accountType = 'savings', initialBalance = 1000.00) {
    // Generate unique 10-digit account number: 1000 + random 6 digits
    const accountNumber = '1000' + Math.floor(100000 + Math.random() * 900000);
    
    const result = await query(
      'INSERT INTO accounts (user_id, account_number, account_type, balance, status) VALUES (?, ?, ?, ?, ?)',
      [userId, accountNumber, accountType, initialBalance, 'active']
    );

    return {
      id: result.insertId,
      account_number: accountNumber,
      account_type: accountType,
      balance: initialBalance
    };
  }

  // Update account balance (supports standard connection or transaction object)
  static async updateBalance(accountId, amount, dbConnection = null) {
    const sql = 'UPDATE accounts SET balance = balance + ? WHERE id = ?';
    if (dbConnection) {
      await dbConnection.execute(sql, [amount, accountId]);
    } else {
      await query(sql, [amount, accountId]);
    }
  }

  // Update account status (active/blocked)
  static async updateStatus(accountId, status) {
    await query('UPDATE accounts SET status = ? WHERE id = ?', [status, accountId]);
  }
}

module.exports = AccountModel;
