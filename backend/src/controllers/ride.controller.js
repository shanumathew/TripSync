const Ride = require('../models/Ride.model');
const { parseRideIntent, validateParsedData } = require('../services/nlp.service');

/**
 * @route   POST /api/rides
 * @desc    Create a new ride with NLP parsing
 * @access  Private
 */
exports.createRide = async (req, res, next) => {
  try {
    const { text, fromLocation, toLocation, departureTime, seats } = req.body;
    const userId = req.user.id;

    // If text is provided, use NLP parsing
    if (text) {
      // Parse the natural language text
      const parsedResult = parseRideIntent(text);

      if (!parsedResult.success) {
        return res.status(400).json({
          status: 'fail',
          message: 'Failed to parse ride intent',
          error: parsedResult.error
        });
      }

      // Validate parsed data
      const validation = validateParsedData(parsedResult);
      
      if (!validation.isValid) {
        return res.status(400).json({
          status: 'fail',
          message: 'Could not extract enough information from text',
          errors: validation.errors,
          parsedData: parsedResult.data,
          suggestions: [
            'Try including a specific location (e.g., "airport", "downtown", "campus")',
            'Add a time (e.g., "tomorrow at 3pm", "Friday morning")',
            'Use clear direction words (e.g., "going to", "coming from")'
          ]
        });
      }

      // Create ride with parsed data
      const rideData = {
        user_id: userId,
        raw_message: text,
        origin: parsedResult.data.origin || fromLocation || null,
        destination: parsedResult.data.destination || toLocation || 'Not specified',
        ride_time: parsedResult.data.departureTime || departureTime || new Date().toISOString(),
        direction: parsedResult.data.direction || 'going_to',
        seats_available: seats || parsedResult.data.passengers || 1,
        status: 'active'
      };

      // Ensure required fields are present
      if (!rideData.destination || !rideData.ride_time) {
        return res.status(400).json({
          status: 'fail',
          message: 'Missing required fields: destination and ride_time',
          parsedData: parsedResult.data
        });
      }

      const ride = await Ride.create(rideData);

      return res.status(201).json({
        status: 'success',
        message: 'Ride created successfully',
        data: {
          ride,
          parsed: parsedResult.data,
          confidence: parsedResult.data.confidence
        }
      });
    }

    // Manual ride creation (no NLP)
    if (!fromLocation || !toLocation || !departureTime) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide either text for NLP parsing or manual ride details (fromLocation, toLocation, departureTime)'
      });
    }

    const rideData = {
      user_id: userId,
      raw_message: `Manual ride: ${fromLocation} to ${toLocation}`,
      origin: fromLocation,
      destination: toLocation,
      ride_time: departureTime,
      seats_available: seats || 1,
      status: 'active'
    };

    const ride = await Ride.create(rideData);

    res.status(201).json({
      status: 'success',
      message: 'Ride created successfully',
      data: { ride }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rides
 * @desc    Get all rides with filters
 * @access  Private
 */
exports.getAllRides = async (req, res, next) => {
  try {
    const { status, direction, fromDate, toDate, limit = 50 } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (direction) filters.direction = direction;

    const rides = await Ride.findAll(filters, limit);

    res.json({
      status: 'success',
      results: rides.length,
      data: { rides }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rides/my-rides
 * @desc    Get current user's rides
 * @access  Private
 */
exports.getMyRides = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rides = await Ride.findByUserId(userId);

    res.json({
      status: 'success',
      results: rides.length,
      data: { rides }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rides/:id
 * @desc    Get ride by ID
 * @access  Private
 */
exports.getRideById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }

    res.json({
      status: 'success',
      data: { ride }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/rides/:id
 * @desc    Update ride
 * @access  Private (owner only)
 */
exports.updateRide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Check if ride exists and belongs to user
    const ride = await Ride.findById(id);
    
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }

    if (ride.user_id !== userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only update your own rides'
      });
    }

    const updatedRide = await Ride.update(id, updates);

    res.json({
      status: 'success',
      message: 'Ride updated successfully',
      data: { ride: updatedRide }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/rides/:id
 * @desc    Delete ride (soft delete - set status to cancelled)
 * @access  Private (owner only)
 */
exports.deleteRide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if ride exists and belongs to user
    const ride = await Ride.findById(id);
    
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }

    if (ride.user_id !== userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only delete your own rides'
      });
    }

    // Soft delete - update status to cancelled
    await Ride.update(id, { status: 'cancelled' });

    res.json({
      status: 'success',
      message: 'Ride cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/rides/search
 * @desc    Search rides with filters
 * @access  Private
 */
exports.searchRides = async (req, res, next) => {
  try {
    const filters = req.body;
    const rides = await Ride.search(filters);

    res.json({
      status: 'success',
      results: rides.length,
      data: { rides }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/rides/parse-test
 * @desc    Test NLP parsing without creating ride
 * @access  Private
 */
exports.testParsing = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide text to parse'
      });
    }

    const parsedResult = parseRideIntent(text);
    const validation = validateParsedData(parsedResult);

    res.json({
      status: 'success',
      data: {
        parsed: parsedResult,
        validation,
        suggestions: !validation.isValid ? [
          'Try including a specific location',
          'Add a time or date',
          'Use clear direction words'
        ] : []
      }
    });
  } catch (error) {
    next(error);
  }
};
