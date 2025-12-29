const express = require('express');
const availabilityController = require('../controllers/availabilityController');
const { authenticate, requireProvider } = require('../middleware/auth');

const router = express.Router();

// Provider routes (protected)
router.post('/', authenticate, requireProvider, availabilityController.setAvailability);
router.get('/', authenticate, requireProvider, availabilityController.getAvailability);
router.post('/block', authenticate, requireProvider, availabilityController.blockDate);
router.get('/blocked', authenticate, requireProvider, availabilityController.getBlockedDates);
router.delete('/blocked/:id', authenticate, requireProvider, availabilityController.unblockDate);

// Public route - get available time slots
router.get('/:provider_id/slots', availabilityController.getAvailableTimeSlots);

module.exports = router;



