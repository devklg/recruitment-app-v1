const User = require('../models/User');
const TeamStructure = require('../models/TeamStructure');
const PreEnrollment = require('../models/PreEnrollment');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Helper function to recursively gather all downline IDs
const gatherDownlineIds = async (nodeId) => {
  if (!nodeId) return [];
  
  const node = await TeamStructure.findOne({ user: nodeId });
  if (!node) return [];
  
  // Use Promise.all for concurrent fetching of left and right subtrees
  const [leftIds, rightIds] = await Promise.all([
      gatherDownlineIds(node.leftLeg),
      gatherDownlineIds(node.rightLeg)
  ]);
  
  return [nodeId, ...leftIds, ...rightIds];
};

// @desc    Get user's team structure view (limited depth)
// @route   GET /api/team/structure
// @access  Private
exports.getTeamStructure = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  // Function to recursively build the team tree (limited depth)
  const buildTeamTreeView = async (nodeId, depth = 0, maxDepth = 3) => {
    if (!nodeId || depth >= maxDepth) return null;
    
    const node = await TeamStructure.findOne({ user: nodeId })
                           .populate('user', 'firstName lastName rank package isActive'); // Added isActive
    
    if (!node) return null;
    
    const result = {
      id: node.user._id,
      firstName: node.user.firstName,
      lastName: node.user.lastName,
      rank: node.user.rank,
      package: node.user.package,
      isActive: node.user.isActive,
      position: node.position,
      leftLegVolume: node.leftLegVolume, // Basic info for display
      rightLegVolume: node.rightLegVolume,
      leftLegCount: node.leftLegCount,
      rightLegCount: node.rightLegCount,
      totalTeamSize: node.totalTeamSize,
      hasLeft: !!node.leftLeg,
      hasRight: !!node.rightLeg,
      left: null,
      right: null
    };
    
    if (depth < maxDepth -1) { // Fetch one level deeper
        const [leftTree, rightTree] = await Promise.all([
            buildTeamTreeView(node.leftLeg, depth + 1, maxDepth),
            buildTeamTreeView(node.rightLeg, depth + 1, maxDepth)
        ]);
        result.left = leftTree;
        result.right = rightTree;
    }
    
    return result;
  };

  // Build the team tree view starting from the logged-in user
  const teamTreeView = await buildTeamTreeView(userId);

  if (!teamTreeView) {
      // Handle case where user might not be in team structure yet (e.g., just activated)
      const user = await User.findById(userId);
      if(user && !user.isActive && user.role === 'pre-enrollee') {
          return next(new ErrorResponse('User is a pre-enrollee and not yet placed in the team structure.', 404));
      } else if (user && user.isActive) {
          // May indicate a delay or issue in placement after activation
          return next(new ErrorResponse('Team structure data not yet available. Please try again shortly.', 404));
      } else {
          return next(new ErrorResponse('Team structure not found for this user.', 404));
      }
  }
  
  res.status(200).json({
    success: true,
    data: teamTreeView
  });
});

// @desc    Get user's full downline (paginated)
// @route   GET /api/team/downline
// @access  Private
exports.getUserDownline = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const sort = req.query.sort || '-enrollmentDate'; // Default sort by newest
  const search = req.query.search;

  // Get the user's team structure to start the traversal
  const teamStructure = await TeamStructure.findOne({ user: userId });
  
  if (!teamStructure) {
    return next(new ErrorResponse('Team structure not found for this user.', 404));
  }
  
  // Get all downline IDs (excluding the user themselves)
  const [leftIds, rightIds] = await Promise.all([
      gatherDownlineIds(teamStructure.leftLeg),
      gatherDownlineIds(teamStructure.rightLeg)
  ]);
  const downlineIds = [...leftIds, ...rightIds];
  
  // Base query for filtering and searching within the downline
  const queryOptions = {
      _id: { $in: downlineIds }
  };

  // Add search functionality
  if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      queryOptions.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
      ];
  }

  // Count total matching documents before pagination
  const total = await User.countDocuments(queryOptions);

  // Calculate pagination limits
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Get paginated and sorted user details
  const downlineUsers = await User.find(queryOptions)
    .sort(sort) // Apply sorting
    .skip(startIndex)
    .limit(limit)
    .select('firstName lastName email phone country rank package enrollmentDate activationDate isActive sponsorName'); // Select fields
  
  // Pagination result object
  const pagination = {};
  if (endIndex < total) {
    pagination.next = { page: page + 1, limit };
  }
  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }
  
  res.status(200).json({
    success: true,
    count: downlineUsers.length,
    total,
    pagination,
    data: downlineUsers
  });
});

