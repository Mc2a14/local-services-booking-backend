const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticate, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/service/:serviceId', reviewController.getServiceReviews);
router.get('/service/:serviceId/rating', reviewController.getServiceRating);
router.get('/provider/:providerId', reviewController.getProviderReviews);
router.get('/provider/:providerId/rating', reviewController.getProviderRating);

// Protected routes (customer only)
router.post('/', authenticate, requireCustomer, reviewController.createReview);
router.put('/:id', authenticate, requireCustomer, reviewController.updateReview);
router.delete('/:id', authenticate, requireCustomer, reviewController.deleteReview);

module.exports = router;




