const User = require("../models/User");
const PreEnrollment = require("../models/PreEnrollment");
const TeamStructure = require("../models/TeamStructure");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const crypto = require("crypto");
const { findNextAvailablePosition } = require("../services/placement");
const { LAUNCH_DATE, PRE_ENROLLMENT_EXPIRY_DAYS } = require("../utils/constants");

// @desc    Get all users with filtering and pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = asyncHandler(async (req, res, next) => {
  console.log("Admin getUsers request received");
  console.log("User making request:", req.user);

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25; // Default limit 25
  const filterOptions = {};

  if (req.query.role) {
    if (Array.isArray(req.query.role)) {
      filterOptions.role = { $in: req.query.role };
    } else {
      filterOptions.role = req.query.role;
    }
  }
  const sort = req.query.sort || "-createdAt"; // Default sort by newest
  if (req.query.isActive) {
    filterOptions.isActive = req.query.isActive === "true";
  }
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    filterOptions.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { referralCode: searchRegex }
    ];
  }

  // Count total matching users
  const total = await User.countDocuments(filterOptions);

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Get paginated results
  const users = await User.find(filterOptions)
    .populate("sponsor", "firstName lastName email") // Populate sponsor details
    .sort(sort)
    .skip(startIndex)
    .limit(limit);

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
    count: users.length,
    total,
    pagination,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Get team structure info if it exists
  const teamStructure = await TeamStructure.findOne({ user: user._id });

  // Get pre-enrollment info if applicable
  const preEnrollment = await PreEnrollment.findOne({ user: user._id });

  res.status(200).json({
    success: true,
    data: {
      user,
      teamStructure,
      preEnrollment
    }
  });
});

// @route   GET /api/admin/users/print
// @access  Private (Admin only)
exports.getPrintableUserList = asyncHandler(async (req, res, next) => {
  const filterOptions = {};

  if (req.query.role) {
    filterOptions.role = req.query.role;
  }

  if (req.query.isActive !== undefined) {
    filterOptions.isActive = req.query.isActive === "true";
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    filterOptions.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex }
    ];
  }

  const users = await User.find(filterOptions)
    .populate("sponsor", "firstName lastName email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: users.map((user) => ({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      role: user.role,
      package: user.package,
      sponsor: user.sponsor
        ? `${user.sponsor.firstName} ${user.sponsor.lastName}`
        : "None",
      enrollmentDate: user.enrollmentDate,
      status: user.isActive ? "Active" : "Inactive"
    }))
  });
});

// @desc    Admin updates a user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Prevent password updates through this route, use dedicated password reset
  delete req.body.password;

  let user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Perform the update
  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Admin updates a user's sponsor
