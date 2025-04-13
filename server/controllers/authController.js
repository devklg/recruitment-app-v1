const User = require('../models/User');
const PreEnrollment = require('../models/PreEnrollment');
const TeamStructure = require('../models/TeamStructure');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const crypto = require('crypto');
const { PRE_ENROLLMENT_EXPIRY_DAYS } = require('../utils/constants');
const { findNextAvailablePosition } = require('../services/placement');

// @desc    Register user (handles both pre-enroll and potentially direct registration)
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, phone, country, password, package, referralCode } = req.body;
  
  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already registered', 400));
  }
  
  // Determine initial role and status
  // For now, all registrations go through pre-enrollment
  const initialRole = 'pre-enrollee';
  const initialIsActive = false;
  
  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    country,
    password,
    package: package || 'elite',
    role: initialRole,
    isActive: initialIsActive
  });
  
  // Find the sponsor by referral code if provided
  let sponsorId = null;
  let sponsorName = 'Magnificent Worldwide Marketing & Sales Group';
  if (referralCode) {
    const sponsor = await User.findOne({ referralCode });
    if (sponsor) {
      sponsorId = sponsor._id;
      sponsorName = `${sponsor.firstName} ${sponsor.lastName}`;
    } else {
       console.warn(`Sponsor not found for referral code: ${referralCode}`);
       // Proceed without sponsor, company becomes default sponsor
    }
  }
  
  // Set sponsor details on the user
  user.sponsor = sponsorId;
  user.sponsorName = sponsorName;
  await user.save({ validateBeforeSave: false }); // Save sponsor info
  
  // If pre-enrolling, create pre-enrollment record
  if (initialRole === 'pre-enrollee') {
      // Find root user for team structure if no valid sponsor was found
      if (!sponsorId) {
        const rootUser = await User.findOne({ role: 'admin' }); // Assuming admin is root
        if (rootUser) {
          sponsorId = rootUser._id;
        } else {
            // Critical error: No root user found, cannot place pre-enrollee
            // This should ideally not happen in a production system
            console.error("CRITICAL: No admin/root user found to act as default sponsor.");
            // Optionally remove the created user or handle differently
            // await User.findByIdAndDelete(user._id);
            // return next(new ErrorResponse('System configuration error, cannot process enrollment.', 500));
            // For now, we proceed without a tentative parent, placement might fail later
        }
      }

      // Find next available position
      let tentativeParentId = sponsorId;
      let tentativePosition = 'left'; // Default

      if (tentativeParentId) {
          try {
              const placement = await findNextAvailablePosition(tentativeParentId, 'auto');
              tentativeParentId = placement.parentId;
              tentativePosition = placement.position;
          } catch (placementError) {
              console.error("Error finding placement for pre-enrollee:", placementError);
              // Fallback: Place under the sponsor directly if possible, or root
              const sponsorStructure = await TeamStructure.findOne({ user: sponsorId });
              if (sponsorStructure && !sponsorStructure.leftLeg) tentativePosition = 'left';
              else if (sponsorStructure && !sponsorStructure.rightLeg) tentativePosition = 'right';
              else tentativePosition = 'left'; // Default fallback
              tentativeParentId = sponsorId; // Default to sponsor
          }
      } else {
          console.warn("No valid sponsor or root user for tentative placement.");
          // Cannot determine tentative placement without a parent
          tentativeParentId = null;
          tentativePosition = null;
      }

      // Get the next queue position
      const queueCount = await PreEnrollment.countDocuments({ status: 'waiting' });

      // Create pre-enrollment entry
      await PreEnrollment.create({
        user: user._id,
        queuePosition: queueCount + 1,
        tentativeParent: tentativeParentId,
        tentativePosition: tentativePosition,
        status: 'waiting',
        expiryDate: new Date(Date.now() + PRE_ENROLLMENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        placementPreference: 'auto' // Default, could be user-configurable
      });
  }

  // Send token response for the newly registered user
  sendTokenResponse(user, 201, res); 
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }
  
  // Check for user
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  
  // Check if password matches
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  
  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // req.user is set by the protect middleware
  const user = await User.findById(req.user.id);
  
  if (!user) {
    // This should not happen if protect middleware is working correctly
    return next(new ErrorResponse('User not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  
  if (!user) {
    // Don't reveal if user exists or not for security
    // Send a generic success response
    return res.status(200).json({ 
        success: true, 
        data: { message: 'If an account with that email exists, a password reset link has been sent.' } 
    });
  }
  
  // Get reset token
  const resetToken = user.getResetPasswordToken();
  
  await user.save({ validateBeforeSave: false });
  
  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/resetpassword/${resetToken}`;

  // In a real implementation, you would send an email with the reset token/URL
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`; 
  console.log("Reset URL (for testing):", resetUrl); // Log for testing

  // try {
  //   await sendEmail({
  //     email: user.email,
  //     subject: 'Password reset token',
  //     message
  //   });
  //   res.status(200).json({ success: true, data: 'Email sent' });
  // } catch (err) {
  //   console.error(err);
  //   user.resetPasswordToken = undefined;
  //   user.resetPasswordExpire = undefined;
  //   await user.save({ validateBeforeSave: false });
  //   return next(new ErrorResponse('Email could not be sent', 500));
  // }

  res.status(200).json({
    success: true,
    data: {
      resetToken, // Return token for testing purposes
      message: 'If an account with that email exists, a password reset link has been sent.'
    }
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');
    
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new ErrorResponse('Invalid or expired token', 400));
  }
  
  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save(); // This will trigger the pre-save hook to hash the new password
  
  sendTokenResponse(user, 200, res);
});

// @desc    Log user out / clear cookie (Token is client-side, so server doesn't do much here)
// @route   GET /api/auth/logout
// @access  Private 
exports.logout = asyncHandler(async (req, res, next) => {
  // Client should remove the token from storage.
  res.status(200).json({
    success: true,
    data: { message: 'Logout successful' }
  });
});

// Helper function to get token from model and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  
  // Note: Cookies are generally preferred for web security (httpOnly, secure flags)
  // but depend on frontend setup. Returning token in JSON body is common for APIs.
  // const options = {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
  //   ),
  //   httpOnly: true
  // };
  // if (process.env.NODE_ENV === 'production') {
  //   options.secure = true;
  // }
  // res.status(statusCode).cookie('token', token, options).json({...});
  
  res
    .status(statusCode)
    .json({
      success: true,
      token,
      // Send back relevant, non-sensitive user data
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        package: user.package,
        referralCode: user.referralCode,
        replicatedSiteName: user.replicatedSiteName,
        rank: user.rank,
        isActive: user.isActive,
        enrollmentDate: user.enrollmentDate,
        activationDate: user.activationDate
      }
    });
};
