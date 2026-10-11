const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { ensureSeedData } = require('./seed/seedData');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static asset folders
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

let isMongoConnected = false;

// Middleware to block API calls safely if DB connection failed
app.use('/api', (req, res, next) => {
  if (!isMongoConnected) {
    return res.status(503).json({
      success: false,
      message: 'Database Connection Error: Backend is currently unable to reach MongoDB. Please check process.env.MONGODB_URI.'
    });
  }
  next();
});

// Import and mount standard Express routes
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/departments', departmentRoutes);

// Catch-all route to serve index.html for SPA frontend routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Route Not Found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;

connectDB().then(async (connected) => {
  isMongoConnected = connected;
  if (connected) {
    await ensureSeedData();
  } else {
    console.error('[CRITICAL SERVER WARNING] Running without active MongoDB connection. API calls will return 503 until DB is connected.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🚀 CampusFix Production Server running on port ${PORT}`);
    console.log(`🌐 Bound to 0.0.0.0 for Cloud/Render deployment`);
    console.log(`==================================================\n`);
  });
});
