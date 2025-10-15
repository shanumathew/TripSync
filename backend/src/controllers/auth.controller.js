const { User } = require('../models');
const Vehicle = require('../models/Vehicle.model');
const { hashPassword, comparePassword, generateAuthResponse } = require('../utils/auth');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// ============================================
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// ============================================
const register = catchAsync(async (req, res, next) => {
  const { email, password, name, university, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const newUser = await User.create({
    email,
    password: hashedPassword,
    name,
    university,
    phone: phone || null,
  });

  // Generate auth response with token
  const authResponse = generateAuthResponse(newUser);

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: authResponse,
  });
});

// ============================================
// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
// ============================================
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findByEmail(email);

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if user is active
  if (!user.is_active) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  // Compare passwords
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Generate auth response with token
  const authResponse = generateAuthResponse(user);

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: authResponse,
  });
});

// ============================================
// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
// ============================================
const getMe = catchAsync(async (req, res, next) => {
  // User is already attached to req by protect middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
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
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    },
  });
});

// ============================================
// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
// ============================================
const updateProfile = catchAsync(async (req, res, next) => {
  const { name, phone, university } = req.body;

  // Build update object with only provided fields
  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (university) updateData.university = university;

  // Update user
  const updatedUser = await User.update(req.user.id, updateData);

  if (!updatedUser) {
    return next(new AppError('Failed to update profile', 400));
  }

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: updatedUser,
    },
  });
});

// ============================================
// @route   PUT /api/auth/update-password
// @desc    Update user password
// @access  Private
// ============================================
const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findByEmail(req.user.email);

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await User.updatePassword(req.user.id, hashedPassword);

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully',
  });
});

// ============================================
// @route   POST /api/auth/verify-email
// @desc    Verify user email (simplified - no email sending yet)
// @access  Private
// ============================================
const verifyEmail = catchAsync(async (req, res, next) => {
  const updatedUser = await User.verifyEmail(req.user.id);

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully',
    data: {
      user: updatedUser,
    },
  });
});

// ============================================
// @route   DELETE /api/auth/deactivate
// @desc    Deactivate user account (soft delete)
// @access  Private
// ============================================
const deactivateAccount = catchAsync(async (req, res, next) => {
  await User.softDelete(req.user.id);

  res.status(200).json({
    status: 'success',
    message: 'Account deactivated successfully',
  });
});

// ============================================
// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
// ============================================
const logout = catchAsync(async (req, res, next) => {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint is just for consistency
  res.status(200).json({
    status: 'success',
    message: 'Logout successful. Please remove token from client.',
  });
});

// ============================================
// @route   PUT /api/auth/toggle-driver
// @desc    Toggle driver mode (enable/disable)
// @access  Private
// ============================================
const toggleDriverMode = catchAsync(async (req, res, next) => {
  const { is_driver } = req.body;
  const userId = req.user.id;

  // Validate is_driver parameter
  if (typeof is_driver !== 'boolean') {
    return next(new AppError('is_driver must be a boolean value', 400));
  }

  // If enabling driver mode, check if user has at least one vehicle
  if (is_driver === true) {
    const vehicleCount = await Vehicle.countByUserId(userId);
    
    if (vehicleCount === 0) {
      return next(new AppError('You must add at least one vehicle before becoming a driver', 400));
    }
  }

  // Update user's driver status
  const updatedUser = await User.updateDriverStatus(userId, is_driver);

  if (!updatedUser) {
    return next(new AppError('Failed to update driver status', 500));
  }

  res.status(200).json({
    status: 'success',
    message: is_driver ? 'Driver mode enabled successfully' : 'Driver mode disabled successfully',
    data: {
      user: updatedUser,
    },
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  verifyEmail,
  deactivateAccount,
  logout,
  toggleDriverMode,
};
