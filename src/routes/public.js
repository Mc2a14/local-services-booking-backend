const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

// Public business page by slug
router.get('/b/:slug', publicController.getBusinessBySlug);

module.exports = router;


