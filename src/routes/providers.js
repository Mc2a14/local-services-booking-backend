const express = require('express');
const providerController = require('../controllers/providerController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.post('/', authenticate, providerController.createProvider);
router.get('/me', authenticate, providerController.getMyProvider);
router.put('/me', authenticate, providerController.updateMyProvider);

// Email configuration routes
router.put('/me/email-config', authenticate, providerController.updateEmailConfig);
router.get('/me/email-config', authenticate, providerController.getEmailConfig);

module.exports = router;



