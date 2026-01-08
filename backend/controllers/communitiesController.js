// backend/controllers/communitiesController.js
const Community = require('../models/Community');
const CommunityMessage = require('../models/CommunityMessage');
const { validationResult } = require('express-validator');

// Helper: check if user is in members array (ObjectId[] vs string id)
const isUserInMembers = (members, userId) =>
  members.some((m) => m.toString() === userId);

// @desc    Get user's communities
// @route   GET /api/communities/my
// @access  Private
exports.getMyCommunities = async (req, res, next) => {
  try {
    const communities = await Community.find({
      members: req.user.id,
      isActive: true,
    })
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

// @desc    Get public communities (that user is not already in)
// @route   GET /api/communities/public
// @access  Private
exports.getPublicCommunities = async (req, res, next) => {
  try {
    const pageNum = parseInt(req.query.page, 10) || 1;
    const limitNum = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';

    const query = {
      isActive: true,
      isPrivate: false,
      members: { $ne: req.user.id }, // user is not a member yet
    };

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
      ];
    }

    const communities = await Community.find(query)
      .populate('createdBy', 'name')
      .populate('members', 'name')
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ members: -1, createdAt: -1 });

    const total = await Community.countDocuments(query);

    res.status(200).json({
      success: true,
      count: communities.length,
      total,
      pagination: {
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
      data: communities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create community (public or private)
// @route   POST /api/communities
// @access  Private
exports.createCommunity = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      name,
      description,
      isPrivate = false,
      password,
      tags,
      maxMembers,
    } = req.body;

    // Validate password for private communities
    if (isPrivate && (!password || password.length < 4)) {
      return res.status(400).json({
        success: false,
        message:
          'Private communities require a password of at least 4 characters',
      });
    }

    // Create community instance
    const community = new Community({
      name,
      description,
      isPrivate,
      createdBy: req.user.id,
      tags,
      maxMembers,
    });

    // If private, hash and set password
    if (isPrivate) {
      await community.setPassword(password);
    }

    await community.save();

    await community.populate('createdBy', 'name');
    await community.populate('members', 'name');

    const communityResponse = community.toJSON(); // hides passwordHash

    res.status(201).json({
      success: true,
      data: communityResponse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get community details
// @route   GET /api/communities/:id
// @access  Private
exports.getCommunity = async (req, res, next) => {
  try {
    const community = await Community.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .populate('createdBy', 'name')
      .populate('members', 'name');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    const isMember = community.members.some(
      (member) => member._id.toString() === req.user.id
    );
    const isAdmin = req.user.role === 'admin';
    const isCreator = community.createdBy._id.toString() === req.user.id;

    let communityData;

    if (isMember || isAdmin || isCreator) {
      // Full data for members/admin/creator
      communityData = community.toJSON();
    } else {
      // Limited info for non-members
      communityData = {
        _id: community._id,
        name: community.name,
        description: community.description,
        isPrivate: community.isPrivate,
        memberCount: community.members.length,
        createdBy: community.createdBy,
        tags: community.tags,
        maxMembers: community.maxMembers,
        canJoin: true,
        requiresPassword: community.isPrivate,
      };
    }

    res.status(200).json({
      success: true,
      data: communityData,
      isMember,
      canJoin: !isMember,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join community (public or private)
// @route   POST /api/communities/:id/join
// @access  Private
exports.joinCommunity = async (req, res, next) => {
  try {
    const { password } = req.body;

    const community = await Community.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    // Already member
    if (isUserInMembers(community.members, req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this community',
      });
    }

    // Capacity check
    if (
      typeof community.maxMembers === 'number' &&
      community.members.length >= community.maxMembers
    ) {
      return res.status(400).json({
        success: false,
        message: 'Community has reached maximum member limit',
      });
    }

    // Private community → require password
    if (community.isPrivate) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to join this private community',
          requiresPassword: true,
        });
      }

      const isPasswordValid = await community.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password for this private community',
        });
      }
    }

    // Add user to members
    community.members.push(req.user.id);
    await community.save();

    await community.populate('createdBy', 'name');
    await community.populate('members', 'name');

    res.status(200).json({
      success: true,
      message: 'Successfully joined the community',
      data: community.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join community via invite code
// @route   POST /api/communities/invite/:inviteCode
// @access  Private
exports.joinByInviteCode = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { inviteCode } = req.params;

    const community = await Community.findOne({
      inviteCode,
      isActive: true,
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code or community not found',
      });
    }

    // Already member
    if (isUserInMembers(community.members, req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this community',
      });
    }

    // Capacity check
    if (
      typeof community.maxMembers === 'number' &&
      community.members.length >= community.maxMembers
    ) {
      return res.status(400).json({
        success: false,
        message: 'Community has reached maximum member limit',
      });
    }

    // Private via invite
    if (community.isPrivate && password) {
      const isPasswordValid = await community.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password for this private community',
        });
      }
    } else if (community.isPrivate && !password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to join this private community',
        requiresPassword: true,
      });
    }

    community.members.push(req.user.id);
    await community.save();

    await community.populate('createdBy', 'name');
    await community.populate('members', 'name');

    res.status(200).json({
      success: true,
      message: 'Successfully joined the community using invite code',
      data: community.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave community
// @route   POST /api/communities/:id/leave
// @access  Private
exports.leaveCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    // Check membership
    if (!isUserInMembers(community.members, req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this community',
      });
    }

    // Remove user from members
    community.members = community.members.filter(
      (member) => member.toString() !== req.user.id
    );

    // If no members left, deactivate
    if (community.members.length === 0) {
      community.isActive = false;
    }

    await community.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left the community',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update community settings (creator/admin only)
// @route   PUT /api/communities/:id/settings
// @access  Private
exports.updateCommunitySettings = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    const isCreator = community.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only community creator or admin can update settings',
      });
    }

    const { name, description, isPrivate, password, tags, maxMembers } =
      req.body;

    if (name) community.name = name;
    if (description) community.description = description;
    if (tags) community.tags = tags;
    if (maxMembers) community.maxMembers = maxMembers;

    // Handle privacy and password changes
    if (typeof isPrivate === 'boolean') {
      community.isPrivate = isPrivate;
      if (isPrivate && password) {
        // set & hash new password
        await community.setPassword(password);
      } else if (!isPrivate) {
        community.passwordHash = undefined;
      }
    }

    await community.save();
    await community.populate('createdBy', 'name');
    await community.populate('members', 'name');

    res.status(200).json({
      success: true,
      message: 'Community settings updated successfully',
      data: community.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get community messages
// @route   GET /api/communities/:id/messages
// @access  Private
exports.getCommunityMessages = async (req, res, next) => {
  try {
    const community = await Community.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    // Must be member or admin
    if (
      !isUserInMembers(community.members, req.user.id) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this community',
      });
    }

    const limitNum = parseInt(req.query.limit, 10) || 50;
    const before = req.query.before || null;

    const query = {
      communityId: req.params.id,
      isDeleted: false,
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await CommunityMessage.find(query)
      .populate('userId', 'name')
      .populate('attachedPlaceId', 'name images')
      .sort({ createdAt: -1 })
      .limit(limitNum);

    const ordered = messages.reverse();

    res.status(200).json({
      success: true,
      count: ordered.length,
      data: ordered,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message to community
// @route   POST /api/communities/:id/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const community = await Community.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    // Must be member
    if (!isUserInMembers(community.members, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this community',
      });
    }

    const { text, attachedPlaceId } = req.body;

    const message = await CommunityMessage.create({
      communityId: req.params.id,
      userId: req.user.id,
      text,
      attachedPlaceId,
    });

    await message.populate('userId', 'name');
    await message.populate('attachedPlaceId', 'name images');

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};
// Add to communitiesController.js

// @desc    Delete a community message
// @route   DELETE /api/communities/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await CommunityMessage.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender or admin
    const isSender = message.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSender && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    // Soft delete by marking as deleted
    message.isDeleted = true;
    message.text = '[This message has been deleted]';
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
