const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Poll question is required'],
    maxlength: [200, 'Question cannot exceed 200 characters']
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  closesAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Check if poll is expired
pollSchema.virtual('isExpired').get(function() {
  if (!this.closesAt) return false;
  return this.closesAt < new Date();
});

module.exports = mongoose.model('Poll', pollSchema);