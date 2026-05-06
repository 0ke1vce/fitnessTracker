const express = require('express');
const router = express.Router();
const { trainerRegister, trainerLogin, getMyClients, getTrainerProfile } = require('../controllers/trainerAuthController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', trainerRegister);
router.post('/login', trainerLogin);
router.get('/clients', protect, getMyClients);
router.get('/me', protect, getTrainerProfile);

module.exports = router;
