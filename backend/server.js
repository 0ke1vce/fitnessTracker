const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
const analyticsRoutes = require('./routes/analyticsRoutes');
const generatorRoutes = require('./routes/generatorRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');

const trainerAuthRoutes = require('./routes/trainerAuthRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/generator', generatorRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/trainer-auth', trainerAuthRoutes);

const PORT = process.env.PORT || 5000;

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const mysql2 = require('mysql2/promise');
const msgPool = mysql2.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('send_message', async (data) => {
        // data: { room, sender_id, sender_name, message }
        io.to(data.room).emit('receive_message', data);
        // Persist to DB
        try {
            await msgPool.query(
                'INSERT INTO Messages (room, sender_id, sender_name, message) VALUES (?, ?, ?, ?)',
                [data.room, data.sender_id, data.sender_name || 'User', data.message]
            );
        } catch (e) { console.error('Failed to save message:', e.message); }
    });

    // Load message history for a room
    socket.on('get_history', async (room) => {
        try {
            const [msgs] = await msgPool.query(
                'SELECT * FROM Messages WHERE room = ? ORDER BY sent_at ASC LIMIT 100',
                [room]
            );
            socket.emit('message_history', msgs);
        } catch (e) { console.error('Failed to load history:', e.message); }
    });

    // WebRTC signaling
    socket.on('webrtc_offer', (data) => { socket.to(data.room).emit('webrtc_offer', data); });
    socket.on('webrtc_answer', (data) => { socket.to(data.room).emit('webrtc_answer', data); });
    socket.on('webrtc_ice', (data) => { socket.to(data.room).emit('webrtc_ice', data); });
    socket.on('call_request', (data) => { socket.to(data.room).emit('call_request', data); });
    socket.on('call_accepted', (data) => { socket.to(data.room).emit('call_accepted', data); });
    socket.on('call_ended', (data) => { socket.to(data.room).emit('call_ended', data); });

    socket.on('disconnect', () => { console.log('Socket disconnected:', socket.id); });
});

initDB().then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
