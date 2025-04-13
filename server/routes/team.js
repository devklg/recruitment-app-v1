const express = require('express');
const {
  getTeamStructure,
  getUserDownline,
  getTeamActivity,
  getTeamVolume,
  getTeamGrowthMetrics
} = require('../controllers/teamController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Protect all team-related routes
router.use(protect);

// Routes accessible by promoters and admins
router.get('/structure', getTeamStructure); 
router.get('/downline', getUserDownline);
router.get('/activity', getTeamActivity);
router.get('/volume', getTeamVolume);
router.get('/growth', getTeamGrowthMetrics);

// Note: Admin-specific team views (e.g., viewing another user's structure) are in admin.js

module.exports = router;
