// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');

// const SECRET =
//   process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// exports.sign = (payload) =>
//   jwt.sign(payload, SECRET, { expiresIn: '7d' });

// exports.verify = (token) =>
//   jwt.verify(token, SECRET);
const jwt = require('jsonwebtoken');

const SECRET =
  process.env.JWT_SECRET || 'dev-insecure-secret-change-me';


if (!SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

exports.sign = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: '7d' });

exports.verify = (token) =>
  jwt.verify(token, SECRET);
