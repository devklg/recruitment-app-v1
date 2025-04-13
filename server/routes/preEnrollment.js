const express = require('express');
const {
  preEnrollUser, // Deprecated
  getPreEnrollmentStatus,
  activatePreEnrolledUser
} = require('../controllers/preEnrollmentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Public route for pre-enrollment - Deprecated
// router.post('/', preEnrollUser);

// Protected routes for status and activation
router.get('/status', protect, getPreEnrollmentStatus); // Get own status
router.get('/status/:userId', protect, authorize('admin'), getPreEnrollmentStatus); // Admin gets specific user status

router.put('/activate/:userId', protect, activatePreEnrolledUser); // User activates themselves or admin activates them

module.exports = router;
