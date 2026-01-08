const Place = require('../models/Place');
const Review = require('../models/Review');
const SavedPlace = require('../models/SavedPlace');
const { validationResult } = require('express-validator');

// @desc    Get all places with filtering
// @route   GET /api/places
// @access  Public
exports.getPlaces = async (req, res, next) => {
  try {
    const {
      veg,
      cuisine,
      priceRange,
      rating,
      search,
      page = 1,
      limit = 12,
      sort = 'averageRating'
    } = req.query;

    // Build query
    let query = {};

    // Veg filter
    if (veg !== undefined) {
      query.vegFlag = veg === 'true';
    }

    // Cuisine filter
    if (cuisine) {
      query.cuisine = new RegExp(cuisine, 'i');
    }

    // Price range filter
    if (priceRange) {
      query.priceRange = priceRange;
    }

    // Rating filter
    if (rating) {
      query.averageRating = { $gte: parseFloat(rating) };
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { cuisine: new RegExp(search, 'i') }
      ];
    }

    // Execute query with pagination
    const places = await Place.find(query)
      .sort(sort === 'distance' ? {} : { [sort]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Place.countDocuments(query);

    // Check if user has saved each place
    let placesWithSaved = places;
    if (req.user) {
      const savedPlaces = await SavedPlace.find({ userId: req.user.id });
      const savedPlaceIds = savedPlaces.map(sp => sp.placeId.toString());
      
      placesWithSaved = places.map(place => ({
        ...place.toObject(),
        isSaved: savedPlaceIds.includes(place._id.toString())
      }));
    }

    res.status(200).json({
      success: true,
      count: places.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      data: placesWithSaved
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single place
// @route   GET /api/places/:id
// @access  Public
exports.getPlace = async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id);
    
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    let placeData = place.toObject();

    // Check if user has saved this place
    if (req.user) {
      const saved = await SavedPlace.findOne({
        userId: req.user.id,
        placeId: place._id
      });
      placeData.isSaved = !!saved;
    }

    res.status(200).json({
      success: true,
      data: placeData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new place
// @route   POST /api/places
// @access  Private/Admin
exports.createPlace = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const place = await Place.create(req.body);

    res.status(201).json({
      success: true,
      data: place
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update place
// @route   PUT /api/places/:id
// @access  Private/Admin
exports.updatePlace = async (req, res, next) => {
  try {
    let place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    place = await Place.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: place
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete place
// @route   DELETE /api/places/:id
// @access  Private/Admin
exports.deletePlace = async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    // Delete associated reviews and saved places
    await Review.deleteMany({ placeId: place._id });
    await SavedPlace.deleteMany({ placeId: place._id });

    await place.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Place deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby places
// @route   GET /api/places/nearby
// @access  Public
exports.getNearbyPlaces = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // radius in kilometers

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    const places = await Place.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert to meters
        }
      }
    }).limit(20);

    res.status(200).json({
      success: true,
      count: places.length,
      data: places
    });
  } catch (error) {
    next(error);
  }
};