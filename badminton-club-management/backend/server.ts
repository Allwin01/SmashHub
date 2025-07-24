// 📁 backend/server.ts

//import express, { Application, Request, Response, NextFunction } from 'express';
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import cors from 'cors';

// Route Imports
import authRoutes from './control/routes/auth';
import dashboardRoutes from './control/routes/dashboardRoutes';
import clubRoutes from './control/routes/clubRoutes';
import playerRoutes from './control/routes/playerRoutes';
import { authenticateJWT } from './control/middleware/authenticateJWT';
import coachRoutes from './control/routes/coach';
import emailReportRoute from './control/routes/emailReports';
import matchHistoryRoutes from './control/routes/matchHistory';
import matchSummaryRoutes from './control/routes/matchSummary';
import attendanceRoutes from './control/routes/attendance';
import userthemeRoutes from './control/routes/usertheme';






// 🔧 Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/badmintonDB';

// 🛡️ Setup CORS
app.use(cors({
  origin: 'http://localhost:3000',  // Your frontend origin
  credentials: true, // Allow cookies if needed (e.g., with JWT or session)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));

// 🧰 Body Parser
app.use(express.json());

// 🚪 Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/players', authenticateJWT, playerRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api', emailReportRoute);
app.use('/api', matchHistoryRoutes);
app.use('/api/matchSummary', matchSummaryRoutes);
//app.use('/api', matchHistoryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/user', userthemeRoutes);



// 🔌 MongoDB Connection
//mongoose.connect(MONGO_URI)
 // .then(() => {

    connectDB().then(() => {
    console.log('✅ Connected to MongoDB');



    // 🚀 Start Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:5050`);
    });

  })
  .catch((error: Error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  });


 
  

// TODO: Add more route groups (e.g., tournaments, players, clubs)
// TODO: Add centralized error handler middleware
