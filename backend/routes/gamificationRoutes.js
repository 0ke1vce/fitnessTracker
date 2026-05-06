const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, gamificationController.getGamificationStats);

module.exports = router;
