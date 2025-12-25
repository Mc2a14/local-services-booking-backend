const express = require('express');
const authRoutes = require('./auth');
const providerRoutes = require('./providers');
const serviceRoutes = require('./services');
const bookingRoutes = require('./bookings');
const businessInfoRoutes = require('./businessInfo');
const aiRoutes = require('./ai');
const availabilityRoutes = require('./availability');
const reviewRoutes = require('./reviews');
const faqRoutes = require('./faqs');
const publicRoutes = require('./public');

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/providers', providerRoutes);
router.use('/services', serviceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/business-info', businessInfoRoutes);
router.use('/ai', aiRoutes);
router.use('/availability', availabilityRoutes);
router.use('/reviews', reviewRoutes);
router.use('/faqs', faqRoutes);
router.use('/public', publicRoutes);

module.exports = router;

