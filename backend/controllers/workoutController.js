const pool = require('../config/db');

const getWorkouts = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT w.id, w.date, w.sets, w.reps, e.name as exercise_name, e.muscle_group 
            FROM Workouts w
            JOIN Exercises e ON w.exercise_id = e.id
            WHERE w.user_id = ?
            ORDER BY w.date DESC
        `;
        const [workouts] = await pool.query(query, [userId]);
        res.json(workouts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching workouts' });
    }
};

const gamificationController = require('./gamificationController');

const addWorkout = async (req, res) => {
    try {
        const { exercise_id, date, sets, reps, weight_used, rpe, rest_time_seconds } = req.body;
        const userId = req.user.id;

        if (!exercise_id || !date || !sets || !reps) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const [result] = await pool.query(
            'INSERT INTO Workouts (user_id, exercise_id, date, sets, reps, weight_used, rpe, rest_time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, exercise_id, date, sets, reps, weight_used || 0, rpe || null, rest_time_seconds || 0]
        );

        // Award 50 XP per workout log
        await gamificationController.awardXP(userId, 50);

        res.status(201).json({ message: 'Workout added successfully', workoutId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error adding workout' });
    }
};

const deleteWorkout = async (req, res) => {
    try {
        const userId = req.user.id;
        const workoutId = req.params.id;

        const [result] = await pool.query('DELETE FROM Workouts WHERE id = ? AND user_id = ?', [workoutId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Workout not found or unauthorized' });
        }

        res.json({ message: 'Workout removed', id: workoutId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting workout' });
    }
}

module.exports = { getWorkouts, addWorkout, deleteWorkout };
