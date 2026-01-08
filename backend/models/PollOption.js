const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Option text is required'],
    maxlength: [100, 'Option text cannot exceed 100 characters']
  },
  votesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PollOption', pollOptionSchema);