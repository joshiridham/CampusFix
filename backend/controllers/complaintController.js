const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');

// Generate unique Complaint ID (e.g. CF-2026-101)
const generateComplaintId = async () => {
  const count = await Complaint.countDocuments();
  const nextNum = (count + 1).toString().padStart(3, '0');
  const year = new Date().getFullYear();
  return `CF-${year}-${nextNum}`;
};

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Student, Admin)
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, location, latitude, longitude } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ success: false, message: 'Title, description, category, and location are required.' });
    }

    const complaintId = await generateComplaintId();
    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    // Try to find matching department ID
    let deptObj = await Department.findOne({ name: category });
    
    const complaint = await Complaint.create({
      complaintId,
      title,
      description,
      category,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      image: imagePath,
      status: 'Pending',
      priority: 'Medium',
      submittedBy: req.user._id,
      department: deptObj ? deptObj._id : null,
      statusHistory: [{
        status: 'Pending',
        remarks: 'Complaint submitted by student',
        updatedBy: req.user._id,
        timestamp: new Date()
      }]
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('submittedBy', 'name email phone')
      .populate('department', 'name');

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: populatedComplaint
    });
  } catch (error) {
    console.error('Create Complaint Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error submitting complaint' });
  }
};

// @desc    Get complaints list with role filtering & query parameters
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;
    let query = {};

    // Role-based filtering
    if (req.user.role === 'student') {
      query.submittedBy = req.user._id;
    } else if (req.user.role === 'staff') {
      // Staff see assigned complaints or complaints matching their department
      if (req.user.department) {
        query.$or = [
          { assignedTo: req.user._id },
          { department: req.user.department }
        ];
      } else {
        query.assignedTo = req.user._id;
      }
    }
    // Admin sees all complaints by default

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { complaintId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('submittedBy', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    console.error('Get Complaints Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error fetching complaints' });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/complaints/stats
// @access  Private
const getComplaintStats = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') {
      filter.submittedBy = req.user._id;
    } else if (req.user.role === 'staff') {
      if (req.user.department) {
        filter.$or = [{ assignedTo: req.user._id }, { department: req.user.department }];
      } else {
        filter.assignedTo = req.user._id;
      }
    }

    const total = await Complaint.countDocuments(filter);
    const pending = await Complaint.countDocuments({ ...filter, status: 'Pending' });
    const verified = await Complaint.countDocuments({ ...filter, status: 'Verified' });
    const assigned = await Complaint.countDocuments({ ...filter, status: 'Assigned' });
    const inProgress = await Complaint.countDocuments({ ...filter, status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ ...filter, status: 'Resolved' });
    const rejected = await Complaint.countDocuments({ ...filter, status: 'Rejected' });

    return res.json({
      success: true,
      stats: {
        total,
        pending,
        verified,
        assigned,
        inProgress,
        resolved,
        rejected
      }
    });
  } catch (error) {
    console.error('Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error calculating stats' });
  }
};

// @desc    Get complaint details by ID
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('submittedBy', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('department', 'name description')
      .populate('statusHistory.updatedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Role check: student can only see their own
    if (req.user.role === 'student' && complaint.submittedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this complaint' });
    }

    return res.json({ success: true, complaint });
  } catch (error) {
    console.error('Get Complaint By Id Error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving complaint details' });
  }
};

// @desc    Admin action: Verify, assign staff/department, set priority or reject
// @route   PUT /api/complaints/:id/verify-assign
// @access  Private (Admin only)
const verifyAndAssignComplaint = async (req, res) => {
  try {
    const { status, departmentId, assignedToStaffId, priority, remarks } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (departmentId) complaint.department = departmentId;
    if (assignedToStaffId) complaint.assignedTo = assignedToStaffId;

    const note = remarks || `Admin updated complaint status to '${complaint.status}'`;
    complaint.statusHistory.push({
      status: complaint.status,
      remarks: note,
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('submittedBy', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('department', 'name');

    return res.json({
      success: true,
      message: `Complaint ${complaint.complaintId} updated successfully`,
      complaint: updated
    });
  } catch (error) {
    console.error('Admin Update Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update complaint' });
  }
};

// @desc    Staff action: Update status (In Progress / Resolved), add remarks, upload resolution proof
// @route   PUT /api/complaints/:id/staff-update
// @access  Private (Staff, Admin)
const updateStaffStatus = async (req, res) => {
  try {
    const { status, staffRemarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role === 'staff' && complaint.assignedTo && complaint.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update complaints assigned to you' });
    }

    if (status) complaint.status = status;
    if (staffRemarks) complaint.staffRemarks = staffRemarks;

    if (req.file) {
      complaint.resolutionProof = `/uploads/${req.file.filename}`;
    }

    complaint.statusHistory.push({
      status: complaint.status,
      remarks: staffRemarks || `Status updated to ${complaint.status}`,
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('submittedBy', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('department', 'name');

    return res.json({
      success: true,
      message: 'Resolution / status progress updated successfully',
      complaint: updated
    });
  } catch (error) {
    console.error('Staff Update Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update staff progress' });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintStats,
  getComplaintById,
  verifyAndAssignComplaint,
  updateStaffStatus
};
