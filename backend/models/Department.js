const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Electrical', 'IT/Network', 'Plumbing', 'Maintenance', 'Equipment', 'Other']
  },
  description: {
    type: String,
    default: ''
  },
  code: {
    type: String,
    uppercase: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);
