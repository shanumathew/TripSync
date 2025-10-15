const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

// ============================================
// PASSWORD HASHING
// ============================================

/**
 * Hash a plain text password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare plain text password with hashed password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if passwords match
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// ============================================
// JWT TOKEN GENERATION
// ============================================

/**
 * Generate JWT token for user
 * @param {object} payload - User data to encode in token
 * @returns {string} - JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generate auth response with user data and token
 * @param {object} user - User object from database
 * @returns {object} - Auth response object
 */
const generateAuthResponse = (user) => {
  // Remove sensitive data
  const userPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    university: user.university,
  };

  // Generate token
  const token = generateToken(userPayload);

  // Return user data and token
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      university: user.university,
      phone: user.phone,
      profile_picture: user.profile_picture,
      trust_score: user.trust_score,
      total_rides: user.total_rides,
      completed_rides: user.completed_rides,
      is_verified: user.is_verified,
      created_at: user.created_at,
    },
    token,
    expiresIn: config.jwt.expire,
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateAuthResponse,
};
