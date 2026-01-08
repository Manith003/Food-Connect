const mongoose = require('mongoose');

const pollVoteSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PollOption',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one vote per user per poll
pollVoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

// Update option vote count when vote is cast
pollVoteSchema.post('save', async function() {
  await this.constructor.updateOptionVoteCount(this.optionId);
});

pollVoteSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await doc.constructor.updateOptionVoteCount(doc.optionId);
  }
});

// Static method to update option vote count
pollVoteSchema.statics.updateOptionVoteCount = async function(optionId) {
  const votesCount = await this.countDocuments({ optionId });
  await mongoose.model('PollOption').findByIdAndUpdate(optionId, { votesCount });
};

module.exports = mongoose.model('PollVote', pollVoteSchema);