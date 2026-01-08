// backend/routes/admin.js
const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  updateUser,
  getCommunities,
  deleteCommunity,
  deleteMessage,
  getReports,
  deleteReview,
  deletePoll,
  closePoll
} = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// Validation rules
const userUpdateValidation = [
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// User management
router.get('/users', authMiddleware, requireAdmin, getUsers);
router.put(
  '/users/:id',
  authMiddleware,
  requireAdmin,
  userUpdateValidation,
  updateUser
);

// Community management
router.get('/communities', authMiddleware, requireAdmin, getCommunities);
router.delete(
  '/communities/:id',
  authMiddleware,
  requireAdmin,
  deleteCommunity
);

// Message moderation
router.delete(
  '/messages/:messageId',
  authMiddleware,
  requireAdmin,
  deleteMessage
);

// Review moderation
// DELETE /api/admin/reviews/:id
router.delete(
  '/reviews/:id',
  authMiddleware,
  requireAdmin,
  deleteReview
);

// Poll moderation
// DELETE /api/admin/polls/:id
router.delete(
  '/polls/:id',
  authMiddleware,
  requireAdmin,
  deletePoll
);

// PUT /api/admin/polls/:id/close
router.put(
  '/polls/:id/close',
  authMiddleware,
  requireAdmin,
  closePoll
);

// Reports / analytics
router.get('/reports', authMiddleware, requireAdmin, getReports);

module.exports = router;
