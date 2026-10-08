const { getConnection } = require('../config/db');
const AccountModel = require('../models/accountModel');
const TransactionModel = require('../models/transactionModel');
const NotificationModel = require('../models/notificationModel');
const OTPModel = require('../models/otpModel');

/**
 * Account Operations Controller
 */

// Get current user account details
exports.getAccountDetails = async (req, res, next) => {
  try {
    const account = await AccountModel.findByUserId(req.user.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'No active bank account found.' });
    }

    res.json({
      success: true,
      account: {
        id: account.id,
        accountNumber: account.account_number,
        accountType: account.account_type,
        balance: parseFloat(account.balance),
        status: account.status,
        createdAt: account.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify recipient account details before money transfer
exports.verifyBeneficiary = async (req, res, next) => {
  try {
    const { accountNumber } = req.params;

    const account = await AccountModel.getAccountWithUser(accountNumber);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Beneficiary account number not found.' });
    }

    if (account.status !== 'active' || account.user_blocked) {
      return res.status(400).json({ success: false, message: 'Beneficiary account is inactive or suspended.' });
    }

    res.json({
      success: true,
      beneficiary: {
        accountNumber: account.account_number,
        accountType: account.account_type,
        ownerName: account.full_name
      }
    });
  } catch (error) {
    next(error);
  }
};

// Deposit funds
exports.deposit = async (req, res, next) => {
  try {
    const { amount, description } = req.body;
    const userId = req.user.id;

    const account = await AccountModel.findByUserId(userId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (account.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is inactive or blocked.' });
    }

    // Update account balance
    await AccountModel.updateBalance(account.id, amount);

    // Record transaction
    const tx = await TransactionModel.create({
      senderAccountId: null,
      receiverAccountId: account.id,
      type: 'deposit',
      amount,
      description: description || 'Self Cash/Check Deposit',
      status: 'completed'
    });

    // Send notification
    await NotificationModel.create(
      userId,
      'Deposit Successful',
      `$${amount.toFixed(2)} has been credited to your account #${account.account_number}.`
    );

    const updatedAccount = await AccountModel.findByUserId(userId);

    res.json({
      success: true,
      message: `Successfully deposited $${amount.toFixed(2)}.`,
      transactionId: tx.transactionId,
      newBalance: parseFloat(updatedAccount.balance)
    });
  } catch (error) {
    next(error);
  }
};

// Withdraw funds
exports.withdraw = async (req, res, next) => {
  try {
    const { amount, description } = req.body;
    const userId = req.user.id;

    const account = await AccountModel.findByUserId(userId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (account.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is inactive or blocked.' });
    }

    const currentBalance = parseFloat(account.balance);
    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Your current balance is $${currentBalance.toFixed(2)}.`
      });
    }

    // Update balance (deduct)
    await AccountModel.updateBalance(account.id, -amount);

    // Record transaction
    const tx = await TransactionModel.create({
      senderAccountId: account.id,
      receiverAccountId: null,
      type: 'withdraw',
      amount,
      description: description || 'ATM Cash Withdrawal',
      status: 'completed'
    });

    // Send notification
    await NotificationModel.create(
      userId,
      'Withdrawal Alert',
      `$${amount.toFixed(2)} was debited from your account #${account.account_number}.`
    );

    const updatedAccount = await AccountModel.findByUserId(userId);

    res.json({
      success: true,
      message: `Successfully withdrew $${amount.toFixed(2)}.`,
      transactionId: tx.transactionId,
      newBalance: parseFloat(updatedAccount.balance)
    });
  } catch (error) {
    next(error);
  }
};

// Initiate Transfer (Generates Transfer Security OTP)
exports.requestTransferOTP = async (req, res, next) => {
  try {
    const otp = await OTPModel.createOTP(req.user.id, 'transfer');
    res.json({
      success: true,
      message: 'Transfer security OTP code generated.',
      data: { otpCodeDemo: otp.code }
    });
  } catch (error) {
    next(error);
  }
};

// Execute Money Transfer with ACID MySQL Transaction
exports.transfer = async (req, res, next) => {
  let connection = null;
  try {
    const { receiverAccountNumber, amount, description, otpCode } = req.body;
    const senderUserId = req.user.id;

    // Optional OTP verification for high security transfers
    if (otpCode) {
      const isValidOTP = await OTPModel.verifyOTP(senderUserId, otpCode, 'transfer');
      if (!isValidOTP) {
        return res.status(400).json({ success: false, message: 'Invalid or expired transfer OTP code.' });
      }
    }

    // 1. Fetch Sender Account
    const senderAccount = await AccountModel.findByUserId(senderUserId);
    if (!senderAccount) {
      return res.status(404).json({ success: false, message: 'Sender account not found.' });
    }

    if (senderAccount.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is suspended.' });
    }

    // 2. Prevent self-transfer
    if (senderAccount.account_number === receiverAccountNumber) {
      return res.status(400).json({ success: false, message: 'Cannot transfer money to your own account.' });
    }

    // 3. Check sender balance
    const senderBalance = parseFloat(senderAccount.balance);
    if (senderBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance for transfer. Available: $${senderBalance.toFixed(2)}.`
      });
    }

    // 4. Fetch Receiver Account
    const receiverAccount = await AccountModel.getAccountWithUser(receiverAccountNumber);
    if (!receiverAccount) {
      return res.status(404).json({ success: false, message: 'Recipient account number does not exist.' });
    }

    if (receiverAccount.status !== 'active' || receiverAccount.user_blocked) {
      return res.status(400).json({ success: false, message: 'Recipient account is blocked or inactive.' });
    }

    // 5. Start MySQL Transaction
    connection = await getConnection();
    await connection.beginTransaction();

    // Deduct from sender
    await AccountModel.updateBalance(senderAccount.id, -amount, connection);

    // Credit to receiver
    await AccountModel.updateBalance(receiverAccount.id, amount, connection);

    // Record Transaction
    const tx = await TransactionModel.create({
      senderAccountId: senderAccount.id,
      receiverAccountId: receiverAccount.id,
      type: 'transfer',
      amount,
      description: description || `Transfer to ${receiverAccount.full_name} (${receiverAccountNumber})`,
      status: 'completed'
    }, connection);

    // Commit Transaction
    await connection.commit();
    connection.release();
    connection = null;

    // Send Notifications to both Sender and Receiver
    await NotificationModel.create(
      senderUserId,
      'Money Sent',
      `Sent $${amount.toFixed(2)} to ${receiverAccount.full_name} (${receiverAccountNumber}). Ref: ${tx.transactionId}`
    );

    await NotificationModel.create(
      receiverAccount.user_id,
      'Money Received',
      `Received $${amount.toFixed(2)} from ${req.user.name || 'Apex Customer'}. Ref: ${tx.transactionId}`
    );

    const updatedSender = await AccountModel.findByUserId(senderUserId);

    res.json({
      success: true,
      message: `Successfully transferred $${amount.toFixed(2)} to ${receiverAccount.full_name}.`,
      transactionId: tx.transactionId,
      newBalance: parseFloat(updatedSender.balance)
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    next(error);
  }
};
