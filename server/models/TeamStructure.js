const mongoose = require('mongoose');

const TeamStructureSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  position: {
    type: String,
    enum: ['left', 'right', 'root'],
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  leftLeg: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rightLeg: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  enrollmentOrder: {
    type: Number,
    required: true
  },
  leftLegVolume: {
    type: Number,
    default: 0
  },
  rightLegVolume: {
    type: Number,
    default: 0
  },
  leftLegCount: {
    type: Number,
    default: 0
  },
  rightLegCount: {
    type: Number,
    default: 0
  },
  totalTeamSize: {
    type: Number,
    default: 1 // Starts at 1 to include self
  },
  depth: {
    type: Number,
    default: 0 // Root is 0, direct children are 1, etc.
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TeamStructure', TeamStructureSchema);
