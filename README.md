# FitTrack Pro: AI-Powered Fitness & Personal Coaching

FitTrack Pro is a high-performance, full-stack fitness ecosystem. It combines cutting-edge AI pose estimation with real-time WebRTC coaching to provide a professional training experience at home.

---

## 📂 Project Structure

```text
FITNESS/
├── backend/                # Express API & Socket.io Server
│   ├── config/             # Database connection setup
│   ├── controllers/        # Business logic for Auth, Workouts, Analytics, etc.
│   ├── routes/             # API endpoint definitions
│   ├── .env                # Environment variables (Sensitive)
│   ├── server.js           # Main entry point
│   └── database.sql        # MySQL Schema definitions
├── frontend/               # Vanilla JS Web App
│   ├── css/                # Custom Design System
│   ├── js/                 # Logic: app.js, dashboard.js, videocall.js, ai-tracker.js
│   ├── index.html          # Main User Dashboard
│   ├── trainer.html        # Trainer Portal
│   ├── login.html          # Authentication entry
│   └── assets/             # Images and local resources
└── README.md               # Project Documentation
```

---

## 🛠️ Tech Stack & Architecture

- **Core**: Node.js, Express, MySQL.
- **Real-Time**: Socket.io for chat and WebRTC signaling.
- **Media**: WebRTC (Peer-to-Peer) for secure video sessions.
- **AI Engine**: TensorFlow.js with the **MoveNet** model for 17-point pose estimation.
- **Analytics**: Chart.js for data visualization.
- **UI/UX**: Custom Design System using HSL variables, Glassmorphism, and CSS Grid/Flexbox.

---

## 📡 API Reference

### User Authentication
- `POST /api/auth/register` - Create new user.
- `POST /api/auth/login` - Login user & return JWT.
- `GET /api/profile` - Get user profile & XP stats.

### Trainer Portal
- `POST /api/trainer-auth/login` - Dedicated trainer login.
- `GET /api/trainer-auth/clients` - List all clients subscribed to the trainer.
- `GET /api/trainers` - Browse available trainers.
- `POST /api/trainers/subscribe` - Subscribe to a trainer.

### Workouts & Analytics
- `POST /api/workouts` - Log a completed exercise set.
- `GET /api/analytics/volume` - Get historical tonnage data.
- `GET /api/analytics/1rm` - Get estimated One Rep Max progression.

---

## 💬 Real-Time Communication (Socket.io)

### Chat Events
- `join_room`: Joins a private trainer-client room.
- `send_message`: Sends a message to the active room.
- `receive_message`: Incoming message listener.
- `get_history`: Fetches recent chat logs from MySQL.

### Video Call Signaling (WebRTC)
- `call_request`: Notifies the other party of an incoming call.
- `call_accepted`: Initiates the peer-to-peer handshake.
- `webrtc_offer / webrtc_answer`: Exchange of SDP descriptions.
- `webrtc_ice`: Exchange of network candidates for NAT traversal.

---

## 🗄️ Database Schema

### `Users` & `Trainers`
- Stores credentials, bios, specialties, and subscription prices.
- Includes `xp` and `level` for gamification.

### `Workouts`
- Tracks every set: `exercise_id`, `sets`, `reps`, `weight_used`, and `date`.

### `Messages`
- Persistent chat logs linked by `room` identifier.

### `Subscriptions`
- Links `client_id` to `trainer_id` with `subscribed_at` timestamp.

---

## 🚀 Setup & Deployment

### 1. Database Setup
```sql
CREATE DATABASE fitness_tracker;
-- Import database.sql to create tables and seed exercises.
```

### 2. Backend Config (`/backend/.env`)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fitness_tracker
JWT_SECRET=your_secret_string
```

### 3. Running Locally
1. **Start Backend**: `cd backend && node server.js` (Runs on port 5000).
2. **Start Frontend**: `cd frontend && npx serve -l 3000`.

---

## 🔒 Security & Performance

- **JWT Authentication**: Secure stateless sessions for all API requests.
- **CORS Management**: Backend restricted to trusted origins.
- **Secure Contexts**: WebRTC and Camera access are restricted by browsers to HTTPS/Localhost.
- **DOM Optimization**: Minimized reflows and optimized script loading for 60fps UI performance.

---

## 💡 Troubleshooting

- **Camera Blocked?** Ensure you are on `localhost` or follow the `chrome://flags` instruction for local IP testing.
- **Socket Disconnected?** Check if port 5000 is open on your firewall.
- **AI Lag?** TensorFlow.js works best on hardware with hardware acceleration enabled.
