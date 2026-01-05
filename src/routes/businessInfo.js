const express = require('express');
const businessInfoController = require('../controllers/businessInfoController');
const { authenticate, requireProvider } = require('../middleware/auth');

const router = express.Router();

// All routes require provider authentication
router.post('/', authenticate, requireProvider, businessInfoController.upsertBusinessInfo);
router.put('/', authenticate, requireProvider, businessInfoController.upsertBusinessInfo);
router.get('/me', authenticate, requireProvider, businessInfoController.getMyBusinessInfo);

module.exports = router;






