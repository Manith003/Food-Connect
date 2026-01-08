// backend/routes/polls.js
const express = require('express');
const { body } = require('express-validator');
const {
  voteInPoll,
  getPollResults,
  deletePoll
} = require('../controllers/pollsController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation rules for voting in a poll
const voteValidation = [
  body('optionId')
    .isMongoId()
    .withMessage('Valid option ID is required')
];

// NOTE:
// This router is mounted in server.js as: app.use('/api/polls', pollsRoutes);
//
// So the full paths are:
//   POST /api/polls/:pollId/vote
//   GET  /api/polls/:pollId/results

// Vote in a poll
router.post('/:pollId/vote', authMiddleware, voteValidation, voteInPoll);

// Get poll results
router.get('/:pollId/results', authMiddleware, getPollResults);

// Add to polls.js routes
router.delete('/:pollId', authMiddleware, deletePoll);

module.exports = router;
