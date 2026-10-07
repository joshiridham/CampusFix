# CampusFix – Smart College Complaint Management System

CampusFix is a full-stack, web-based complaint management application designed for college campuses. It enables students to report issues (electrical, Wi-Fi, plumbing, maintenance, equipment) with automatic GPS geolocation capturing and Drag & Drop photo upload. Administrators can verify complaints, assign them to technicians, and prioritize them, while technical staff can update resolution progress and attach proof photos.

---

## 1. Project Folder Structure

```
c:\ridham\
├── package.json               # Dependencies (Express, Mongoose, JWT, Multer, Bcrypt)
├── README.md                  # Viva preparation & setup instructions
├── uploads/                   # Stored complaint evidence & resolution proof images
├── backend/
│   ├── server.js              # Express app entry point, static serving & auto-seed
│   ├── config/
│   │   └── db.js              # MongoDB Mongoose connection
│   ├── models/
│   │   ├── User.js            # User Schema (Student, Admin, Staff)
│   │   ├── Department.js      # Department Schema (Electrical, IT, Plumbing, etc.)
│   │   └── Complaint.js       # Complaint Schema with timeline history & GPS
│   ├── controllers/
│   │   ├── authController.js  # Registration, Login & Profile handlers
│   │   ├── complaintController.js # Complaint CRUD, verify, assign & staff updates
│   │   └── departmentController.js# Department & staff listings
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT Auth & Role-based authorization middleware
│   │   └── uploadMiddleware.js# Multer image upload configuration (<5MB, image filter)
│   ├── routes/
│   │   ├── authRoutes.js      # Auth API endpoints (/api/auth)
│   │   ├── complaintRoutes.js # Complaint API endpoints (/api/complaints)
│   │   └── departmentRoutes.js# Department API endpoints (/api/departments)
│   └── seed/
│       └── seedData.js        # Standalone database seeder script
└── frontend/
    ├── index.html             # Landing page with role overviews
    ├── login.html             # Login page with demo auto-fill buttons
    ├── register.html          # Role-based user registration page
    ├── student-dashboard.html # Student complaint tracking & stats
    ├── submit-complaint.html  # Form with HTML5 Drag & Drop and Geolocation API
    ├── complaint-details.html # Timeline, evidence preview & staff resolution proof
    ├── admin-dashboard.html   # Admin analytics, verification & staff assignment modal
    ├── staff-dashboard.html   # Staff assigned task queue & progress update modal
    ├── profile.html           # User profile & Local Storage session inspector
    ├── css/
    │   └── style.css          # Custom design system with glassmorphism & status badges
    └── js/
        ├── api.js             # Fetch wrapper API service & JWT storage
        ├── auth.js            # Session checking & navbar management
        ├── student.js         # Student UI logic & form draft Local Storage auto-save
        ├── admin.js           # Admin UI logic & assignment modal
        ├── staff.js           # Staff UI logic & status update modal
        ├── drag-drop.js       # HTML5 Drag & Drop image file handler & preview
        └── geo.js             # Browser Geolocation API integration module
```

---

## 2. How to Run the Project

### Prerequisites
- Node.js (v16+ installed)
- MongoDB installed locally OR running via default port `27017` (Optional: Auto-seeding runs automatically on startup).

### Steps to Run:
1. Open terminal inside `c:\ridham`:
   ```bash
   cd c:\ridham
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Seed the database with sample demo accounts and complaints:
   ```bash
   npm run seed
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

---

## 3. MongoDB Setup Steps

1. Start your local MongoDB server (Community Server / mongod service):
   ```bash
   mongod --dbpath /path/to/data/db
   ```
2. By default, CampusFix connects to `mongodb://127.0.0.1:27017/campusfix`.
3. If you want to use MongoDB Atlas (Cloud), create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campusfix?retryWrites=true&w=majority
   JWT_SECRET=campusfix_secret_key_2026
   ```

---

## 4. Demo Login Credentials

You can use these pre-seeded demo accounts to test each role immediately:

| Role | Email | Password | Access / Department |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campusfix.edu` | `student123` | Submit complaints, track status, view resolution proof |
| **Admin** | `admin@campusfix.edu` | `admin123` | Verify/reject issues, assign staff, set priorities, view all complaints |
| **Staff (Electrical)** | `staff.elec@campusfix.edu` | `staff123` | View assigned electrical complaints, update progress, upload proof photo |
| **Staff (IT)** | `staff.it@campusfix.edu` | `staff123` | View assigned IT/Network complaints, update progress, upload proof photo |

*Note: On the `login.html` page, quick-click buttons are provided to auto-fill these credentials instantly.*

---

## 5. Main Features Implemented

1. **Role-Based Authentication & Authorization**:
   - Distinct permissions for Students, Admins, and Staff.
   - JWT tokens stored in Local Storage.
   - Backend auth middleware enforces role permissions on API endpoints.
2. **Student Complaint Submission**:
   - Category selection (Electrical, IT/Network, Plumbing, Maintenance, Equipment, Other).
   - HTML5 Drag & Drop evidence photo upload with image preview and validation (<5MB).
   - Browser Geolocation API button capturing exact GPS latitude and longitude.
   - Local Storage draft auto-saving (auto-saves draft on input and restores on reload).
3. **Admin Verification & Assignment**:
   - Campus-wide analytics counters (Total, Pending, In Progress, Resolved, Rejected).
   - Modal for verification, priority adjustment (Low, Medium, High, Urgent), and assigning complaints to specific staff technicians.
4. **Staff Resolution Workflow**:
   - Filtered view of assigned complaints.
   - Modal for updating status (`In Progress`, `Resolved`), adding remarks, and uploading resolution proof photos.
5. **Timeline & Status Tracking**:
   - Status badges with distinct visual styling.
   - Detailed status history log recording who updated what status and when.

---

## 6. Important Files to Know for Viva / Practical Exam

- **`backend/server.js`**: Understand how Express sets up routes, static file serving (`/uploads` & `/frontend`), and initializes MongoDB connection.
- **`backend/middleware/authMiddleware.js`**: Explains JWT verification and role authorization logic (`protect` and `authorize('admin')`).
- **`backend/models/Complaint.js`**: Explains the Mongoose schema for complaint records, status enum values, and timeline sub-documents.
- **`frontend/js/drag-drop.js`**: Demonstrates HTML5 Drag & Drop event handling (`dragover`, `drop`, `FileReader`, `DataTransfer`).
- **`frontend/js/geo.js`**: Demonstrates the native HTML5 `navigator.geolocation.getCurrentPosition()` API.
- **`frontend/js/student.js`**: Demonstrates `localStorage.setItem()` and `localStorage.getItem()` for draft auto-save and JWT session storage.

---

## 7. Remaining Issues

None. All features (MongoDB Mongoose models, role auth, Drag & Drop API, Geolocation API, Local Storage session & drafts, Bootstrap/Tailwind UI, Express REST APIs, sample data, seeder script) are fully implemented and functional.
