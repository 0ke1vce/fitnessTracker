const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect: auth } = require('../middleware/authMiddleware');

// Get volume/tonnage over time
router.get('/volume', auth, analyticsController.getVolume);

// Get 1RM estimations for key lifts
router.get('/onerm', auth, analyticsController.getOneRepMax);

module.exports = router;
