const User = require('../models/User');
const PreEnrollment = require('../models/PreEnrollment');
const TeamStructure = require('../models/TeamStructure');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { PRE_ENROLLMENT_EXPIRY_DAYS, LAUNCH_DATE } = require('../utils/constants');
const { placeUserInTeamStructure, findNextAvailablePosition } = require('../services/placement');

// @desc    Pre-enroll a new user (This route is now part of authController.register)
//          Keeping this file for status and activation logic.
// @route   POST /api/pre-enrollment 
// @access  Public - Deprecated (Use /api/auth/register instead)
exports.preEnrollUser = asyncHandler(async (req, res, next) => {
  // This logic has been moved to authController.register
  return next(new ErrorResponse('This endpoint is deprecated. Use /api/auth/register.', 410));
});

// @desc    Get pre-enrollment status for the logged-in user or a specific user (if admin)
// @route   GET /api/pre-enrollment/status
// @route   GET /api/pre-enrollment/status/:userId (Admin only)
// @access  Private
exports.getPreEnrollmentStatus = asyncHandler(async (req, res, next) => {
  let userId = req.user.id; // Default to logged-in user

  // If admin is requesting for a specific user
  if (req.params.userId && req.user.role === 'admin') {
      userId = req.params.userId;
  } else if (req.params.userId && req.user.id !== req.params.userId) {
      // Non-admin trying to access another user's status
      return next(new ErrorResponse('Not authorized to access this resource', 403));
  }

  const preEnrollment = await PreEnrollment.findOne({ 
    user: userId 
  }).populate('user', 'firstName lastName email'); // Populate user details
  
  if (!preEnrollment) {
    // Check if the user exists but is already active
    const user = await User.findById(userId);
    if (user && user.isActive) {
        return res.status(200).json({
            success: true,
            data: { status: 'active', message: 'User is already an active promoter.' }
        });
    }
    return next(new ErrorResponse('Pre-enrollment record not found for this user', 404));
  }
  
  // Get tentative parent info if available
  let tentativeParentInfo = null;
  if(preEnrollment.tentativeParent) {
      const parentUser = await User.findById(preEnrollment.tentativeParent).select('firstName lastName');
      if(parentUser) {
          tentativeParentInfo = {
              firstName: parentUser.firstName,
              lastName: parentUser.lastName,
              position: preEnrollment.tentativePosition
          };
      }
  }
  
  // Get total waiting pre-enrollees
  const totalPreEnrollees = await PreEnrollment.countDocuments({ 
    status: 'waiting' 
  });
  
  // Get people who joined after this user (would be in downline if activated)
  const downlineCount = await PreEnrollment.countDocuments({
    queuePosition: { $gt: preEnrollment.queuePosition },
    status: 'waiting'
  });
  
  // Calculate days until expiry
  const now = new Date();
  const expiryDate = new Date(preEnrollment.expiryDate);
  let daysUntilExpiry = 0;
  if (expiryDate > now) {
      daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  }

  // Calculate days until launch
  const launchDateObj = new Date(LAUNCH_DATE);
  let daysUntilLaunch = 0;
  if(launchDateObj > now) {
      daysUntilLaunch = Math.ceil((launchDateObj - now) / (1000 * 60 * 60 * 24));
  }
  
  res.status(200).json({
    success: true,
    data: {
      status: preEnrollment.status, // waiting, processing, converted, expired
      user: preEnrollment.user, // Basic user info
      queuePosition: preEnrollment.queuePosition,
      expiryDate: preEnrollment.expiryDate,
      placementPreference: preEnrollment.placementPreference,
      tentativePlacement: tentativeParentInfo,
      systemStats: {
        totalWaitingPreEnrollees: totalPreEnrollees,
        potentialDownlineCount: downlineCount,
        daysUntilExpiry,
        launchDate: LAUNCH_DATE,
        daysUntilLaunch
      }
    }
  });
});

