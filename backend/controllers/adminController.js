// backend/controllers/adminController.js
const User = require('../models/User');
const Place = require('../models/Place');
const Community = require('../models/Community');
const Review = require('../models/Review');
const Poll = require('../models/Poll');
const PollOption = require('../models/PollOption');
const PollVote = require('../models/PollVote');
const CommunityMessage = require('../models/CommunityMessage');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role or status
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;

    // Build update object only with fields that are actually provided
    const update = {};
    if (typeof role !== 'undefined') update.role = role;
    if (typeof isActive !== 'undefined') update.isActive = isActive;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all communities
// @route   GET /api/admin/communities
// @access  Private/Admin
exports.getCommunities = async (req, res, next) => {
  try {
    const communities = await Community.find()
      .populate('createdBy', 'name')
      .populate('members', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: communities.length,
      data: communities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete community
// @route   DELETE /api/admin/communities/:id
// @access  Private/Admin
exports.deleteCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    await community.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Community deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete message (soft delete)
// @route   DELETE /api/admin/messages/:messageId
// @access  Private/Admin
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await CommunityMessage.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    message.isDeleted = true;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review (admin moderation)
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const placeId = review.placeId;

    await review.deleteOne();

    // Recalculate averageRating and reviewCount for the place
    const stats = await Review.aggregate([
      { $match: { placeId } },
      {
        $group: {
          _id: '$placeId',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Place.findByIdAndUpdate(placeId, {
        averageRating: stats[0].avgRating,
        reviewCount: stats[0].reviewCount,
      });
    } else {
      // No reviews left for this place
      await Place.findByIdAndUpdate(placeId, {
        averageRating: 0,
        reviewCount: 0,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a poll (admin moderation)
// @route   DELETE /api/admin/polls/:id
// @access  Private/Admin
exports.deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    // Delete options and votes related to this poll
    await PollOption.deleteMany({ pollId: poll._id });
    await PollVote.deleteMany({ pollId: poll._id });
    await poll.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Poll deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close a poll (disable further voting)
// @route   PUT /api/admin/polls/:id/close
// @access  Private/Admin
exports.closePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    res.status(200).json({
      success: true,
      data: poll,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getReports = async (req, res, next) => {
  try {
    // Most liked places
    const mostLikedPlaces = await Place.find()
      .sort({ likeCount: -1 })
      .limit(10)
      .select('name likeCount averageRating reviewCount');

    // Most reviewed places
    const mostReviewedPlaces = await Place.find()
      .sort({ reviewCount: -1 })
      .limit(10)
      .select('name likeCount averageRating reviewCount');

    // Most active communities
    const mostActiveCommunities = await Community.aggregate([
      {
        $lookup: {
          from: 'communitymessages',
          localField: '_id',
          foreignField: 'communityId',
          as: 'messages',
        },
      },
      {
        $addFields: {
          messageCount: { $size: '$messages' },
          memberCount: { $size: '$members' },
        },
      },
      {
        $sort: { messageCount: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          name: 1,
          description: 1,
          memberCount: 1,
          messageCount: 1,
        },
      },
    ]);

    // User statistics
    const userStatsAgg = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ['$isActive', 1, 0] },
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] },
          },
        },
      },
    ]);

    const userStats = userStatsAgg[0] || {
      totalUsers: 0,
      activeUsers: 0,
      adminUsers: 0,
    };

    // Place statistics
    const placeStatsAgg = await Place.aggregate([
      {
        $group: {
          _id: null,
          totalPlaces: { $sum: 1 },
          avgRating: { $avg: '$averageRating' },
          totalLikes: { $sum: '$likeCount' },
          totalReviews: { $sum: '$reviewCount' },
        },
      },
    ]);

    const placeStats = placeStatsAgg[0] || {
      totalPlaces: 0,
      avgRating: 0,
      totalLikes: 0,
      totalReviews: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        mostLikedPlaces,
        mostReviewedPlaces,
        mostActiveCommunities,
        userStats,
        placeStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
