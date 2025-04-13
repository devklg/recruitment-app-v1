const mongoose = require('mongoose');

const PreEnrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  queuePosition: {
    type: Number,
    required: true
  },
  tentativeParent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tentativePosition: {
    type: String,
    enum: ['left', 'right']
  },
  status: {
    type: String,
    enum: ['waiting', 'processing', 'converted', 'expired'],
    default: 'waiting'
  },
  expiryDate: {
    type: Date,
    required: true
  },
  placementPreference: {
    type: String,
    enum: ['auto', 'left', 'right'],
    default: 'auto'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PreEnrollment', PreEnrollmentSchema);
