const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function updateDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        // 1. Create tables without the INSERT statement first, to avoid the column missing error.
        console.log('Creating tables...');
        const createTables = `
            CREATE TABLE IF NOT EXISTS Users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                age INT,
                weight DECIMAL(5,2),
                height DECIMAL(5,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS Exercises (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                muscle_group VARCHAR(100) NOT NULL,
                difficulty VARCHAR(50) NOT NULL,
                instructions TEXT
            );
            CREATE TABLE IF NOT EXISTS Workouts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                exercise_id INT NOT NULL,
                date DATE NOT NULL,
                sets INT NOT NULL,
                reps INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES Exercises(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS WorkoutPlans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                plan_name VARCHAR(255) NOT NULL,
                goal ENUM('hypertrophy', 'strength', 'endurance', 'weight_loss') NOT NULL,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS PlanExercises (
                id INT AUTO_INCREMENT PRIMARY KEY,
                plan_id INT NOT NULL,
                exercise_id INT NOT NULL,
                day_number INT NOT NULL,
                target_sets INT NOT NULL,
                target_reps INT NOT NULL,
                order_in_workout INT NOT NULL,
                FOREIGN KEY (plan_id) REFERENCES WorkoutPlans(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES Exercises(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS Achievements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                badge_name VARCHAR(100) NOT NULL,
                description TEXT,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                icon_class VARCHAR(50) DEFAULT 'fa-award',
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Trainers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                bio TEXT,
                specialty VARCHAR(255),
                monthly_price DECIMAL(6,2) DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 5.0,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                client_id INT NOT NULL,
                trainer_id INT NOT NULL,
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (client_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room VARCHAR(255) NOT NULL,
                sender_id INT NOT NULL,
                sender_name VARCHAR(255) DEFAULT 'User',
                message TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_room (room)
            );
        `;
        await connection.query(createTables);

        // 2. Alter existing tables to add missing columns
        const alterations = [
            "ALTER TABLE Users ADD COLUMN experience_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner';",
            "ALTER TABLE Users ADD COLUMN primary_goal ENUM('hypertrophy', 'strength', 'endurance', 'weight_loss') DEFAULT 'hypertrophy';",
            "ALTER TABLE Users ADD COLUMN profile_image LONGTEXT;",
            "ALTER TABLE Users ADD COLUMN role ENUM('user', 'trainer') DEFAULT 'user';",
            "ALTER TABLE Users ADD COLUMN xp INT DEFAULT 0;",
            "ALTER TABLE Users ADD COLUMN level INT DEFAULT 1;",
            "ALTER TABLE Exercises ADD COLUMN secondary_muscle VARCHAR(100);",
            "ALTER TABLE Exercises ADD COLUMN equipment_needed VARCHAR(100) DEFAULT 'None';",
            "ALTER TABLE Exercises ADD COLUMN video_url VARCHAR(255);",
            "ALTER TABLE Exercises MODIFY difficulty ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL;",
            "ALTER TABLE Workouts ADD COLUMN weight_used DECIMAL(6,2) DEFAULT 0;",
            "ALTER TABLE Workouts ADD COLUMN rpe INT CHECK (rpe BETWEEN 1 AND 10);",
            "ALTER TABLE Workouts ADD COLUMN rest_time_seconds INT DEFAULT 0;",
            "ALTER TABLE Users ADD COLUMN goal_weight DECIMAL(5,2) DEFAULT NULL;",
            "ALTER TABLE Subscriptions ADD COLUMN subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"
        ];

        for (const query of alterations) {
            try {
                await connection.query(query);
                console.log(`Executed: ${query}`);
            } catch (err) {
                console.log(`Skipped (might already exist): ${query} - Reason: ${err.message}`);
            }
        }

        // 3. Now run the full database.sql to insert the data safely
        console.log('Running database.sql to insert default data...');
        const sqlScript = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf-8');
        await connection.query(sqlScript);

        console.log('Database updated successfully for Crazy Workout App!');
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('Failed to update database: ', err.message);
        process.exit(1);
    }
}

updateDatabase();
