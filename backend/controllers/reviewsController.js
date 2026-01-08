const Review = require('../models/Review');
const { validationResult } = require('express-validator');

// @desc    Get reviews for a place
// @route   GET /api/reviews/place/:placeId
// @access  Public
exports.getReviewsByPlace = async (req, res, next) => {
  try {
    const reviews = await Review.find({ placeId: req.params.placeId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review
// @route   POST /api/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { placeId, rating, text } = req.body;

    // Check if user already reviewed this place
    const existingReview = await Review.findOne({
      placeId,
      userId: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this place'
      });
    }

    const review = await Review.create({
      placeId,
      userId: req.user.id,
      rating,
      text
    });

    await review.populate('userId', 'name');

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Make sure user owns the review or is admin
    if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    review = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('userId', 'name');

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Make sure user owns the review or is admin
    if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/unlike a review
// @route   POST /api/reviews/:id/like
// @access  Private
exports.toggleLike = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const hasLiked = review.likes.includes(req.user.id);

    if (hasLiked) {
      // Unlike
      review.likes = review.likes.filter(
        like => like.toString() !== req.user.id
      );
    } else {
      // Like
      review.likes.push(req.user.id);
    }

    await review.save();

    res.status(200).json({
      success: true,
      data: {
        likes: review.likes.length,
        hasLiked: !hasLiked
      }
    });
  } catch (error) {
    next(error);
  }
};