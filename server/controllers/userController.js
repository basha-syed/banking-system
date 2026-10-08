const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const NotificationModel = require('../models/notificationModel');

/**
 * User Profile & Security Controller
 */

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Update profile details
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, profilePic } = req.body;

    if (!fullName || fullName.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Full name must be at least 3 characters long.' });
    }

    const updatedUser = await UserModel.updateProfile(req.user.id, {
      fullName,
      phone,
      profilePic
    });

    res.json({
      success: true,
      message: 'Profile details updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const userWithPass = await UserModel.findByIdWithPassword(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, userWithPass.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await UserModel.updatePassword(req.user.id, newPasswordHash);

    // Create security notification
    await NotificationModel.create(
      req.user.id,
      'Security Alert',
      'Your account password was updated successfully. If you did not request this change, please contact bank security immediately.'
    );

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Get notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await NotificationModel.getByUserId(req.user.id);
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// Mark notifications as read
exports.markNotificationsRead = async (req, res, next) => {
  try {
    await NotificationModel.markAllAsRead(req.user.id);
    res.json({
      success: true,
      message: 'Notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
};
