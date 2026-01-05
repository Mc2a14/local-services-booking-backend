const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const { authenticate, requireProvider } = require('../middleware/auth');

const router = express.Router();

// Public route - submit feedback (no auth required)
router.post('/', feedbackController.submitFeedback);

// Public route - check if feedback exists for an appointment
router.get('/check/:appointment_id', feedbackController.checkFeedback);

// Business owner route - get all feedback for their business (requires auth)
router.get('/business', authenticate, requireProvider, feedbackController.getBusinessFeedback);

module.exports = router;