// @desc    Activate pre-enrolled user (e.g., after payment/confirmation)
// @route   PUT /api/pre-enrollment/activate/:userId
// @access  Private (User themselves or Admin)
exports.activatePreEnrolledUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId;

  // Ensure the requester is the user or an admin
  if (req.user.id !== userId && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to activate this user', 403));
  }

  const user = await User.findById(userId);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  if (user.role !== 'pre-enrollee') {
    return next(new ErrorResponse('User is not currently a pre-enrollee', 400));
  }
  
  if (user.isActive) {
    return next(new ErrorResponse('User is already active', 400));
  }

  // Get the pre-enrollment data
  const preEnrollment = await PreEnrollment.findOne({ user: user._id, status: 'waiting' });
  
  if (!preEnrollment) {
    return next(new ErrorResponse('Valid waiting pre-enrollment record not found. User might have expired or been converted.', 404));
  }

  // Check expiry
  if (new Date(preEnrollment.expiryDate) < new Date()) {
      preEnrollment.status = 'expired';
      await preEnrollment.save();
      return next(new ErrorResponse('Pre-enrollment period has expired. Please re-register.', 400));
  }
  
  // --- Placement Logic --- 
  let parentId = preEnrollment.tentativeParent;
  let position = preEnrollment.tentativePosition;

  // Validate parent and position are still viable or find new ones
  if (!parentId || !position) {
      // This might happen if the sponsor/root was deleted or placement failed initially
      console.warn(`User ${userId} activating without valid tentative placement. Finding new placement.`);
      let sponsorId = user.sponsor;
      if (!sponsorId) {
          const rootUser = await User.findOne({ role: 'admin' });
          sponsorId = rootUser?._id;
      }
      if (!sponsorId) {
          return next(new ErrorResponse('Cannot activate user: No sponsor or root user available for placement.', 500));
      }
      try {
          const placement = await findNextAvailablePosition(sponsorId, preEnrollment.placementPreference || 'auto');
          parentId = placement.parentId;
          position = placement.position;
      } catch (err) {
          return next(new ErrorResponse(`Failed to find placement position: ${err.message}`, 500));
      }
  } else {
      // Verify the tentative spot is actually still open
      const parentStructure = await TeamStructure.findOne({ user: parentId });
      if (!parentStructure || (position === 'left' && parentStructure.leftLeg) || (position === 'right' && parentStructure.rightLeg)) {
          console.warn(`Tentative placement for ${userId} is taken. Finding new placement.`);
          try {
              const placement = await findNextAvailablePosition(parentId, preEnrollment.placementPreference || 'auto');
              parentId = placement.parentId;
              position = placement.position;
          } catch (err) {
              return next(new ErrorResponse(`Failed to find new placement position: ${err.message}`, 500));
          }
      }
  }

  // --- Update User and Place in Structure --- 
  user.isActive = true;
  user.role = 'promoter';
  user.activationDate = new Date();
  // Optionally update package if chosen during activation
  if (req.body.package && ['starter', 'elite', 'pro'].includes(req.body.package)) {
      user.package = req.body.package;
  }
  await user.save();

  // Place user in the determined position
  let teamStructure;
  try {
    teamStructure = await placeUserInTeamStructure(
      user._id,
      parentId,
      position
    );
  } catch (placementError) {
      // Rollback user activation status if placement fails?
      // user.isActive = false; user.role = 'pre-enrollee'; user.activationDate = null; await user.save();
      console.error("Failed to place user in team structure after activation:", placementError);
      return next(new ErrorResponse('Activation successful, but failed to place user in the team structure. Please contact support.', 500));
  }
  
  // Update pre-enrollment status
  preEnrollment.status = 'converted';
  await preEnrollment.save();
  
  // Respond with updated user and placement info
  res.status(200).json({
    success: true,
    message: 'User successfully activated and placed in the team structure.',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        package: user.package,
        activationDate: user.activationDate,
        isActive: user.isActive
      },
      teamStructure: {
        position: teamStructure.position,
        parent: parentId,
        depth: teamStructure.depth
      }
    }
  });
});
