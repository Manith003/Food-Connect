// backend/routes/communities.js
const express = require('express');
const { body } = require('express-validator');
const {
  getMyCommunities,
  getPublicCommunities,
  createCommunity,
  getCommunity,
  joinCommunity,
  joinByInviteCode,
  leaveCommunity,
  updateCommunitySettings,
  getCommunityMessages,
  sendMessage,
  deleteMessage
} = require('../controllers/communitiesController');
const {
  getCommunityPolls,
  createPoll
} = require('../controllers/pollsController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * Validation rules for creating/updating a community
 * (used for POST / and PUT /:id/settings)
 */
const communityValidation = [
  body('name')
    .optional() // optional for settings update
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Description must be between 10 and 200 characters'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters long'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 200 })
    .withMessage('Max members must be between 2 and 200')
];

/**
 * Validation rules for sending a message
 */
const messageValidation = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters')
];

/**
 * Validation rules for joining (private) communities
 * (used for POST /:id/join and POST /invite/:inviteCode)
 */
const joinValidation = [
  body('password')
    .optional()
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters long')
];

/**
 * Validation rules for poll creation in a community
 */
const pollValidation = [
  body('question')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Question must be between 5 and 200 characters'),
  body('options')
    .isArray({ min: 2, max: 6 })
    .withMessage('Poll must have between 2 and 6 options'),
  body('options.*')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each option must be between 1 and 100 characters')
];

// -------------------- Community routes --------------------

// Get communities the current user is a member of
router.get('/my', authMiddleware, getMyCommunities);

// Discover public communities the user is not in yet
router.get('/public', authMiddleware, getPublicCommunities);

// Create a community (public or private)
router.post('/', authMiddleware, communityValidation, createCommunity);

// Join a community by ID (handles public + private with password)
router.post('/:id/join', authMiddleware, joinValidation, joinCommunity);

// Join a community via invite code (with optional password)
router.post('/invite/:inviteCode', authMiddleware, joinValidation, joinByInviteCode);

// Get community details
router.get('/:id', authMiddleware, getCommunity);

// Leave a community
router.post('/:id/leave', authMiddleware, leaveCommunity);

// Update community settings (creator/admin only)
router.put('/:id/settings', authMiddleware, communityValidation, updateCommunitySettings);

// Get messages in a community
router.get('/:id/messages', authMiddleware, getCommunityMessages);

// Send message to a community
router.post('/:id/messages', authMiddleware, messageValidation, sendMessage);
// Add to communities.js routes
router.delete('/messages/:messageId', authMiddleware, deleteMessage);

// -------------------- Community poll routes --------------------
// This router is mounted at /api/communities in server.js,
// so these become:
//  GET  /api/communities/:id/polls
//  POST /api/communities/:id/polls

router.get('/:id/polls', authMiddleware, getCommunityPolls);
router.post('/:id/polls', authMiddleware, pollValidation, createPoll);

module.exports = router;
