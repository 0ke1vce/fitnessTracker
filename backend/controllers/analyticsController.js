const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

exports.getVolume = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(`
            SELECT 
                DATE(w.date) as date, 
                e.muscle_group, 
                SUM(w.sets * w.reps * w.weight_used) as volume
            FROM Workouts w
            JOIN Exercises e ON w.exercise_id = e.id
            WHERE w.user_id = ?
            GROUP BY date, e.muscle_group
            ORDER BY date ASC
        `, [userId]);

        res.json({ volume: rows });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching volume analytics', details: err.message });
    }
};

exports.getOneRepMax = async (req, res) => {
    try {
        const userId = req.user.id;
        // Brzycki formula: 1RM = Weight × (36 / (37 - Reps))
        // We only calculate this for sets where reps < 10 for better accuracy, and we pick the max 1RM per exercise per day
        const [rows] = await pool.query(`
            SELECT 
                DATE(w.date) as date, 
                e.name as exercise,
                MAX(w.weight_used * (36 / (37 - w.reps))) as estimated_1rm
            FROM Workouts w
            JOIN Exercises e ON w.exercise_id = e.id
            WHERE w.user_id = ? AND w.reps <= 12 AND w.weight_used > 0
            GROUP BY date, e.name
            ORDER BY date ASC
        `, [userId]);

        res.json({ onerm: rows });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching 1RM analytics', details: err.message });
    }
};
