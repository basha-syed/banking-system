const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validateMiddleware');

// Public Auth Endpoints
router.post('/register', validateRegistration, authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
