const express = require('express');
const { body } = require('express-validator');
const {
  getSavedPlaces,
  toggleSavePlace,
  removeSavedPlace
} = require('../controllers/savedController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const saveValidation = [
  body('placeId')
    .isMongoId()
    .withMessage('Valid place ID is required')
];

router.get('/', authMiddleware, getSavedPlaces);
router.post('/', authMiddleware, saveValidation, toggleSavePlace);
router.delete('/:id', authMiddleware, removeSavedPlace);

module.exports = router;