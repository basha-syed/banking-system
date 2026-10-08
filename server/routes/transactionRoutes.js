const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/history', transactionController.getTransactionHistory);
router.get('/analytics', transactionController.getAnalytics);
router.get('/statement', transactionController.getStatementData);

module.exports = router;
