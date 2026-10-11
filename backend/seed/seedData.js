const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');

const ensureSeedData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return; // Already initialized
    }

    console.log('[Seed] Database is empty. Auto-seeding default departments, admin, staff, and initial complaints...');

    // 1. Create Departments
    const deptList = [
      { name: 'Electrical', description: 'Power supply, wiring, lights, fans, power sockets', code: 'ELEC' },
      { name: 'IT/Network', description: 'Campus Wi-Fi, Ethernet, Routers, Lab PCs, Projectors', code: 'IT' },
      { name: 'Plumbing', description: 'Restrooms, water coolers, taps, leakage, drainage', code: 'PLUMB' },
      { name: 'Maintenance', description: 'Furniture, doors, windows, civil repairs, painting', code: 'MAINT' },
      { name: 'Equipment', description: 'Lab equipment, HVAC, air conditioners, sound systems', code: 'EQP' },
      { name: 'Other', description: 'General campus issues and unclassified requests', code: 'OTH' }
    ];

    const createdDepts = await Department.insertMany(deptList);
    console.log(`[Seed] Created ${createdDepts.length} departments.`);

    const elecDept = createdDepts.find(d => d.name === 'Electrical');
    const itDept = createdDepts.find(d => d.name === 'IT/Network');
    const plumbDept = createdDepts.find(d => d.name === 'Plumbing');

    // 2. Passwords Hashing
    const salt = await bcrypt.genSalt(10);
    const passStudent = await bcrypt.hash('student123', salt);
    const passAdmin = await bcrypt.hash('admin123', salt);
    const passStaff = await bcrypt.hash('staff123', salt);

    // 3. Create Users
    const users = [
      {
        name: 'Alex Rivers (Student)',
        email: 'student@campusfix.edu',
        password: passStudent,
        role: 'student',
        phone: '+1 555-0192'
      },
      {
        name: 'System Admin',
        email: 'admin@campusfix.edu',
        password: passAdmin,
        role: 'admin',
        phone: '+1 555-0100'
      },
      {
        name: 'John Spark (Electrical Staff)',
        email: 'staff.elec@campusfix.edu',
        password: passStaff,
        role: 'staff',
        department: elecDept._id,
        phone: '+1 555-0144'
      },
      {
        name: 'Sarah Bytes (IT Staff)',
        email: 'staff.it@campusfix.edu',
        password: passStaff,
        role: 'staff',
        department: itDept._id,
        phone: '+1 555-0188'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`[Seed] Created ${createdUsers.length} initial users.`);

    const studentUser = createdUsers.find(u => u.role === 'student');
    const adminUser = createdUsers.find(u => u.role === 'admin');
    const elecStaff = createdUsers.find(u => u.email === 'staff.elec@campusfix.edu');
    const itStaff = createdUsers.find(u => u.email === 'staff.it@campusfix.edu');

    // 4. Create Sample Complaints
    const sampleComplaints = [
      {
        complaintId: 'CF-2026-001',
        title: 'Ceiling Fan Making Loud Noise & Sparking',
        description: 'The ceiling fan in Lecture Hall 3B produces a loud metallic grinding noise and sparked when turned to high speed.',
        category: 'Electrical',
        location: 'Building A, 2nd Floor, Room 204 (Lecture Hall 3B)',
        latitude: 28.6139,
        longitude: 77.2090,
        status: 'Assigned',
        priority: 'High',
        submittedBy: studentUser._id,
        assignedTo: elecStaff._id,
        department: elecDept._id,
        statusHistory: [
          { status: 'Pending', remarks: 'Complaint submitted by student', updatedBy: studentUser._id, timestamp: new Date(Date.now() - 86400000 * 2) },
          { status: 'Assigned', remarks: 'Verified issue. Assigned to John Spark for repair.', updatedBy: adminUser._id, timestamp: new Date(Date.now() - 86400000) }
        ]
      },
      {
        complaintId: 'CF-2026-002',
        title: 'Wi-Fi Access Point Offline in Central Library',
        description: 'No internet connection available on 1st Floor Reading Area. SSID CampusGuest displays authentication timeout error.',
        category: 'IT/Network',
        location: 'Central Library, 1st Floor Reading Desk 12',
        latitude: 28.6145,
        longitude: 77.2098,
        status: 'In Progress',
        priority: 'Urgent',
        submittedBy: studentUser._id,
        assignedTo: itStaff._id,
        department: itDept._id,
        staffRemarks: 'Inspecting router configuration and replacing broken fiber patch cable.',
        statusHistory: [
          { status: 'Pending', remarks: 'Complaint submitted by student', updatedBy: studentUser._id, timestamp: new Date(Date.now() - 86400000 * 3) },
          { status: 'Assigned', remarks: 'Assigned to Sarah Bytes', updatedBy: adminUser._id, timestamp: new Date(Date.now() - 86400000 * 2) },
          { status: 'In Progress', remarks: 'Replaced router power unit, testing bandwidth.', updatedBy: itStaff._id, timestamp: new Date(Date.now() - 3600000 * 4) }
        ]
      }
    ];

    await Complaint.insertMany(sampleComplaints);
    console.log(`[Seed] Created initial complaints successfully.`);
  } catch (err) {
    console.error('[Auto-Seed Error]', err);
  }
};

const runStandaloneSeed = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusfix';
  try {
    await mongoose.connect(connUri, { serverSelectionTimeoutMS: 5000 });
    await User.deleteMany({});
    await Department.deleteMany({});
    await Complaint.deleteMany({});
    await ensureSeedData();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

if (require.main === module) {
  runStandaloneSeed();
}

module.exports = { ensureSeedData };
