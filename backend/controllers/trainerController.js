const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

exports.getTrainers = async (req, res) => {
    try {
        const [trainers] = await pool.query(`
            SELECT t.id, t.bio, t.specialty, t.monthly_price, t.rating, u.name, u.profile_image 
            FROM Trainers t
            JOIN Users u ON t.user_id = u.id
        `);
        res.json({ trainers });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching trainers', details: err.message });
    }
};

exports.subscribe = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { trainerId } = req.body;

        // Check if already subscribed to this or another trainer
        await pool.query('UPDATE Subscriptions SET is_active = FALSE WHERE client_id = ?', [clientId]);

        await pool.query(`
            INSERT INTO Subscriptions (client_id, trainer_id) VALUES (?, ?)
        `, [clientId, trainerId]);

        res.json({ message: 'Successfully subscribed to trainer!' });
    } catch (err) {
        res.status(500).json({ error: 'Server error subscribing to trainer', details: err.message });
    }
};

exports.getActiveSubscription = async (req, res) => {
    try {
        const clientId = req.user.id;
        const [subs] = await pool.query(`
            SELECT s.*, t.specialty, u.name as trainer_name, u.id as trainer_user_id
            FROM Subscriptions s
            JOIN Trainers t ON s.trainer_id = t.id
            JOIN Users u ON t.user_id = u.id
            WHERE s.client_id = ? AND s.is_active = TRUE
            LIMIT 1
        `, [clientId]);

        res.json({ subscription: subs.length > 0 ? subs[0] : null });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching subscription', details: err.message });
    }
};
