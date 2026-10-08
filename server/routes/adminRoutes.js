const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// All Admin routes require JWT authentication + Admin role
router.use(authenticateToken, requireAdmin);

router.get('/metrics', adminController.getSystemMetrics);
router.get('/users', adminController.getAllUsers);
router.post('/users/:userId/block', adminController.toggleBlockUser);
router.get('/transactions', adminController.getSystemTransactions);

module.exports = router;
