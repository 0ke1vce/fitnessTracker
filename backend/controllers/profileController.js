const pool = require('../config/db');

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.query('SELECT id, name, email, age, weight, height, goal_weight FROM Users WHERE id = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, age, weight, height, goal_weight } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const [result] = await pool.query(
            'UPDATE Users SET name = ?, age = ?, weight = ?, height = ?, goal_weight = ? WHERE id = ?',
            [name, age || null, weight || null, height || null, goal_weight || null, userId]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

module.exports = { getProfile, updateProfile };
