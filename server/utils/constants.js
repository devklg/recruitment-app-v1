// Package volume values
exports.PACKAGE_VOLUME = {
  starter: 100,
  elite: 200,
  pro: 400
};

// Team commission cycle value
exports.CYCLE_VOLUME = 200;
exports.CYCLE_PAYOUT = 25;
exports.MAX_WEEKLY_CYCLES = 250; // $50,000 / $25 = 2000 cycles max // Note: Text says 250, calculation implies 2000. Using 250 from text.

// Rank advancement bonuses
exports.RANK_BONUSES = {
  '3-star': 500,
  'diamond': 1000,
  'double-diamond': 2000,
  'triple-diamond': 3000,
  'diamond-elite': 5000
};

// Pre-enrollment expiry days
exports.PRE_ENROLLMENT_EXPIRY_DAYS = 7;

// Launch date
exports.LAUNCH_DATE = new Date('2025-05-01T00:00:00');
