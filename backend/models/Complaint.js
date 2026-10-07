const mongoose = require('mongoose');

const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ComplaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Electrical', 'IT/Network', 'Plumbing', 'Maintenance', 'Equipment', 'Other']
  },
  location: {
    type: String,
    required: [true, 'Location details are required']
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  staffRemarks: {
    type: String,
    default: ''
  },
  resolutionProof: {
    type: String,
    default: ''
  },
  statusHistory: [StatusHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
