const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

exports.getGamificationStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch XP and Level
        const [users] = await pool.query('SELECT xp, level FROM Users WHERE id = ?', [userId]);
        
        // Fetch Badges
        const [badges] = await pool.query('SELECT badge_name, description, icon_class FROM Achievements WHERE user_id = ? ORDER BY earned_at DESC', [userId]);

        res.json({
            xp: users[0].xp,
            level: users[0].level,
            badges: badges
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching gamification stats', details: err.message });
    }
};

// Helper function to award XP (to be called from workoutController)
exports.awardXP = async (userId, xpAmount) => {
    try {
        const [users] = await pool.query('SELECT xp, level FROM Users WHERE id = ?', [userId]);
        if (users.length === 0) return;

        let currentXp = users[0].xp + xpAmount;
        let currentLevel = users[0].level;
        
        // Simple level up curve: 100 * level
        let xpNeeded = 100 * currentLevel;
        let leveledUp = false;

        while (currentXp >= xpNeeded) {
            currentXp -= xpNeeded;
            currentLevel++;
            leveledUp = true;
            xpNeeded = 100 * currentLevel;
        }

        await pool.query('UPDATE Users SET xp = ?, level = ? WHERE id = ?', [currentXp, currentLevel, userId]);

        if (leveledUp) {
            // Award a badge for leveling up
            await pool.query('INSERT INTO Achievements (user_id, badge_name, description, icon_class) VALUES (?, ?, ?, ?)', [
                userId,
                `Level ${currentLevel} Achieved`,
                `You reached Level ${currentLevel}!`,
                'fa-crown'
            ]);
        }

        return { leveledUp, newLevel: currentLevel };
    } catch(err) {
        console.error('Error awarding XP:', err);
    }
};
