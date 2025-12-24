const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { authenticateToken } = require('../middleware/auth');

// All FAQ routes require authentication
router.use(authenticateToken);

// Get all FAQs for the logged-in provider
router.get('/', faqController.getMyFAQs);

// Create a new FAQ
router.post('/', faqController.createFAQ);

// Update an FAQ
router.put('/:id', faqController.updateFAQ);

// Delete an FAQ
router.delete('/:id', faqController.deleteFAQ);

module.exports = router;

