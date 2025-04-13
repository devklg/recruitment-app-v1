const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserSponsor,
  getDashboardStats,
  getSystemSettings,
  updateSystemSettings,
  getTeamStructureForUser
} = require('../controllers/adminController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Apply protect and admin authorization to all routes in this file
router.use(protect);
router.use(authorize('admin'));

// User Management Routes
router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.put('/users/:id/sponsor', updateUserSponsor);

// Dashboard & Team View Routes
router.get('/dashboard', getDashboardStats);
router.get('/team/:userId', getTeamStructureForUser);

// System Settings Routes
router.route('/settings')
  .get(getSystemSettings)
  .put(updateSystemSettings);

module.exports = router;
