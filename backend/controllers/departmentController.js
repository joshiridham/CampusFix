const Department = require('../models/Department');
const User = require('../models/User');

// @desc    Get all departments & staff assigned to them
// @route   GET /api/departments
// @access  Public / Private
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    const staffMembers = await User.find({ role: 'staff' }).select('name email department phone').populate('department', 'name');

    return res.json({
      success: true,
      departments,
      staff: staffMembers
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return res.status(500).json({ success: false, message: 'Server Error fetching departments' });
  }
};

module.exports = {
  getDepartments
};
