const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Main init function
async function initDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        const sqlScript = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf-8');
        await connection.query(sqlScript);
        console.log('Database initialized successfully.');
        await connection.end();
    } catch (err) {
        console.error('Failed to initialize database: ', err.message);
    }
}

// Routes
const authRoutes = require('./routes/authRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const progressRoutes = require('./routes/progressRoutes');
const profileRoutes = require('./routes/profileRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/profile', profileRoutes);

const PORT = process.env.PORT || 5000;

initDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
