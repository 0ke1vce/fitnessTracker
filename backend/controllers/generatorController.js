const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

exports.generatePlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { goal } = req.body; // 'hypertrophy', 'strength', 'endurance', 'weight_loss'

        // Deactivate old plans
        await pool.query(`UPDATE WorkoutPlans SET is_active = FALSE WHERE user_id = ?`, [userId]);

        // Create new plan
        const planName = `AI ${goal.charAt(0).toUpperCase() + goal.slice(1)} Program`;
        const [planResult] = await pool.query(`
            INSERT INTO WorkoutPlans (user_id, plan_name, goal)
            VALUES (?, ?, ?)
        `, [userId, planName, goal]);
        const planId = planResult.insertId;

        // Fetch exercises based on goal to build a template. Simple mock logic:
        const [exercises] = await pool.query(`SELECT id, muscle_group, name FROM Exercises`);
        
        let targetSets = 3;
        let targetReps = 10;
        if (goal === 'strength') { targetSets = 5; targetReps = 5; }
        if (goal === 'endurance' || goal === 'weight_loss') { targetSets = 3; targetReps = 15; }

        // Day 1: Push (Chest, Shoulders, Triceps)
        // Day 2: Pull (Back, Biceps)
        // Day 3: Legs
        const getEx = (muscle) => {
            const list = exercises.filter(e => e.muscle_group === muscle);
            return list.length > 0 ? list[Math.floor(Math.random() * list.length)] : exercises[0];
        };

        const planExercises = [
            // Day 1
            { day: 1, ex: getEx('Chest'), order: 1 },
            { day: 1, ex: getEx('Shoulders'), order: 2 },
            { day: 1, ex: getEx('Triceps'), order: 3 },
            // Day 2
            { day: 2, ex: getEx('Back'), order: 1 },
            { day: 2, ex: getEx('Back'), order: 2 },
            { day: 2, ex: getEx('Biceps'), order: 3 },
            // Day 3
            { day: 3, ex: getEx('Legs'), order: 1 },
            { day: 3, ex: getEx('Legs'), order: 2 },
            { day: 3, ex: getEx('Core'), order: 3 },
        ];

        for (const pe of planExercises) {
            await pool.query(`
                INSERT INTO PlanExercises (plan_id, exercise_id, day_number, target_sets, target_reps, order_in_workout)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [planId, pe.ex.id, pe.day, targetSets, targetReps, pe.order]);
        }

        res.json({ message: 'Plan generated successfully', planId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error generating plan', details: err.message });
    }
};

exports.getActivePlan = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [plans] = await pool.query(`SELECT * FROM WorkoutPlans WHERE user_id = ? AND is_active = TRUE LIMIT 1`, [userId]);
        
        if (plans.length === 0) {
            return res.json({ plan: null });
        }

        const plan = plans[0];
        const [exercises] = await pool.query(`
            SELECT pe.*, e.name, e.muscle_group 
            FROM PlanExercises pe
            JOIN Exercises e ON pe.exercise_id = e.id
            WHERE pe.plan_id = ?
            ORDER BY pe.day_number, pe.order_in_workout
        `, [plan.id]);

        plan.exercises = exercises;
        res.json({ plan });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching plan', details: err.message });
    }
};
