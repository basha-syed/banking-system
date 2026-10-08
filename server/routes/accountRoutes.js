const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateAmount, validateTransfer } = require('../middleware/validateMiddleware');

// All account routes require valid JWT token
router.use(authenticateToken);

router.get('/details', accountController.getAccountDetails);
router.get('/verify-beneficiary/:accountNumber', accountController.verifyBeneficiary);
router.post('/deposit', validateAmount, accountController.deposit);
router.post('/withdraw', validateAmount, accountController.withdraw);
router.post('/request-otp', accountController.requestTransferOTP);
router.post('/transfer', validateTransfer, accountController.transfer);

module.exports = router;
