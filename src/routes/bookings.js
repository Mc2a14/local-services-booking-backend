const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authenticate, requireProvider, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Public route - guest booking (no auth required)
router.post('/guest', bookingController.createGuestBooking);
router.get('/guest/email', bookingController.getBookingsByEmail); // Look up bookings by email

// Customer routes (require auth)
router.post('/', authenticate, requireCustomer, bookingController.createBooking);
router.get('/my-bookings', authenticate, requireCustomer, bookingController.getMyBookings);
router.get('/:id', authenticate, bookingController.getBooking);
router.put('/:id/cancel', authenticate, requireCustomer, bookingController.cancelBooking);

// Provider routes
router.get('/provider/my-bookings', authenticate, requireProvider, bookingController.getProviderBookings);
router.put('/:id/status', authenticate, requireProvider, bookingController.updateBookingStatus);

module.exports = router;


