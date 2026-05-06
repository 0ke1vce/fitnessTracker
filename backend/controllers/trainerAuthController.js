const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

// Register as a trainer (creates User + Trainer record)
exports.trainerRegister = async (req, res) => {
    try {
        const { name, email, password, specialty, bio, monthly_price } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });

        const [existing] = await pool.query('SELECT id FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

        const hashed = await bcrypt.hash(password, 12);
        const [userResult] = await pool.query(
            'INSERT INTO Users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashed]
        );
        const userId = userResult.insertId;

        await pool.query(
            'INSERT INTO Trainers (user_id, specialty, bio, monthly_price, rating) VALUES (?, ?, ?, ?, ?)',
            [userId, specialty || 'General Fitness', bio || '', monthly_price || 29.99, 5.0]
        );

        const [trainerRow] = await pool.query('SELECT id FROM Trainers WHERE user_id = ?', [userId]);

        const token = jwt.sign({ id: userId, name, email, role: 'trainer', trainerId: trainerRow[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: userId, name, email, role: 'trainer', trainerId: trainerRow[0].id } });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// Trainer login
exports.trainerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query('SELECT u.*, t.id as trainerId FROM Users u JOIN Trainers t ON t.user_id = u.id WHERE u.email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, name: user.name, email, role: 'trainer', trainerId: user.trainerId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email, role: 'trainer', trainerId: user.trainerId } });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// Get trainer's subscribed clients
exports.getMyClients = async (req, res) => {
    try {
        const trainerId = req.user.trainerId;
        const [clients] = await pool.query(`
            SELECT u.id, u.name, u.email, u.weight, u.created_at,
                   s.id as subscription_id, s.subscribed_at
            FROM Subscriptions s
            JOIN Users u ON s.client_id = u.id
            WHERE s.trainer_id = ? AND s.is_active = TRUE
        `, [trainerId]);
        res.json({ clients });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// Get trainer profile
exports.getTrainerProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(`
            SELECT t.*, u.name, u.email, u.profile_image
            FROM Trainers t JOIN Users u ON t.user_id = u.id
            WHERE t.user_id = ?
        `, [userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Trainer not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};
