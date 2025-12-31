const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

// Search businesses by name
router.get('/search', publicController.searchBusinesses);

// Public business page by slug
router.get('/b/:slug', publicController.getBusinessBySlug);

module.exports = router;