// @route   PUT /api/admin/users/:id/sponsor
// @access  Private (Admin only)
exports.updateUserSponsor = asyncHandler(async (req, res, next) => {
  const { sponsorId } = req.body;
  const userId = req.params.id;

  if (!sponsorId) {
    return next(new ErrorResponse("Please provide a sponsor ID", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
  }

  // Prevent user from sponsoring themselves
  if (userId === sponsorId) {
    return next(new ErrorResponse("User cannot sponsor themselves", 400));
  }

  // Verify the new sponsor exists and is suitable (e.g., active promoter or admin)
  const sponsor = await User.findById(sponsorId);
  if (!sponsor || (!sponsor.isActive && sponsor.role !== "admin")) {
    return next(
      new ErrorResponse(
        `Invalid or unsuitable sponsor with id of ${sponsorId}`,
        404
      )
    );
  }

  // --- Update Sponsor ---
  const oldSponsorId = user.sponsor ? user.sponsor.toString() : null;
  user.sponsor = sponsorId;
  user.sponsorName = `${sponsor.firstName} ${sponsor.lastName}`;
  await user.save({ validateBeforeSave: false }); // Use false to avoid triggering password hash etc.

  let warningMessage = null;

  // --- Handle PreEnrollment ---
  const preEnrollment = await PreEnrollment.findOne({
    user: userId,
    status: "waiting"
  });
  if (preEnrollment) {
    preEnrollment.tentativeParent = sponsorId;
    // Optionally recalculate tentative position based on new sponsor
    // let newTentativePosition = 'left';
    // try {
    //     const placement = await findNextAvailablePosition(sponsorId, preEnrollment.placementPreference || 'auto');
    //     preEnrollment.tentativeParent = placement.parentId; // Could be someone under the sponsor
    //     preEnrollment.tentativePosition = placement.position;
    // } catch (err) { console.error("Error recalculating tentative pos:", err); }
    await preEnrollment.save();
    console.log(
      `Updated tentative parent for waiting pre-enrollee ${userId} to ${sponsorId}`
    );
  }

  // --- Handle Team Structure (More Complex) ---
  const teamStructure = await TeamStructure.findOne({ user: userId });
  if (teamStructure) {
    // Changing sponsor AFTER placement is complex.
    // Option 1: Just update sponsor field, leave structure (causes data inconsistency). Add warning.
    // Option 2: Attempt to physically move the user and their subtree (very complex, potential for errors, requires careful locking).
    // Option 3: Disallow sponsor change after placement.

    // Implementing Option 1 with a warning
    console.warn(
      `Sponsor changed for user ${userId} who is already placed in the structure. Structure was NOT modified.`
    );
    warningMessage =
      "User's sponsor was updated, but their position in the team structure was NOT changed. The user remains under their original placement parent. Manual tree restructuring may be required for structural consistency.";

    // Future consideration for Option 2:
    // - Lock relevant parts of the tree
    // - Remove user from old parent's leg
    // - Find new position under new sponsor
    // - Update user's parent and position
    // - Add user to new parent's leg
    // - Recursively update depth for user and entire subtree
    // - Recalculate volumes for old and new ancestor paths
    // - Unlock tree
  }

  res.status(200).json({
    success: true,
    data: user, // Return the updated user object
    message: "User's sponsor updated successfully.",
    ...(warningMessage && { warning: warningMessage })
  });
});

// @desc    Admin deletes a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${userId}`, 404));
  }

  // Prevent deleting the main admin or self? (Optional safeguard)
  // if (user.role === 'admin' && ...) { return next(...) }

  // --- Complex Deletion Logic ---
  // Deleting a user, especially one in the structure, requires careful handling.
  // 1. Remove from PreEnrollment queue if waiting.
  // 2. Remove from TeamStructure.
  // 3. Handle the gap in the TeamStructure (e.g., promote child, mark as vacant, complex restructure).
  // 4. Reassign sponsored users? (Set sponsor to deleted user's sponsor or admin?)
  // 5. Recalculate volumes.
  // 6. Delete associated data (Transactions, etc.).

  // Simple Deletion (for MVP - leaves gaps and potential inconsistencies):
  console.warn(
    `Deleting user ${userId}. This basic deletion does not handle team structure gaps or sponsored user reassignment.`
  );

  await PreEnrollment.deleteOne({ user: userId });
  await TeamStructure.deleteOne({ user: userId });
  // Add logic here to remove references from parent node in TeamStructure
  // Find parent: const parent = await TeamStructure.findOne({ $or: [{leftLeg: userId}, {rightLeg: userId}] });
  // if (parent) { ... update parent.leftLeg/rightLeg to null ... await parent.save() ... }

  await user.remove(); // Delete the user document itself

  res.status(200).json({
    success: true,
    message: `User ${userId} deleted successfully (basic deletion).`,
    data: {}
  });
});

// @desc    Get dashboard statistics for Admin
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  // Use Promise.all for concurrent queries
  const [
    totalUsers,
    totalPreEnrollees,
    totalPromoters,
    starterPackages,
    elitePackages,
    proPackages,
    waitingPreEnrollees
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "pre-enrollee", isActive: false }),
    User.countDocuments({ role: "promoter", isActive: true }),
    User.countDocuments({ package: "starter", isActive: true }),
    User.countDocuments({ package: "elite", isActive: true }),
    User.countDocuments({ package: "pro", isActive: true }),
    PreEnrollment.countDocuments({ status: "waiting" })
  ]);

  // Get new registrations in last 7 days
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const newRegistrationsLast7Days = await User.countDocuments({
    createdAt: { $gte: lastWeek }
  });

  // Get activations in last 7 days
  const newActivationsLast7Days = await User.countDocuments({
    activationDate: { $gte: lastWeek }
  });

  // Get daily sign-ups for the last 7 days
  const dailySignups = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = await User.countDocuments({
      createdAt: { $gte: dayStart, $lt: dayEnd }
    });
    dailySignups.push({ date: dayStart.toISOString().split("T")[0], count });
  }

  // Calculate days until launch
  const now = new Date();
  const launchDateObj = new Date(LAUNCH_DATE);
  const daysUntilLaunch =
    launchDateObj > now
      ? Math.ceil((launchDateObj - now) / (1000 * 60 * 60 * 24))
      : 0;
  // Assuming a 30-day pre-launch period for progress calculation
  const preLaunchDurationDays = 30;
  const launchProgress =
    launchDateObj > now
      ? Math.min(
          100,
          Math.max(
            0,
            ((preLaunchDurationDays - daysUntilLaunch) /
              preLaunchDurationDays) *
              100
          )
        )
      : 100;

  res.status(200).json({
    success: true,
    data: {
      userCounts: {
        total: totalUsers,
        promoters: totalPromoters,
        preEnrollees: totalPreEnrollees, // Inactive pre-enrollees
        waitingInQueue: waitingPreEnrollees // Explicitly count those in queue
      },
      packageCounts: {
        starter: starterPackages,
        elite: elitePackages,
        proPackages
      },
      recentActivity: {
        newRegistrationsLast7Days,
        newActivationsLast7Days,
        dailySignups
      },
      launchInfo: {
        launchDate: LAUNCH_DATE.toISOString(),
        daysRemaining: daysUntilLaunch,
        progressPercent: launchProgress.toFixed(0)
      }
    }
  });
});

