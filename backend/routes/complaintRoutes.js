const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintStats,
  getComplaintById,
  verifyAndAssignComplaint,
  updateStaffStatus
} = require('../controllers/complaintController');

const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All complaint endpoints require authentication
router.use(protect);

router.route('/')
  .get(getComplaints)
  .post(authorize('student', 'admin'), upload.single('image'), createComplaint);

router.get('/stats', getComplaintStats);
router.get('/:id', getComplaintById);

// Admin workflow: Verify, assign staff, change priority
router.put('/:id/verify-assign', authorize('admin'), verifyAndAssignComplaint);

// Staff workflow: Update status, upload resolution proof
router.put('/:id/staff-update', authorize('staff', 'admin'), upload.single('resolutionProof'), updateStaffStatus);

module.exports = router;
