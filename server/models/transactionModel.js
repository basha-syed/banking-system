const { query } = require('../config/db');

/**
 * Transaction Model - Interacts with `transactions` table
 */
class TransactionModel {
  // Helper to generate unique transaction ID format (e.g. TXN-20260720-8912)
  static generateTransactionId() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    return `TXN-${today}-${randomHex}`;
  }

  // Create a new transaction record
  static async create({ transactionId, senderAccountId, receiverAccountId, type, amount, description, status = 'completed' }, dbConnection = null) {
    const txId = transactionId || this.generateTransactionId();
    const sql = `
      INSERT INTO transactions (transaction_id, sender_account_id, receiver_account_id, type, amount, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [txId, senderAccountId || null, receiverAccountId || null, type, amount, description || '', status];

    if (dbConnection) {
      const [result] = await dbConnection.execute(sql, params);
      return { id: result.insertId, transactionId: txId };
    } else {
      const result = await query(sql, params);
      return { id: result.insertId, transactionId: txId };
    }
  }

  // Get user transaction history with filters (Search, Type, Date range, Pagination)
  static async getHistoryByAccountId(accountId, { search = '', type = '', startDate = '', endDate = '', page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let whereClauses = ['(t.sender_account_id = ? OR t.receiver_account_id = ?)'];
    let params = [accountId, accountId];

    if (search) {
      whereClauses.push('(t.transaction_id LIKE ? OR t.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type && type !== 'all') {
      whereClauses.push('t.type = ?');
      params.push(type);
    }

    if (startDate) {
      whereClauses.push('t.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      whereClauses.push('t.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereSql = whereClauses.join(' AND ');

    // Count Total
    const countSql = `SELECT COUNT(*) as total FROM transactions t WHERE ${whereSql}`;
    const countRows = await query(countSql, params);
    const totalRecords = countRows[0]?.total || 0;

    // Fetch Records with sender/receiver account info
    const dataSql = `
      SELECT t.*, 
             sa.account_number as sender_account_number, su.full_name as sender_name,
             ra.account_number as receiver_account_number, ru.full_name as receiver_name
      FROM transactions t
      LEFT JOIN accounts sa ON t.sender_account_id = sa.id
      LEFT JOIN users su ON sa.user_id = su.id
      LEFT JOIN accounts ra ON t.receiver_account_id = ra.id
      LEFT JOIN users ru ON ra.user_id = ru.id
      WHERE ${whereSql}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const records = await query(dataSql, [...params, Number(limit), Number(offset)]);

    return {
      transactions: records,
      pagination: {
        total: totalRecords,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalRecords / limit) || 1
      }
    };
  }

  // Get Analytics Chart Data (Monthly Income vs Expense)
  static async getMonthlyAnalytics(accountId) {
    const sql = `
      SELECT 
        DATE_FORMAT(created_at, '%b %Y') as month,
        SUM(CASE WHEN receiver_account_id = ? THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN sender_account_id = ? THEN amount ELSE 0 END) as total_expense
      FROM transactions
      WHERE (sender_account_id = ? OR receiver_account_id = ?)
        AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%b %Y'), YEAR(created_at), MONTH(created_at)
      ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC
    `;
    return await query(sql, [accountId, accountId, accountId, accountId]);
  }

  // Admin: Get all transactions across the platform
  static async getAllSystemTransactions(limit = 50) {
    const sql = `
      SELECT t.*, 
             sa.account_number as sender_account, su.full_name as sender_name,
             ra.account_number as receiver_account, ru.full_name as receiver_name
      FROM transactions t
      LEFT JOIN accounts sa ON t.sender_account_id = sa.id
      LEFT JOIN users su ON sa.user_id = su.id
      LEFT JOIN accounts ra ON t.receiver_account_id = ra.id
      LEFT JOIN users ru ON ra.user_id = ru.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `;
    return await query(sql, [limit]);
  }
}

module.exports = TransactionModel;
