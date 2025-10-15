const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  updatePasswordValidation,
} = require('../utils/validation');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user profile
 * @access  Private
 */
router.get('/me', protect, authController.getMe);

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Update user profile information
 * @access  Private
 */
router.put('/update-profile', protect, updateProfileValidation, authController.updateProfile);

/**
 * @route   PUT /api/auth/update-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/update-password', protect, updatePasswordValidation, authController.updatePassword);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email address
 * @access  Private
 */
router.post('/verify-email', protect, authController.verifyEmail);

/**
 * @route   DELETE /api/auth/deactivate
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete('/deactivate', protect, authController.deactivateAccount);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (informational - actual logout is client-side)
 * @access  Private
 */
router.post('/logout', protect, authController.logout);

/**
 * @route   PUT /api/auth/toggle-driver
 * @desc    Toggle driver mode on/off
 * @access  Private
 */
router.put('/toggle-driver', protect, authController.toggleDriverMode);

module.exports = router;
