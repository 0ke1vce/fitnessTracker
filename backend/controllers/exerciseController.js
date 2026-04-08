const pool = require('../config/db');

const getExercises = async (req, res) => {
    try {
        const [exercises] = await pool.query('SELECT * FROM Exercises');
        res.json(exercises);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching exercises' });
    }
};

module.exports = { getExercises };
