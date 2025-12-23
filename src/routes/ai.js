const express = require('express');
const aiController = require('../controllers/aiController');

const router = express.Router();

// Public route - anyone can ask questions about a business
router.post('/chat', aiController.chat);

module.exports = router;


