const express = require('express');
const router = express.Router();
const generatorController = require('../controllers/generatorController');
const { protect: auth } = require('../middleware/authMiddleware');

// Generate a new workout plan based on goals
router.post('/generate', auth, generatorController.generatePlan);

// Get the user's active workout plan
router.get('/active', auth, generatorController.getActivePlan);

module.exports = router;