// @desc    Get team activity feed (new members, rank ups, etc. - simulated for now)
// @route   GET /api/team/activity
// @access  Private
exports.getTeamActivity = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit, 10) || 15;
  
  // Get the user's team structure to find downline
  const teamStructure = await TeamStructure.findOne({ user: userId });
  
  if (!teamStructure) {
    // User might be pre-enrollee or just activated
    return res.status(200).json({ success: true, count: 0, data: [] });
  }
  
  // Get all downline IDs including the user
  const [leftIds, rightIds] = await Promise.all([
      gatherDownlineIds(teamStructure.leftLeg),
      gatherDownlineIds(teamStructure.rightLeg)
  ]);
  const teamIds = [userId, ...leftIds, ...rightIds];
  
  // --- Simulate Activity Feed --- 
  // In a real app, this would query an Activity/Event log collection.
  // Here, we simulate by getting recent activations and adding mock rank-ups.

  const recentTeamMembers = await User.find({ 
      _id: { $in: teamIds },
      // Find users activated or enrolled recently
      $or: [ { activationDate: { $ne: null } }, { enrollmentDate: { $ne: null } } ] 
  })
  .sort({ 'updatedAt': -1 }) // Sort by recent activity (approximated by updatedAt)
  .limit(limit * 2) // Fetch more to filter down
  .select('firstName lastName enrollmentDate activationDate rank role');

  let activities = [];
  recentTeamMembers.forEach(member => {
      // Activated recently?
      if (member.activationDate && (new Date() - new Date(member.activationDate) < 7 * 24 * 60 * 60 * 1000)) { // within last 7 days
          activities.push({
              _id: member._id + '-activated',
              type: 'conversion',
              user: { id: member._id, firstName: member.firstName, lastName: member.lastName },
              timestamp: member.activationDate,
              details: `Activated their position!`
          });
      }
      // Joined recently (and is still pre-enrollee)?
      else if (member.role === 'pre-enrollee' && (new Date() - new Date(member.enrollmentDate) < 7 * 24 * 60 * 60 * 1000)) {
          activities.push({
              _id: member._id + '-joined',
              type: 'new-pre-enrollee',
              user: { id: member._id, firstName: member.firstName, lastName: member.lastName },
              timestamp: member.enrollmentDate,
              details: `Joined as a Pre-Enrollee.`
          });
      }
      
      // Simulate Rank Up (Example)
      if (member.rank !== 'associate' && Math.random() > 0.8) { // Randomly add some rank up events
          activities.push({
              _id: member._id + '-rankup',
              type: 'rank-up',
              user: { id: member._id, firstName: member.firstName, lastName: member.lastName },
              timestamp: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000), // Random time in last 3 days
              details: `Achieved the rank of ${member.rank.replace('-', ' ').toUpperCase()}!`
          });
      }
  });

  // Sort by timestamp (newest first) and limit results
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  activities = activities.slice(0, limit);
  
  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// @desc    Get user's team volume and count statistics
// @route   GET /api/team/volume
// @access  Private
exports.getTeamVolume = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  // Get the user's team structure
  const teamStructure = await TeamStructure.findOne({ user: userId });
  
  if (!teamStructure) {
     // Handle case where user might not be in team structure yet
    return res.status(200).json({
        success: true,
        data: {
            leftLegVolume: 0,
            rightLegVolume: 0,
            leftLegCount: 0,
            rightLegCount: 0,
            totalTeamSize: 0
        }
    });
  }
  
  // Return the stored volume and count data
  // In a full implementation, might recalculate or fetch from a dedicated stats collection.
  res.status(200).json({
    success: true,
    data: {
      leftLegVolume: teamStructure.leftLegVolume,
      rightLegVolume: teamStructure.rightLegVolume,
      leftLegCount: teamStructure.leftLegCount,
      rightLegCount: teamStructure.rightLegCount,
      totalTeamSize: teamStructure.totalTeamSize // Includes the user themselves
    }
  });
});

// @desc    Get team growth metrics (e.g., new members per month)
// @route   GET /api/team/growth
// @access  Private
exports.getTeamGrowthMetrics = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  // Get the user's team structure
  const teamStructure = await TeamStructure.findOne({ user: userId });
  
  if (!teamStructure) {
    // No structure, no growth data
    return res.status(200).json({ success: true, data: { labels: [], values: [], total: 0 } });
  }
  
  // Get all downline IDs
  const [leftIds, rightIds] = await Promise.all([
      gatherDownlineIds(teamStructure.leftLeg),
      gatherDownlineIds(teamStructure.rightLeg)
  ]);
  const allDownlineIds = [...leftIds, ...rightIds];
  
  // Get activation dates for all users in the downline
  // Growth is often measured by activations, not just enrollments
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const downlineUsers = await User.find({
    _id: { $in: allDownlineIds },
    activationDate: { $gte: sixMonthsAgo } // Activated in the last 6 months
  }).select('activationDate');
  
  // Group by month
  const growthByMonth = {};
  downlineUsers.forEach(user => {
    if(user.activationDate) {
        const month = user.activationDate.getMonth(); // 0-indexed
        const year = user.activationDate.getFullYear();
        const key = `${year}-${month + 1}`; // Use 1-based month for key
        
        growthByMonth[key] = (growthByMonth[key] || 0) + 1;
    }
  });
  
  // Format for chart data
  const monthLabels = [];
  const growthData = [];
  const today = new Date();

  // Generate labels and data for the last 6 months
  for (let i = 5; i >= 0; i--) { // Loop from 5 down to 0 for past 6 months
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-based month
    const key = `${year}-${month}`;
    
    monthLabels.push(date.toLocaleString('default', { month: 'short', year: 'numeric' }));
    growthData.push(growthByMonth[key] || 0);
  }
  
  res.status(200).json({
    success: true,
    data: {
      labels: monthLabels,
      values: growthData,
      totalLast6Months: downlineUsers.length
    }
  });
});
