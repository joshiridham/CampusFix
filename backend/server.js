const express = require("express");
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

let isMongoConnected = false;

// Attempt DB connection
const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusfix';
  try {
    // Disable command buffering so Mongoose fails fast if DB isn't up
    mongoose.set('bufferCommands', false);
    
    await mongoose.connect(connUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[MongoDB] Connected successfully to ${connUri}`);
    isMongoConnected = true;
    return true;
  } catch (err) {
    console.warn(`[MongoDB Warning] Local MongoDB instance not reachable (${err.message}).`);
    console.warn('[Fallback Mode Active] Switching server to in-memory store for instant zero-dependency execution.');
    isMongoConnected = false;
    return false;
  }
};

// Memory fallback middleware & routes for when MongoDB is offline
const memoryStore = require('./config/memoryStore');
memoryStore.seed();

// Routes switch
app.use('/api/auth', (req, res, next) => {
  if (isMongoConnected) {
    return require('./routes/authRoutes')(req, res, next);
  }
  // Memory Router for Auth
  if (req.path === '/register' && req.method === 'POST') {
    const { name, email, password, role, phone } = req.body;
    const existing = memoryStore.users.find(u => u.email === email.toLowerCase());
    if (existing) return res.status(400).json({ success: false, message: 'User with this email already exists' });
    const newUser = {
      _id: 'user_' + Date.now(),
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'student',
      phone: phone || ''
    };
    memoryStore.users.push(newUser);
    return res.status(201).json({
      success: true,
      token: 'jwt_mock_token_' + newUser._id,
      user: { id: newUser._id, name, email, role: newUser.role, phone }
    });
  } else if (req.path === '/login' && req.method === 'POST') {
    const { email, password } = req.body;
    const user = memoryStore.users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    return res.json({
      success: true,
      token: 'jwt_mock_token_' + user._id,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department }
    });
  } else if (req.path === '/me') {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
    const userId = token.replace('jwt_mock_token_', '');
    const user = memoryStore.users.find(u => u._id === userId) || memoryStore.users[0];
    return res.json({ success: true, user });
  }
  next();
});

app.use('/api/complaints', (req, res, next) => {
  if (isMongoConnected) {
    return require('./routes/complaintRoutes')(req, res, next);
  }
  // Memory Router for Complaints
  if (req.path === '/stats' && req.method === 'GET') {
    const total = memoryStore.complaints.length;
    const pending = memoryStore.complaints.filter(c => c.status === 'Pending').length;
    const assigned = memoryStore.complaints.filter(c => c.status === 'Assigned').length;
    const inProgress = memoryStore.complaints.filter(c => c.status === 'In Progress').length;
    const resolved = memoryStore.complaints.filter(c => c.status === 'Resolved').length;
    const rejected = memoryStore.complaints.filter(c => c.status === 'Rejected').length;
    return res.json({ success: true, stats: { total, pending, assigned, inProgress, resolved, rejected } });
  } else if (req.path === '/' && req.method === 'GET') {
    return res.json({ success: true, count: memoryStore.complaints.length, complaints: memoryStore.complaints });
  } else if (req.path === '/' && req.method === 'POST') {
    const upload = require('./middleware/uploadMiddleware');
    return upload.single('image')(req, res, () => {
      const { title, description, category, location, latitude, longitude } = req.body;
      const newComp = {
        _id: 'comp_' + Date.now(),
        complaintId: `CF-2026-${(memoryStore.complaints.length + 1).toString().padStart(3, '0')}`,
        title,
        description,
        category,
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        image: req.file ? `/uploads/${req.file.filename}` : '',
        status: 'Pending',
        priority: 'Medium',
        submittedBy: memoryStore.users[0],
        assignedTo: null,
        department: memoryStore.departments.find(d => d.name === category) || null,
        staffRemarks: '',
        resolutionProof: '',
        statusHistory: [{ status: 'Pending', remarks: 'Submitted by student', timestamp: new Date() }],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.complaints.unshift(newComp);
      return res.status(201).json({ success: true, message: 'Complaint submitted', complaint: newComp });
    });
  } else if (req.path.endsWith('/verify-assign') && req.method === 'PUT') {
    const parts = req.path.split('/');
    const compId = parts[1];
    const comp = memoryStore.complaints.find(c => c._id === compId || c.complaintId === compId);
    if (comp) {
      const { status, priority, remarks } = req.body;
      if (status) comp.status = status;
      if (priority) comp.priority = priority;
      comp.statusHistory.push({ status: comp.status, remarks: remarks || 'Admin updated status', timestamp: new Date() });
      return res.json({ success: true, message: 'Updated', complaint: comp });
    }
  } else if (req.path.endsWith('/staff-update') && req.method === 'PUT') {
    const upload = require('./middleware/uploadMiddleware');
    return upload.single('resolutionProof')(req, res, () => {
      const parts = req.path.split('/');
      const compId = parts[1];
      const comp = memoryStore.complaints.find(c => c._id === compId || c.complaintId === compId);
      if (comp) {
        const { status, staffRemarks } = req.body;
        if (status) comp.status = status;
        if (staffRemarks) comp.staffRemarks = staffRemarks;
        if (req.file) comp.resolutionProof = `/uploads/${req.file.filename}`;
        comp.statusHistory.push({ status: comp.status, remarks: staffRemarks || 'Staff updated status', timestamp: new Date() });
        return res.json({ success: true, message: 'Staff status updated', complaint: comp });
      }
    });
  } else if (req.method === 'GET' && req.path.length > 1) {
    const compId = req.path.substring(1);
    const comp = memoryStore.complaints.find(c => c._id === compId || c.complaintId === compId) || memoryStore.complaints[0];
    return res.json({ success: true, complaint: comp });
  }
  next();
});

app.use('/api/departments', (req, res, next) => {
  if (isMongoConnected) {
    return require('./routes/departmentRoutes')(req, res, next);
  }
  return res.json({
    success: true,
    departments: memoryStore.departments,
    staff: memoryStore.users.filter(u => u.role === 'staff')
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Route Not Found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 CampusFix Server is running on port ${PORT}`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
  });
});
