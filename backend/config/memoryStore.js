// In-Memory Data Store Fallback for local demo environment when MongoDB server is offline
const bcrypt = require('bcryptjs');

class MemoryStore {
  constructor() {
    this.users = [];
    this.departments = [];
    this.complaints = [];
    this.isInitialized = false;
  }

  async seed() {
    if (this.isInitialized) return;

    console.log('[MemoryStore] Initializing in-memory fallback database with sample seed data...');

    // 1. Departments
    this.departments = [
      { _id: 'dept_elec', name: 'Electrical', description: 'Power supply, wiring, lights, fans, sockets', code: 'ELEC' },
      { _id: 'dept_it', name: 'IT/Network', description: 'Campus Wi-Fi, Ethernet, Routers, Lab PCs', code: 'IT' },
      { _id: 'dept_plumb', name: 'Plumbing', description: 'Restrooms, water coolers, taps, leakage', code: 'PLUMB' },
      { _id: 'dept_maint', name: 'Maintenance', description: 'Furniture, doors, windows, civil repairs', code: 'MAINT' },
      { _id: 'dept_eqp', name: 'Equipment', description: 'Lab equipment, HVAC, air conditioners', code: 'EQP' },
      { _id: 'dept_oth', name: 'Other', description: 'General campus issues and requests', code: 'OTH' }
    ];

    // 2. Users
    const salt = await bcrypt.genSalt(10);
    const passStudent = await bcrypt.hash('student123', salt);
    const passAdmin = await bcrypt.hash('admin123', salt);
    const passStaff = await bcrypt.hash('staff123', salt);

    this.users = [
      {
        _id: 'user_student_1',
        name: 'Alex Rivers (Student)',
        email: 'student@campusfix.edu',
        password: passStudent,
        role: 'student',
        phone: '+1 555-0192',
        department: null
      },
      {
        _id: 'user_admin_1',
        name: 'System Admin',
        email: 'admin@campusfix.edu',
        password: passAdmin,
        role: 'admin',
        phone: '+1 555-0100',
        department: null
      },
      {
        _id: 'user_staff_elec',
        name: 'John Spark (Electrical Staff)',
        email: 'staff.elec@campusfix.edu',
        password: passStaff,
        role: 'staff',
        phone: '+1 555-0144',
        department: this.departments[0]
      },
      {
        _id: 'user_staff_it',
        name: 'Sarah Bytes (IT Staff)',
        email: 'staff.it@campusfix.edu',
        password: passStaff,
        role: 'staff',
        phone: '+1 555-0188',
        department: this.departments[1]
      }
    ];

    // 3. Complaints
    this.complaints = [
      {
        _id: 'comp_1',
        complaintId: 'CF-2026-001',
        title: 'Ceiling Fan Making Loud Noise & Sparking',
        description: 'The ceiling fan in Lecture Hall 3B produces a loud metallic grinding noise and sparked when turned to high speed.',
        category: 'Electrical',
        location: 'Building A, 2nd Floor, Room 204 (Lecture Hall 3B)',
        latitude: 28.6139,
        longitude: 77.2090,
        image: '',
        status: 'Assigned',
        priority: 'High',
        submittedBy: this.users[0],
        assignedTo: this.users[2],
        department: this.departments[0],
        staffRemarks: '',
        resolutionProof: '',
        statusHistory: [
          { status: 'Pending', remarks: 'Complaint submitted by student', updatedBy: { name: 'Alex Rivers (Student)', role: 'student' }, timestamp: new Date(Date.now() - 86400000 * 2) },
          { status: 'Assigned', remarks: 'Verified issue. Assigned to John Spark for repair.', updatedBy: { name: 'System Admin', role: 'admin' }, timestamp: new Date(Date.now() - 86400000) }
        ],
        createdAt: new Date(Date.now() - 86400000 * 2),
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        _id: 'comp_2',
        complaintId: 'CF-2026-002',
        title: 'Wi-Fi Access Point Offline in Central Library',
        description: 'No internet connection available on 1st Floor Reading Area. SSID CampusGuest displays authentication timeout error.',
        category: 'IT/Network',
        location: 'Central Library, 1st Floor Reading Desk 12',
        latitude: 28.6145,
        longitude: 77.2098,
        image: '',
        status: 'In Progress',
        priority: 'Urgent',
        submittedBy: this.users[0],
        assignedTo: this.users[3],
        department: this.departments[1],
        staffRemarks: 'Inspecting router configuration and replacing broken fiber patch cable.',
        resolutionProof: '',
        statusHistory: [
          { status: 'Pending', remarks: 'Complaint submitted by student', updatedBy: { name: 'Alex Rivers (Student)', role: 'student' }, timestamp: new Date(Date.now() - 86400000 * 3) },
          { status: 'Assigned', remarks: 'Assigned to Sarah Bytes', updatedBy: { name: 'System Admin', role: 'admin' }, timestamp: new Date(Date.now() - 86400000 * 2) },
          { status: 'In Progress', remarks: 'Replaced router power unit, testing bandwidth.', updatedBy: { name: 'Sarah Bytes (IT Staff)', role: 'staff' }, timestamp: new Date(Date.now() - 3600000 * 4) }
        ],
        createdAt: new Date(Date.now() - 86400000 * 3),
        updatedAt: new Date(Date.now() - 3600000 * 4)
      },
      {
        _id: 'comp_3',
        complaintId: 'CF-2026-003',
        title: 'Water Leakage from Basin Tap in Restroom',
        description: 'Water tap continuously drips and overflows onto floor near Sink #2.',
        category: 'Plumbing',
        location: 'Science Block B, Ground Floor Restroom',
        latitude: 28.6128,
        longitude: 77.2085,
        image: '',
        status: 'Pending',
        priority: 'Medium',
        submittedBy: this.users[0],
        assignedTo: null,
        department: this.departments[2],
        staffRemarks: '',
        resolutionProof: '',
        statusHistory: [
          { status: 'Pending', remarks: 'Complaint submitted by student', updatedBy: { name: 'Alex Rivers (Student)', role: 'student' }, timestamp: new Date() }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.isInitialized = true;
    console.log('[MemoryStore] Fallback data seeded successfully.');
  }
}

const memoryStore = new MemoryStore();
module.exports = memoryStore;
