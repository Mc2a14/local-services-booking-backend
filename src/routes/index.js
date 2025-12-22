const express = require('express');
const authRoutes = require('./auth');

const router = express.Router();

// API routes
router.use('/auth', authRoutes);

module.exports = router;