// @desc    Get system settings (could be dynamic from DB later)
// @route   GET /api/admin/settings
// @access  Private (Admin only)
exports.getSystemSettings = asyncHandler(async (req, res, next) => {
  // Fetch from DB if implemented, otherwise use constants/defaults
  const settings = {
    preEnrollment: {
      enabled: true, // Controls if new registrations go to pre-enrollment
      expiryDays: PRE_ENROLLMENT_EXPIRY_DAYS
      // autoPlacement: true // This might be derived from placement service logic
    },
    system: {
      launchDate: LAUNCH_DATE.toISOString()
      // systemStatus: 'pre-launch', // Could be dynamic
      // maintenanceMessage: ''
    },
    packages: {
      starter: { price: 175, volume: 100 },
      elite: { price: 350, volume: 200 },
      pro: { price: 700, volume: 400 }
    }
    // Add other relevant settings: commission rules, payout schedules etc.
  };

  res.status(200).json({ success: true, data: settings });
});

// @desc    Update system settings (example - limited scope)
// @route   PUT /api/admin/settings
// @access  Private (Admin only)
exports.updateSystemSettings = asyncHandler(async (req, res, next) => {
  // --- Highly Sensitive Operation ---
  // In a real app:
  // - Validate input thoroughly.
  // - Store settings securely in DB (e.g., a dedicated Settings collection).
  // - Audit log all changes.
  // - Consider impacts of changing settings (e.g., changing launch date).

  const { preEnrollmentExpiryDays, launchDate } = req.body;

  // Example: Update constants if needed (Not ideal, better to store in DB)
  if (preEnrollmentExpiryDays) {
    console.log(
      "Updating Pre-Enrollment Expiry (In-memory - requires restart to persist if not DB backed)"
    );
    // constants.PRE_ENROLLMENT_EXPIRY_DAYS = parseInt(preEnrollmentExpiryDays, 10);
    // Update DB setting here
  }
  if (launchDate) {
    console.log(
      "Updating Launch Date (In-memory - requires restart to persist if not DB backed)"
    );
    // constants.LAUNCH_DATE = new Date(launchDate);
    // Update DB setting here
  }

  console.warn(
    "System settings update endpoint called - limited functionality in this version."
  );

  // Fetch updated settings (ideally from DB after update)
  const updatedSettings = {
    // Simulating update
    preEnrollmentExpiryDays:
      parseInt(preEnrollmentExpiryDays, 10) || PRE_ENROLLMENT_EXPIRY_DAYS,
    launchDate: launchDate
      ? new Date(launchDate).toISOString()
      : LAUNCH_DATE.toISOString()
    //... other settings
  };

  res.status(200).json({
    success: true,
    message:
      "Settings updated (simulated). Database persistence not implemented.",
    data: updatedSettings
  });
});

// @desc    Get team structure view for a specific user (Admin)
// @route   GET /api/admin/team/:userId
// @access  Private (Admin only)
exports.getTeamStructureForUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId;

  // Reusing the function from teamController, just calling it directly
  const teamController = require("./teamController");

  // Mock the req object for getTeamStructure
  const mockReq = { user: { id: userId } };

  // We need a mock next function to catch errors
  let errorOccurred = null;
  const mockNext = (err) => {
    errorOccurred = err;
  };

  // We need a mock res object to capture the response
  let responseData = null;
  let statusCode = 200;
  const mockRes = {
    status: function (code) {
      statusCode = code;
      return this;
    },
    json: function (data) {
      responseData = data;
    }
  };

  await teamController.getTeamStructure(mockReq, mockRes, mockNext);

  if (errorOccurred) {
    // Forward the error caught from getTeamStructure
    return next(errorOccurred);
  }

  if (!responseData) {
    // Should not happen if getTeamStructure works correctly without errors
    return next(
      new ErrorResponse("Failed to retrieve team structure data.", 500)
    );
  }

  // Send the captured response
  res.status(statusCode).json(responseData);
});
</file_content>

Now that you have the latest state of the file, try the operation again with fewer, more precise SEARCH blocks. For large files especially, it may be prudent to try to limit yourself to <5 SEARCH/REPLACE blocks at a time, then wait for the user to respond with the result of the operation before following up with another replace_in_file call to make additional edits.
(If you run into this error 3 times in a row, you may use the write_to_file tool as a fallback.)
</error><environment_details>
# VSCode Visible Files
server/controllers/adminController.js

# VSCode Open Tabs
client/src/hooks/useSiteSettings.js
client/src/hooks/useTeamMetrics.js
server/server.js
server/middleware/auth.js
server/controllers/preEnrollmentController.js
server/routes/admin.js
server/controllers/adminController.js

# Actively Running Terminals
## Original command: `npx eslint client/src/**/*.jsx client/src/**/*.js`

# Current Time
4/13/2025, 6:51:15 PM (America/Los_Angeles, UTC-7:00)

# Context Window Usage
268,830 / 1,048.576K tokens used (26%)

# Current Mode
ACT MODE
</environment_details>
