const Department = require('../models/Department');
const User = require('../models/User');

const DEFAULT_DEPARTMENTS = [
  { name: 'Electrical', description: 'Power supply, wiring, lights, fans, power sockets', code: 'ELEC' },
  { name: 'IT/Network', description: 'Campus Wi-Fi, Ethernet, Routers, Lab PCs, Projectors', code: 'IT' },
  { name: 'Plumbing', description: 'Restrooms, water coolers, taps, leakage, drainage', code: 'PLUMB' },
  { name: 'Maintenance', description: 'Furniture, doors, windows, civil repairs, painting', code: 'MAINT' },
  { name: 'Equipment', description: 'Lab equipment, HVAC, air conditioners, sound systems', code: 'EQP' },
  { name: 'Other', description: 'General campus issues and unclassified requests', code: 'OTH' }
];

// @desc    Get all departments & staff assigned to them
// @route   GET /api/departments
// @access  Public / Private
const getDepartments = async (req, res) => {
  try {
    let departments = await Department.find().sort({ name: 1 });

    // Self-healing: if no departments exist in DB yet, auto-create the standard ones
    if (!departments || departments.length === 0) {
      for (const d of DEFAULT_DEPARTMENTS) {
        await Department.findOneAndUpdate(
          { name: d.name },
          { $setOnInsert: d },
          { upsert: true, new: true }
        );
      }
      departments = await Department.find().sort({ name: 1 });
    }

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
