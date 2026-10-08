const UserModel = require('../models/userModel');
const AccountModel = require('../models/accountModel');
const TransactionModel = require('../models/transactionModel');
const { query } = require('../config/db');

/**
 * Admin Operations Controller
 */

// Get system dashboard metrics
exports.getSystemMetrics = async (req, res, next) => {
  try {
    const userCountRows = await query('SELECT COUNT(*) as total FROM users WHERE role = "user"');
    const totalBalanceRows = await query('SELECT SUM(balance) as total_deposits FROM accounts WHERE status = "active"');
    const transactionCountRows = await query('SELECT COUNT(*) as total, SUM(amount) as total_volume FROM transactions WHERE status = "completed"');

    res.json({
      success: true,
      metrics: {
        totalUsers: userCountRows[0]?.total || 0,
        totalDeposits: parseFloat(totalBalanceRows[0]?.total_deposits || 0),
        totalTransactions: transactionCountRows[0]?.total || 0,
        totalVolume: parseFloat(transactionCountRows[0]?.total_volume || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await UserModel.getAllUsers();
    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

// Toggle user block / unblock status
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { block } = req.body; // true = block, false = unblock

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot block system administrator account.' });
    }

    // Toggle user block status
    await UserModel.setBlockedStatus(userId, block);

    // Toggle account status
    const account = await AccountModel.findByUserId(userId);
    if (account) {
      await AccountModel.updateStatus(account.id, block ? 'blocked' : 'active');
    }

    // Log admin action
    await query('INSERT INTO admin_logs (admin_id, action, target_user_id) VALUES (?, ?, ?)', [
      req.user.id,
      `${block ? 'Blocked' : 'Unblocked'} account for user ${targetUser.full_name} (${targetUser.email})`,
      userId
    ]);

    res.json({
      success: true,
      message: `User ${targetUser.full_name} has been ${block ? 'blocked' : 'unblocked'} successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// Get all system transactions
exports.getSystemTransactions = async (req, res, next) => {
  try {
    const transactions = await TransactionModel.getAllSystemTransactions(100);
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    next(error);
  }
};
