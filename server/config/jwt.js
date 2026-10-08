const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  secret: process.env.JWT_SECRET || 'fallback_apex_bank_secret_key_9988',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h'
};
