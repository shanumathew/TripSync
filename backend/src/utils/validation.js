const { body, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new AppError(errorMessages.join(', '), 400));
  }
  
  next();
}; 

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom((value) => {
      // Check if it's a university email (optional - customize as needed)
      if (!value.includes('university') && !value.includes('.edu')) {
        // Uncomment to enforce university emails only
        // throw new Error('Please use a university email address');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('university')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('University name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Phone number must be between 10 and 15 digits'),
  
  validate,
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate,
];

/**
 * Validation rules for password update
 */
const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  validate,
];

/**
 * Validation rules for profile update
 */
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Phone number must be between 10 and 15 digits'),
  
  body('university')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('University name must be between 2 and 100 characters'),
  
  validate,
];

/**
 * General email validation
 */
const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  updatePasswordValidation,
  updateProfileValidation,
  emailValidation,
};
