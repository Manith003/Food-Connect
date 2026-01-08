const SavedPlace = require('../models/SavedPlace');
const Place = require('../models/Place');

// @desc    Get user's saved places
// @route   GET /api/saved
// @access  Private
exports.getSavedPlaces = async (req, res, next) => {
  try {
    const savedPlaces = await SavedPlace.find({ userId: req.user.id })
      .populate('placeId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: savedPlaces.length,
      data: savedPlaces.map(sp => ({
        ...sp.placeId.toObject(),
        savedAt: sp.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/unsave a place
// @route   POST /api/saved
// @access  Private
exports.toggleSavePlace = async (req, res, next) => {
  try {
    const { placeId } = req.body;

    // Check if place exists
    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    // Check if already saved
    const existingSave = await SavedPlace.findOne({
      userId: req.user.id,
      placeId
    });

    if (existingSave) {
      // Unsave
      await existingSave.deleteOne();
      
      res.status(200).json({
        success: true,
        message: 'Place unsaved successfully',
        isSaved: false
      });
    } else {
      // Save
      await SavedPlace.create({
        userId: req.user.id,
        placeId
      });

      res.status(201).json({
        success: true,
        message: 'Place saved successfully',
        isSaved: true
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Remove saved place
// @route   DELETE /api/saved/:id
// @access  Private
exports.removeSavedPlace = async (req, res, next) => {
  try {
    const savedPlace = await SavedPlace.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!savedPlace) {
      return res.status(404).json({
        success: false,
        message: 'Saved place not found'
      });
    }

    await savedPlace.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Place removed from saved list'
    });
  } catch (error) {
    next(error);
  }
};