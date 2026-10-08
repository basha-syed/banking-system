/**
 * Input Sanitization & Validation Middleware
 */

const validateRegistration = (req, res, next) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || fullName.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Full name must be at least 3 characters long.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  if (!phone || phone.trim().length < 7) {
    return res.status(400).json({ success: false, message: 'Please provide a valid phone number.' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  next();
};

const validateAmount = (req, res, next) => {
  const { amount } = req.body;

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number greater than 0.' });
  }

  req.body.amount = numericAmount;
  next();
};

const validateTransfer = (req, res, next) => {
  const { receiverAccountNumber, amount } = req.body;

  if (!receiverAccountNumber || receiverAccountNumber.trim().length < 6) {
    return res.status(400).json({ success: false, message: 'Valid recipient account number is required.' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Transfer amount must be a positive number.' });
  }

  req.body.amount = numericAmount;
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateAmount,
  validateTransfer
};
