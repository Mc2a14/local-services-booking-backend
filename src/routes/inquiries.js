const express = require('express');
const inquiryController = require('../controllers/inquiryController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public route - customers can submit inquiries via chat
router.post('/', inquiryController.createInquiry);

// Authenticated routes - business owners manage inquiries
router.get('/', authenticate, inquiryController.getInquiries);
router.get('/:inquiryId', authenticate, inquiryController.getInquiry);
router.patch('/:inquiryId/status', authenticate, inquiryController.updateInquiryStatus);

module.exports = router;

