const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Place name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  vegFlag: {
    type: Boolean,
    required: true
  },
  priceRange: {
    type: String,
    enum: ['₹', '₹₹', '₹₹₹', '₹₹₹₹'],
    required: true
  },
  cuisine: {
    type: String,
    required: [true, 'Cuisine is required']
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required']
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  landmark: {
    type: String,
    required: [true, 'Landmark is required']
  },
  googleMapsUrl: {
    type: String
  },
  openingHours: {
    open: { type: String, required: true },
    close: { type: String, required: true }
  },
  contact: {
    phone: String,
    email: String
  },
  images: [{
    type: String // Paths to image files
  }],
  menu: [{
    category: {
      type: String,
      required: true
    },
    items: [{
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      description: String,
      veg: {
        type: Boolean,
        default: true
      }
    }]
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for geospatial queries
placeSchema.index({ location: '2dsphere' });

// Virtual for location coordinates
placeSchema.virtual('location').get(function() {
  return {
    type: 'Point',
    coordinates: [this.longitude, this.latitude]
  };
});

module.exports = mongoose.model('Place', placeSchema);