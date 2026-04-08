const pool = require('../config/db');

const getProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const [progress] = await pool.query('SELECT * FROM Progress WHERE user_id = ? ORDER BY date DESC', [userId]);
        res.json(progress);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching progress' });
    }
};

const addProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date, weight, calories, notes } = req.body;

        if (!date) {
            return res.status(400).json({ message: 'Please provide a date' });
        }

        const [result] = await pool.query(
            'INSERT INTO Progress (user_id, date, weight, calories, notes) VALUES (?, ?, ?, ?, ?)',
            [userId, date, weight || null, calories || null, notes || null]
        );

        res.status(201).json({ id: result.insertId, user_id: userId, date, weight, calories, notes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error adding progress' });
    }
};

const deleteProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const progressId = req.params.id;

        const [result] = await pool.query('DELETE FROM Progress WHERE id = ? AND user_id = ?', [progressId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Progress record not found or unauthorized' });
        }

        res.json({ message: 'Progress record removed', id: progressId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting progress' });
    }
}

module.exports = { getProgress, addProgress, deleteProgress };
