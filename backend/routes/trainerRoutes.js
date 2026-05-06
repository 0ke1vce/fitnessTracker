const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, trainerController.getTrainers);
router.post('/subscribe', protect, trainerController.subscribe);
router.get('/subscription', protect, trainerController.getActiveSubscription);

module.exports = router;
