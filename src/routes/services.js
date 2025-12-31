const express = require('express');
const serviceController = require('../controllers/serviceController');
const { authenticate, requireProvider } = require('../middleware/auth');

const router = express.Router();

// Public routes (for customers to browse)
router.get('/browse', serviceController.browseServices);
router.get('/:id', serviceController.getService);

// Protected routes (for providers)
router.post('/', authenticate, requireProvider, serviceController.createService);
router.get('/', authenticate, requireProvider, serviceController.getMyServices);
router.put('/:id', authenticate, requireProvider, serviceController.updateService);
router.delete('/:id', authenticate, requireProvider, serviceController.deleteService);

module.exports = router;




