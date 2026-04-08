CREATE DATABASE IF NOT EXISTS fitness_db;
USE fitness_db;

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
    name VARCHAR(255) NOT NULL,
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

CREATE TABLE IF NOT EXISTS Progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    weight DECIMAL(5,2),
    calories INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Insert some default exercises
INSERT INTO Exercises (name, muscle_group, difficulty, instructions)
VALUES 
('Push-ups', 'Chest', 'Beginner', 'Keep your back straight and lower your body until your chest nearly touches the floor.'),
('Squats', 'Legs', 'Beginner', 'Lower your hips down and back as if you were sitting in a chair.'),
('Pull-ups', 'Back', 'Intermediate', 'Pull your body up until your chin is over the bar.'),
('Plank', 'Core', 'Beginner', 'Hold a push-up position, resting your forearms on the ground.'),
('Deadlift', 'Legs/Back', 'Advanced', 'Lift a loaded barbell off the ground to the hips, then lower it back down.'),
('Bench Press', 'Chest', 'Intermediate', 'Lie back on a bench, lower barbell to chest level, then press upwards.')
ON DUPLICATE KEY UPDATE name=name;
