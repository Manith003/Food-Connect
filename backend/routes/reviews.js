const express = require('express');
const { body } = require('express-validator');
const {
  getReviewsByPlace,
  addReview,
  updateReview,
  deleteReview,
  toggleLike
} = require('../controllers/reviewsController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('text')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review text must be between 10 and 1000 characters')
];

router.get('/place/:placeId', getReviewsByPlace);
router.post('/', authMiddleware, reviewValidation, addReview);
router.put('/:id', authMiddleware, reviewValidation, updateReview);
router.delete('/:id', authMiddleware, deleteReview);
router.post('/:id/like', authMiddleware, toggleLike);

module.exports = router;