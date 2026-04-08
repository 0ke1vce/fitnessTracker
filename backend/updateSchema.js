const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // Ignore errors if columns already exist
        try {
            await pool.query('ALTER TABLE Users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;');
            console.log('Added is_admin to Users');
        } catch (e) {
            console.log('Column is_admin already exists or error:', e.message);
        }

        try {
            await pool.query('ALTER TABLE Exercises ADD COLUMN yt_link VARCHAR(255);');
            console.log('Added yt_link to Exercises');
        } catch (e) {
            console.log('Column yt_link already exists or error:', e.message);
        }

        try {
            await pool.query('ALTER TABLE Users ADD COLUMN goal_weight DECIMAL(5,2);');
            console.log('Added goal_weight to Users');
        } catch (e) {
            console.log('Column goal_weight already exists or error:', e.message);
        }

        // Set is_admin to true for existing users as a convenience for the owner currently testing
        await pool.query('UPDATE Users SET is_admin = TRUE;');

        console.log('Schema updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to update schema: ', err.message);
        process.exit(1);
    }
}

updateSchema();
