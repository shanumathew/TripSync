const { verifyToken } = require('../utils/auth');
const { AppError } = require('./errorHandler');
const { User } = require('../models');

/**
 * Middleware to protect routes - requires valid JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(new AppError('Not authorized. Please login.', 401));
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database (exclude password)
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    // Check if user is active
    if (!user.is_active) {
      return next(new AppError('User account is deactivated', 401));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      return next(new AppError('Invalid or expired token. Please login again.', 401));
    }
    return next(new AppError('Authentication failed', 401));
  }
};

/**
 * Middleware to check if user is verified
 */
const requireVerified = (req, res, next) => {
  if (!req.user.is_verified) {
    return next(new AppError('Please verify your email to access this feature', 403));
  }
  next();
};

/**
 * Middleware to check if user owns the resource
 * @param {string} resourceUserIdField - Field name containing user ID (e.g., 'user_id')
 */
const authorize = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      return next(new AppError('Resource user ID not found', 400));
    }

    if (parseInt(resourceUserId) !== req.user.id) {
      return next(new AppError('Not authorized to access this resource', 403));
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for public routes that might have additional features for logged-in users
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      
      if (user && user.is_active) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }
  next();
};

module.exports = {
  protect,
  requireVerified,
  authorize,
  optionalAuth,
};
