// backend/models/CommunityMessage.js
const mongoose = require('mongoose');

const communityMessageSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    attachedPlaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place'
    },

    // Optional: message type for richer chat (still defaults to simple text)
    messageType: {
      type: String,
      enum: ['text', 'poll', 'event', 'foodSpot'],
      default: 'text'
    },

    // Optional: flexible extra data (e.g., poll IDs, event time, etc.)
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for faster message retrieval by community and time
communityMessageSchema.index({ communityId: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityMessage', communityMessageSchema);
