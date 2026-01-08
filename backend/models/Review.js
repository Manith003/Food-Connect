const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  placeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  text: {
    type: String,
    required: [true, 'Review text is required'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Compound index to ensure one review per user per place
reviewSchema.index({ placeId: 1, userId: 1 }, { unique: true });

// Update place rating when review is saved
reviewSchema.post('save', async function() {
  await this.model('Review').updatePlaceRating(this.placeId);
});

reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await doc.model('Review').updatePlaceRating(doc.placeId);
  }
});

// Static method to update place rating
reviewSchema.statics.updatePlaceRating = async function(placeId) {
  const stats = await this.aggregate([
    { $match: { placeId } },
    {
      $group: {
        _id: '$placeId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Place').findByIdAndUpdate(placeId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount
    });
  } else {
    await mongoose.model('Place').findByIdAndUpdate(placeId, {
      averageRating: 0,
      reviewCount: 0
    });
  }
};

module.exports = mongoose.model('Review', reviewSchema);