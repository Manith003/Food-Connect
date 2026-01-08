// backend/controllers/pollsController.js
const { validationResult } = require('express-validator');
const Community = require('../models/Community');
const Poll = require('../models/Poll');
const PollOption = require('../models/PollOption');
const PollVote = require('../models/PollVote');

// @desc    Get polls for a community
// @route   GET /api/communities/:id/polls
// @access  Private (member or admin)
exports.getCommunityPolls = async (req, res, next) => {
  try {
    const communityId = req.params.id;

    const community = await Community.findOne({
      _id: communityId,
      isActive: true
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    const userId = req.user._id.toString();
    const isMember =
      community.members.some((m) => m.toString() === userId) ||
      community.createdBy.toString() === userId ||
      req.user.role === 'admin';

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access polls in this community'
      });
    }

    // Get polls in this community
    const polls = await Poll.find({ communityId: communityId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const pollIds = polls.map((p) => p._id);

    // Get all options for these polls
    const options = await PollOption.find({ pollId: { $in: pollIds } }).lean();
    const optionsByPoll = {};
    options.forEach((opt) => {
      const key = opt.pollId.toString();
      if (!optionsByPoll[key]) optionsByPoll[key] = [];
      optionsByPoll[key].push({
        _id: opt._id,
        text: opt.text,
        votesCount: opt.votesCount || 0
      });
    });

    // Get user votes for these polls
    const userVotes = await PollVote.find({
      pollId: { $in: pollIds },
      userId: req.user._id
    }).lean();

    const voteByPoll = {};
    userVotes.forEach((v) => {
      voteByPoll[v.pollId.toString()] = v.optionId;
    });

    const pollsWithStatus = polls.map((poll) => {
      const idStr = poll._id.toString();
      return {
        ...poll,
        options: optionsByPoll[idStr] || [],
        hasVoted: !!voteByPoll[idStr],
        userVoteId: voteByPoll[idStr] || null
      };
    });

    res.status(200).json({
      success: true,
      count: pollsWithStatus.length,
      data: pollsWithStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create poll in a community
// @route   POST /api/communities/:id/polls
// @access  Private (member)
exports.createPoll = async (req, res, next) => {
  try {
    // Validate body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const communityId = req.params.id;
    const { question, options, closesAt } = req.body;

    const community = await Community.findOne({
      _id: communityId,
      isActive: true
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    const userId = req.user._id.toString();
    const isMember =
      community.members.some((m) => m.toString() === userId) ||
      community.createdBy.toString() === userId ||
      req.user.role === 'admin';

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create polls in this community'
      });
    }

    // Create poll
    const poll = await Poll.create({
      question,
      communityId,
      createdBy: req.user._id,
      isActive: true,
      closesAt: closesAt || null
    });

    // Create options
    const optionDocs = await PollOption.insertMany(
      options.map((text) => ({
        pollId: poll._id,
        text,
        votesCount: 0
      }))
    );

    const populatedPoll = await Poll.findById(poll._id)
      .populate('createdBy', 'name')
      .lean();

    populatedPoll.options = optionDocs.map((opt) => ({
      _id: opt._id,
      text: opt.text,
      votesCount: opt.votesCount || 0
    }));

    res.status(201).json({
      success: true,
      data: populatedPoll
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote in poll
// @route   POST /api/polls/:pollId/vote
// @access  Private
exports.voteInPoll = async (req, res, next) => {
  try {
    const { optionId } = req.body;

    const poll = await Poll.findById(req.params.pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if poll is active and not expired
    if (!poll.isActive || (poll.closesAt && poll.closesAt < new Date())) {
      return res.status(400).json({
        success: false,
        message: 'Poll is closed for voting'
      });
    }

    // Check if option belongs to poll
    const option = await PollOption.findOne({
      _id: optionId,
      pollId: poll._id
    });

    if (!option) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option for this poll'
      });
    }

    // Check if user has already voted
    const existingVote = await PollVote.findOne({
      pollId: poll._id,
      userId: req.user._id
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll'
      });
    }

    // Create vote
    await PollVote.create({
      pollId: poll._id,
      optionId,
      userId: req.user._id
    });

    // ⚠️ No need to manually update votesCount here
    // PollVote hooks (post('save')) will call updateOptionVoteCount

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get poll results
// @route   GET /api/polls/:pollId/results
// @access  Private
exports.getPollResults = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.pollId)
      .populate('createdBy', 'name')
      .lean();

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    const options = await PollOption.find({ pollId: poll._id }).lean();

    const totalVotes = options.reduce(
      (sum, opt) => sum + (opt.votesCount || 0),
      0
    );

    const results = options.map((opt) => ({
      _id: opt._id,
      text: opt.text,
      votesCount: opt.votesCount || 0,
      percentage:
        totalVotes > 0 ? (opt.votesCount / totalVotes) * 100 : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        poll,
        results,
        totalVotes
      }
    });
  } catch (error) {
    next(error);
  }
};
// Add to pollsController.js

// @desc    Delete a poll (creator or admin only)
// @route   DELETE /api/polls/:pollId
// @access  Private
exports.deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.pollId);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if user is creator or admin
    const isCreator = poll.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this poll'
      });
    }

    // Delete the poll and its related data
    await Promise.all([
      Poll.deleteOne({ _id: poll._id }),
      PollOption.deleteMany({ pollId: poll._id }),
      PollVote.deleteMany({ pollId: poll._id })
    ]);

    res.status(200).json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
