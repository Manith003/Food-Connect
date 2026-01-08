const express = require('express');
const { body } = require('express-validator');
const {
  getPlaces,
  getPlace,
  createPlace,
  updatePlace,
  deletePlace,
  getNearbyPlaces
} = require('../controllers/placesController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// Validation rules
const placeValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('vegFlag')
    .isBoolean()
    .withMessage('Veg flag must be a boolean'),
  body('priceRange')
    .isIn(['₹', '₹₹', '₹₹₹', '₹₹₹₹'])
    .withMessage('Invalid price range'),
  body('cuisine')
    .trim()
    .notEmpty()
    .withMessage('Cuisine is required'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('landmark')
    .trim()
    .notEmpty()
    .withMessage('Landmark is required')
];

router.get('/', optionalAuth, getPlaces);
router.get('/nearby', getNearbyPlaces);
router.get('/:id', optionalAuth, getPlace);
router.post('/', authMiddleware, requireAdmin, placeValidation, createPlace);
router.put('/:id', authMiddleware, requireAdmin, placeValidation, updatePlace);
router.delete('/:id', authMiddleware, requireAdmin, deletePlace);

module.exports = router;