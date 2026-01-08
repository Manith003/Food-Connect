const mongoose = require('mongoose');

const savedPlaceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  placeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique saves
savedPlaceSchema.index({ userId: 1, placeId: 1 }, { unique: true });

// Update place like count when saved
savedPlaceSchema.post('save', async function() {
  await this.constructor.updateLikeCount(this.placeId);
});

savedPlaceSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await doc.constructor.updateLikeCount(doc.placeId);
  }
});

// Static method to update like count
savedPlaceSchema.statics.updateLikeCount = async function(placeId) {
  const likeCount = await this.countDocuments({ placeId });
  await mongoose.model('Place').findByIdAndUpdate(placeId, { likeCount });
};

module.exports = mongoose.model('SavedPlace', savedPlaceSchema);