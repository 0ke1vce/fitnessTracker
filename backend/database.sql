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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    experience_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    primary_goal ENUM('hypertrophy', 'strength', 'endurance', 'weight_loss') DEFAULT 'hypertrophy'
);

CREATE TABLE IF NOT EXISTS Exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    muscle_group VARCHAR(100) NOT NULL,
    secondary_muscle VARCHAR(100),
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
    equipment_needed VARCHAR(100) DEFAULT 'None',
    instructions TEXT,
    video_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Workouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    exercise_id INT NOT NULL,
    date DATE NOT NULL,
    sets INT NOT NULL,
    reps INT NOT NULL,
    weight_used DECIMAL(6,2) DEFAULT 0, -- Weight used during the exercise
    rpe INT CHECK (rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion
    rest_time_seconds INT DEFAULT 0,
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
    day_number INT NOT NULL, -- E.g., Day 1, Day 2 of the routine
    target_sets INT NOT NULL,
    target_reps INT NOT NULL,
    order_in_workout INT NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES WorkoutPlans(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS Achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    icon_class VARCHAR(50) DEFAULT 'fa-award',
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Insert extensive default exercises
INSERT INTO Exercises (name, muscle_group, secondary_muscle, difficulty, equipment_needed, instructions)
VALUES 
('Push-ups', 'Chest', 'Triceps, Shoulders', 'Beginner', 'Bodyweight', 'Keep your back straight and lower your body until your chest nearly touches the floor.'),
('Squats', 'Legs', 'Glutes, Core', 'Beginner', 'Bodyweight', 'Lower your hips down and back as if you were sitting in a chair.'),
('Pull-ups', 'Back', 'Biceps', 'Intermediate', 'Pull-up Bar', 'Pull your body up until your chin is over the bar.'),
('Plank', 'Core', 'Shoulders', 'Beginner', 'Bodyweight', 'Hold a push-up position, resting your forearms on the ground.'),
('Deadlift', 'Back', 'Hamstrings, Glutes', 'Advanced', 'Barbell', 'Lift a loaded barbell off the ground to the hips, then lower it back down.'),
('Bench Press', 'Chest', 'Triceps, Shoulders', 'Intermediate', 'Barbell, Bench', 'Lie back on a bench, lower barbell to chest level, then press upwards.'),
('Overhead Press', 'Shoulders', 'Triceps', 'Intermediate', 'Dumbbells/Barbell', 'Press weight directly overhead until arms are extended.'),
('Barbell Row', 'Back', 'Biceps', 'Intermediate', 'Barbell', 'Hinge at the hips and pull the barbell to your lower chest.'),
('Lunges', 'Legs', 'Glutes', 'Beginner', 'Bodyweight/Dumbbells', 'Step forward and lower hips until both knees are bent at a 90-degree angle.'),
('Bicep Curls', 'Biceps', 'Forearms', 'Beginner', 'Dumbbells/Barbell', 'Curl weight towards shoulders while keeping elbows stationary.'),
('Tricep Extensions', 'Triceps', 'None', 'Beginner', 'Dumbbells/Cables', 'Extend arms overhead or downwards using resistance.'),
('Leg Press', 'Legs', 'Glutes, Quads', 'Beginner', 'Leg Press Machine', 'Push the platform away using your legs from a seated position.'),
('Leg Curl', 'Hamstrings', 'Calves', 'Beginner', 'Leg Curl Machine', 'Curl your legs towards your glutes while lying face down.'),
('Leg Extension', 'Quads', 'None', 'Beginner', 'Leg Extension Machine', 'Extend your legs fully from a seated position.'),
('Calf Raises', 'Calves', 'None', 'Beginner', 'Bodyweight/Machine', 'Rise up on the balls of your feet, then lower back down.'),
('Dumbbell Flyes', 'Chest', 'Shoulders', 'Intermediate', 'Dumbbells, Bench', 'Lie on a bench and arc dumbbells out and back together over chest.'),
('Incline Bench Press', 'Chest', 'Shoulders, Triceps', 'Intermediate', 'Barbell, Incline Bench', 'Press the barbell from an inclined bench targeting upper chest.'),
('Decline Bench Press', 'Chest', 'Triceps', 'Intermediate', 'Barbell, Decline Bench', 'Press the barbell from a declined bench targeting lower chest.'),
('Cable Crossover', 'Chest', 'Shoulders', 'Intermediate', 'Cable Machine', 'Pull cables from high to low across your body in an arc.'),
('Dips', 'Triceps', 'Chest, Shoulders', 'Intermediate', 'Parallel Bars', 'Lower yourself between parallel bars then press back up.'),
('Skull Crushers', 'Triceps', 'None', 'Intermediate', 'EZ Bar/Dumbbells', 'Lower the bar towards your forehead while lying on a bench.'),
('Hammer Curls', 'Biceps', 'Forearms, Brachialis', 'Beginner', 'Dumbbells', 'Curl dumbbells with a neutral hammer grip.'),
('Concentration Curls', 'Biceps', 'None', 'Beginner', 'Dumbbells', 'Curl a dumbbell while resting your elbow on your inner thigh.'),
('Face Pulls', 'Shoulders', 'Rear Delts, Traps', 'Beginner', 'Cable Machine', 'Pull the cable towards your face with elbows high.'),
('Lateral Raises', 'Shoulders', 'None', 'Beginner', 'Dumbbells', 'Raise dumbbells to the sides until arms are parallel to the floor.'),
('Front Raises', 'Shoulders', 'None', 'Beginner', 'Dumbbells/Barbell', 'Raise weight forward until arms are parallel to the floor.'),
('Upright Row', 'Shoulders', 'Traps, Biceps', 'Intermediate', 'Barbell/Cables', 'Pull the bar up along your body to chin height.'),
('Shrugs', 'Traps', 'None', 'Beginner', 'Barbell/Dumbbells', 'Shrug your shoulders upward as high as possible, hold, then release.'),
('Lat Pulldown', 'Back', 'Biceps', 'Beginner', 'Cable Machine', 'Pull a wide bar down to your upper chest from overhead.'),
('Seated Cable Row', 'Back', 'Biceps', 'Beginner', 'Cable Machine', 'Pull the cable handle to your lower chest while seated.'),
('T-Bar Row', 'Back', 'Biceps', 'Intermediate', 'T-Bar', 'Lift a barbell loaded on one end while straddling it.'),
('Romanian Deadlift', 'Hamstrings', 'Glutes, Back', 'Intermediate', 'Barbell/Dumbbells', 'Hinge at the hips while keeping your back flat, lowering weights.'),
('Hip Thrust', 'Glutes', 'Hamstrings', 'Beginner', 'Barbell, Bench', 'Drive hips upward with shoulders on a bench and weight on hips.'),
('Bulgarian Split Squat', 'Legs', 'Glutes', 'Intermediate', 'Dumbbells', 'Single leg squat with rear foot elevated on a bench.'),
('Box Jump', 'Legs', 'Core', 'Intermediate', 'Box/Platform', 'Jump explosively onto a raised platform, land softly.'),
('Mountain Climbers', 'Core', 'Shoulders, Legs', 'Beginner', 'Bodyweight', 'Drive alternating knees toward your chest in a plank position.'),
('Russian Twists', 'Core', 'Obliques', 'Beginner', 'Bodyweight/Plate', 'Rotate your torso side to side while holding your feet off the ground.'),
('Hanging Leg Raises', 'Core', 'Hip Flexors', 'Intermediate', 'Pull-up Bar', 'Hang from a bar and raise your legs until they are parallel to the floor.'),
('Ab Wheel Rollout', 'Core', 'Shoulders, Back', 'Advanced', 'Ab Wheel', 'Roll out from a kneeling position, extend fully then return.'),
('Burpees', 'Full Body', 'Core, Legs, Chest', 'Intermediate', 'Bodyweight', 'Drop into a push-up position, perform a push-up, then jump up.'),
('Jump Rope', 'Cardio', 'Calves, Shoulders', 'Beginner', 'Jump Rope', 'Jump continuously over a rotating rope.'),
('Treadmill Run', 'Cardio', 'Legs', 'Beginner', 'Treadmill', 'Run at a sustained pace on the treadmill.'),
('Cycling', 'Cardio', 'Legs', 'Beginner', 'Stationary Bike', 'Pedal at a steady pace on a stationary or road bike.'),
('Battle Ropes', 'Cardio', 'Shoulders, Core', 'Intermediate', 'Battle Ropes', 'Slam and wave heavy ropes in alternating arm movements.'),
('Kettlebell Swing', 'Full Body', 'Glutes, Hamstrings', 'Intermediate', 'Kettlebell', 'Swing the kettlebell between your legs then drive hips forward to swing it to shoulder height.'),
('Goblet Squat', 'Legs', 'Core', 'Beginner', 'Dumbbell/Kettlebell', 'Hold a weight at chest level and squat down, elbows inside knees.'),
('Arnold Press', 'Shoulders', 'Triceps', 'Intermediate', 'Dumbbells', 'Start with palms facing you, rotate outward as you press overhead.'),
('Close Grip Bench Press', 'Triceps', 'Chest', 'Intermediate', 'Barbell', 'Press the barbell with a narrow grip to emphasize triceps.'),
('Preacher Curl', 'Biceps', 'None', 'Beginner', 'EZ Bar, Preacher Bench', 'Curl the bar from a fully extended position while resting arms on the preacher pad.')
ON DUPLICATE KEY UPDATE
    muscle_group=VALUES(muscle_group),
    secondary_muscle=VALUES(secondary_muscle),
    difficulty=VALUES(difficulty),
    equipment_needed=VALUES(equipment_needed),
    instructions=VALUES(instructions);

-- Trainers table (safe creation)
CREATE TABLE IF NOT EXISTS Trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialty VARCHAR(255) DEFAULT 'General Fitness',
    bio TEXT,
    monthly_price DECIMAL(8,2) DEFAULT 29.99,
    rating DECIMAL(3,1) DEFAULT 5.0,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Subscriptions table (safe creation)
CREATE TABLE IF NOT EXISTS Subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    trainer_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS Messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room VARCHAR(255) NOT NULL,
    sender_id INT NOT NULL,
    sender_name VARCHAR(255),
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (room)
);

