const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

const ADMIN_REGISTRATION_SECRET = process.env.ADMIN_REGISTRATION_SECRET || 'Admin@CampusFix2026';

// @desc    Register a new user (Student, Staff, or Admin)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, adminSecretKey, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    // Determine normalized role (default: student)
    const normalizedRole = (role || 'student').toLowerCase().trim();
    if (!['student', 'staff', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid account role specified.' });
    }

    // Verify Admin Secret Passcode for Admin registration
    if (normalizedRole === 'admin') {
      if (!adminSecretKey || adminSecretKey.trim() !== ADMIN_REGISTRATION_SECRET) {
        return res.status(403).json({
          success: false,
          message: 'Invalid Admin Security Passcode. Only authorized personnel can create an Admin account.'
        });
      }
    }

    // Verify or resolve Department for Staff registration
    let departmentId = null;
    if (normalizedRole === 'staff') {
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Please select an assigned Department for Staff registration.'
        });
      }

      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(department)) {
        const dept = await Department.findById(department);
        if (dept) departmentId = dept._id;
      }

      if (!departmentId) {
        const rawDept = department.toString().trim();
        let dept = await Department.findOne({
          name: new RegExp(`^${rawDept}$`, 'i')
        });

        // Self-healing: if department does not exist in DB yet, auto-create it
        if (!dept) {
          const standardNames = ['Electrical', 'IT/Network', 'Plumbing', 'Maintenance', 'Equipment', 'Other'];
          const matched = standardNames.find(s => s.toLowerCase() === rawDept.toLowerCase()) || rawDept;
          dept = await Department.findOneAndUpdate(
            { name: matched },
            { $setOnInsert: { name: matched, code: matched.slice(0, 4).toUpperCase(), description: `${matched} Department` } },
            { upsert: true, new: true }
          );
        }

        if (dept) departmentId = dept._id;
      }

      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid Department for Staff registration.'
        });
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: normalizedRole,
      department: normalizedRole === 'staff' ? departmentId : null,
      phone: phone ? phone.trim() : ''
    });

    const populatedUser = await User.findById(user._id).populate('department', 'name description');
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        department: populatedUser.department,
        phone: populatedUser.phone
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server Error during registration' });
  }
};

// @desc    Login user & return token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email address and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('department', 'name description');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server Error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('department', 'name description');
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve user profile' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
