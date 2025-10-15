const Vehicle = require('../models/Vehicle.model');
const { body, validationResult } = require('express-validator');

/**
 * @route   POST /api/vehicles
 * @desc    Add a new vehicle
 * @access  Private
 */
exports.addVehicle = async (req, res, next) => {
  try {
    const { model, color, license_plate, total_seats } = req.body;
    const userId = req.user.id;

    // Validation
    if (!model || !color || !license_plate || !total_seats) {
      return res.status(400).json({
        status: 'fail',
        message: 'All fields are required (model, color, license_plate, total_seats)',
      });
    }

    // Validate seats range
    if (total_seats < 1 || total_seats > 8) {
      return res.status(400).json({
        status: 'fail',
        message: 'Total seats must be between 1 and 8',
      });
    }

    // Validate license plate format
    if (!/^[A-Z0-9\s]+$/i.test(license_plate)) {
      return res.status(400).json({
        status: 'fail',
        message: 'License plate must be alphanumeric',
      });
    }

    // Check if license plate already exists
    const exists = await Vehicle.checkLicensePlateExists(license_plate);
    if (exists) {
      return res.status(400).json({
        status: 'fail',
        message: 'License plate already registered',
      });
    }

    // Create vehicle
    const vehicleData = {
      user_id: userId,
      model: model.trim(),
      color: color.trim(),
      license_plate: license_plate.trim().toUpperCase(),
      total_seats: parseInt(total_seats),
    };

    const vehicle = await Vehicle.create(vehicleData);

    res.status(201).json({
      status: 'success',
      message: 'Vehicle added successfully',
      data: { vehicle },
    });
  } catch (error) {
    if (error.code === 'DUPLICATE_PLATE') {
      return res.status(400).json({
        status: 'fail',
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @route   GET /api/vehicles/my-vehicles
 * @desc    Get current user's vehicles
 * @access  Private
 */
exports.getMyVehicles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const vehicles = await Vehicle.findByUserId(userId);

    res.json({
      status: 'success',
      results: vehicles.length,
      data: { vehicles },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get single vehicle by ID
 * @access  Private
 */
exports.getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByIdWithUser(id);

    if (!vehicle) {
      return res.status(404).json({
        status: 'fail',
        message: 'Vehicle not found',
      });
    }

    res.json({
      status: 'success',
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Update vehicle
 * @access  Private (owner only)
 */
exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { model, color, total_seats, is_active } = req.body;

    // Validate if any update is provided
    if (!model && !color && !total_seats && is_active === undefined) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide at least one field to update',
      });
    }

    // Validate seats if provided
    if (total_seats !== undefined) {
      const seats = parseInt(total_seats);
      if (isNaN(seats) || seats < 1 || seats > 8) {
        return res.status(400).json({
          status: 'fail',
          message: 'Total seats must be between 1 and 8',
        });
      }
    }

    const updates = {};
    if (model) updates.model = model.trim();
    if (color) updates.color = color.trim();
    if (total_seats) updates.total_seats = parseInt(total_seats);
    if (is_active !== undefined) updates.is_active = is_active;

    const vehicle = await Vehicle.update(id, userId, updates);

    if (!vehicle) {
      return res.status(404).json({
        status: 'fail',
        message: 'Vehicle not found or unauthorized',
      });
    }

    res.json({
      status: 'success',
      message: 'Vehicle updated successfully',
      data: { vehicle },
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        status: 'fail',
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete vehicle
 * @access  Private (owner only)
 */
exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deletedVehicle = await Vehicle.delete(id, userId);

    if (!deletedVehicle) {
      return res.status(404).json({
        status: 'fail',
        message: 'Vehicle not found or unauthorized',
      });
    }

    res.json({
      status: 'success',
      message: 'Vehicle deleted successfully',
      data: { vehicle: deletedVehicle },
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        status: 'fail',
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @route   GET /api/vehicles
 * @desc    Get all active vehicles (for browsing)
 * @access  Private
 */
exports.getAllVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAllActive();

    res.json({
      status: 'success',
      results: vehicles.length,
      data: { vehicles },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/vehicles/count
 * @desc    Get user's vehicle count
 * @access  Private
 */
exports.getVehicleCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await Vehicle.countByUserId(userId);

    res.json({
      status: 'success',
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};
