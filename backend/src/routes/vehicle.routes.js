const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   POST /api/vehicles
// @desc    Add a new vehicle
// @access  Private
router.post('/', vehicleController.addVehicle);

// @route   GET /api/vehicles/my-vehicles
// @desc    Get current user's vehicles
// @access  Private
// NOTE: This must come before /:id route
router.get('/my-vehicles', vehicleController.getMyVehicles);

// @route   GET /api/vehicles/count
// @desc    Get user's vehicle count
// @access  Private
router.get('/count', vehicleController.getVehicleCount);

// @route   GET /api/vehicles
// @desc    Get all active vehicles
// @access  Private
router.get('/', vehicleController.getAllVehicles);

// @route   GET /api/vehicles/:id
// @desc    Get single vehicle by ID
// @access  Private
router.get('/:id', vehicleController.getVehicleById);

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Private (owner only)
router.put('/:id', vehicleController.updateVehicle);

// @route   DELETE /api/vehicles/:id
// @desc    Delete vehicle
// @access  Private (owner only)
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
