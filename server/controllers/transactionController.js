const TransactionModel = require('../models/transactionModel');
const AccountModel = require('../models/accountModel');

/**
 * Transaction History & Analytics Controller
 */

// Get user transaction history with filters & pagination
exports.getTransactionHistory = async (req, res, next) => {
  try {
    const { search, type, startDate, endDate, page = 1, limit = 10 } = req.query;

    const account = await AccountModel.findByUserId(req.user.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const history = await TransactionModel.getHistoryByAccountId(account.id, {
      search,
      type,
      startDate,
      endDate,
      page,
      limit
    });

    res.json({
      success: true,
      data: history.transactions,
      pagination: history.pagination,
      accountSummary: {
        accountNumber: account.account_number,
        accountType: account.account_type,
        currentBalance: parseFloat(account.balance)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get monthly transaction analytics for Chart.js
exports.getAnalytics = async (req, res, next) => {
  try {
    const account = await AccountModel.findByUserId(req.user.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const monthlyData = await TransactionModel.getMonthlyAnalytics(account.id);

    // Format for Chart.js datasets
    const labels = monthlyData.map(row => row.month);
    const incomeData = monthlyData.map(row => parseFloat(row.total_income || 0));
    const expenseData = monthlyData.map(row => parseFloat(row.total_expense || 0));

    res.json({
      success: true,
      analytics: {
        labels,
        datasets: [
          {
            label: 'Money In ($)',
            data: incomeData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)'
          },
          {
            label: 'Money Out ($)',
            data: expenseData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.15)'
          }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Statement Data for Client-Side PDF Generation
exports.getStatementData = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const account = await AccountModel.findByUserId(req.user.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const history = await TransactionModel.getHistoryByAccountId(account.id, {
      startDate,
      endDate,
      page: 1,
      limit: 1000 // Get all transactions for statement
    });

    res.json({
      success: true,
      statement: {
        accountNumber: account.account_number,
        accountType: account.account_type,
        currentBalance: parseFloat(account.balance),
        customerName: req.user.name,
        email: req.user.email,
        generatedAt: new Date().toISOString(),
        transactions: history.transactions
      }
    });
  } catch (error) {
    next(error);
  }
};
