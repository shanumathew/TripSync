const express = require('express');
const router = express.Router();
const rideController = require('../controllers/ride.controller');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Ride CRUD operations
router.post('/', rideController.createRide);
router.get('/', rideController.getAllRides);
router.get('/my-rides', rideController.getMyRides);
router.post('/search', rideController.searchRides);
router.get('/:id', rideController.getRideById);
router.put('/:id', rideController.updateRide);
router.delete('/:id', rideController.deleteRide);

// NLP Testing endpoint
router.post('/parse-test', rideController.testParsing);

module.exports = router;
