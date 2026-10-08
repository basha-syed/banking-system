const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const UserModel = require('../models/userModel');
const AccountModel = require('../models/accountModel');
const OTPModel = require('../models/otpModel');
const NotificationModel = require('../models/notificationModel');

/**
 * Authentication Controller
 */

// Register user and send OTP
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, accountType } = req.body;

    // Check if email already registered
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userId = await UserModel.create({
      fullName,
      email,
      phone,
      passwordHash,
      role: 'user'
    });

    // Create bank account automatically
    const account = await AccountModel.createAccount(userId, accountType || 'savings', 1000.00);

    // Generate Registration OTP
    const otp = await OTPModel.createOTP(userId, 'registration');

    // Create welcome notification
    await NotificationModel.create(
      userId,
      'Welcome to Apex Bank',
      `Your digital ${account.account_type} account #${account.account_number} has been generated with a complimentary $1,000.00 starting balance.`
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify the OTP code sent to your registered contact.',
      data: {
        userId,
        email,
        accountNumber: account.account_number,
        otpCodeDemo: otp.code // Exposed for demo convenience
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify Registration OTP
exports.verifyOTP = async (req, res, next) => {
  try {
    const { userId, code, type = 'registration' } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ success: false, message: 'User ID and OTP code are required.' });
    }

    const isValid = await OTPModel.verifyOTP(userId, code, type);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    // Generate JWT token on successful OTP verification
    const user = await UserModel.findById(userId);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json({
      success: true,
      message: 'OTP verification successful! Welcome to Apex Bank.',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Login User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
    }

    if (user.is_blocked) {
      return res.status(403).json({ success: false, message: 'Your account is suspended. Please contact customer support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    // Fetch account details
    const account = await AccountModel.findByUserId(user.id);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profile_pic,
        account: account ? {
          accountNumber: account.account_number,
          accountType: account.account_type,
          balance: account.balance,
          status: account.status
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Forgot Password - Initiate OTP
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findByEmail(email);
    
    if (!user) {
      // Security standard: don't disclose whether user exists
      return res.json({ success: true, message: 'If an account matches that email, an OTP has been generated.' });
    }

    const otp = await OTPModel.createOTP(user.id, 'forgot_password');

    res.json({
      success: true,
      message: 'Password reset OTP generated.',
      data: {
        userId: user.id,
        otpCodeDemo: otp.code
      }
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password with OTP
exports.resetPassword = async (req, res, next) => {
  try {
    const { userId, code, newPassword } = req.body;

    if (!userId || !code || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Valid OTP code and new password (min 6 chars) are required.' });
    }

    const isValid = await OTPModel.verifyOTP(userId, code, 'forgot_password');
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await UserModel.updatePassword(userId, newPasswordHash);

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};
