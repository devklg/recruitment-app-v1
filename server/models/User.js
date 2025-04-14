const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  country: {
    type: String,
    required: [true, 'Please add a country']
  },
  role: {
    type: String,
    enum: ['pre-enrollee', 'promoter', 'admin'],
    default: 'pre-enrollee'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  package: {
    type: String,
    enum: ['starter', 'elite', 'pro'],
    default: 'elite'
  },
  sponsor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sponsorName: {
    type: String,
    default: 'Magnificent Worldwide Marketing & Sales Group'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  activationDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  rank: {
    type: String,
    enum: [
      'associate', 
      '1-star', 
      '2-star', 
      '3-star', 
      'diamond', 
      'double-diamond', 
      'triple-diamond', 
      'diamond-elite', 
      'blue-diamond'
    ],
    default: 'associate'
  },
  referralCode: {
    type: String,
    unique: true
  },
  replicatedSiteName: {
    type: String,
    unique: true,
    sparse: true, // allows multiple null values
    validate: {
      validator: function(v) {
        // Allow null or empty string, otherwise validate
        if (v === null || v === '') return true;
        return /^[a-z0-9-]+$/.test(v); // lowercase alphanumeric and dashes only
      },
      message: props => `${props.value} is not a valid site name. Use only lowercase letters, numbers, and dashes.`
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    // If password not modified, check if replicatedSiteName needs defaulting
    if (this.isNew && !this.replicatedSiteName) {
      // Generate default based on name or random if needed
      this.replicatedSiteName = `${this.firstName.toLowerCase()}-${this.lastName.toLowerCase()}-${crypto.randomBytes(3).toString('hex')}`.replace(/[^a-z0-9-]/g, '-');
      // Check uniqueness again after default generation
      const existingSite = await this.constructor.findOne({ replicatedSiteName: this.replicatedSiteName });
      if (existingSite) {
          // If default conflicts, generate purely random
          this.replicatedSiteName = crypto.randomBytes(10).toString('hex');
      }
    }
    return next();
  }
  
  // Generate referral code if it doesn't exist
  if (!this.referralCode) {
    this.referralCode = crypto.randomBytes(10).toString('hex');
  }

  // Generate default replicatedSiteName if it doesn't exist and user is new
  if (this.isNew && !this.replicatedSiteName) {
      this.replicatedSiteName = `${this.firstName.toLowerCase()}-${this.lastName.toLowerCase()}-${crypto.randomBytes(3).toString('hex')}`.replace(/[^a-z0-9-]/g, '-');
      const existingSite = await this.constructor.findOne({ replicatedSiteName: this.replicatedSiteName });
      if (existingSite) {
          this.replicatedSiteName = crypto.randomBytes(10).toString('hex');
      }
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  const expiresIn = process.env.JWT_EXPIRE || '30d'; // Add default fallback
  if (!validateJwtExpire(expiresIn)) {
    console.warn(`Invalid JWT_EXPIRE value: ${expiresIn}. Using default of 30d`);
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  }
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
