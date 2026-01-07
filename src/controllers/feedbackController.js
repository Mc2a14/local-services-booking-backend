const feedbackService = require('../services/feedbackService');
const providerService = require('../services/providerService');

// Submit feedback for a completed appointment (no auth required - public endpoint)
const submitFeedback = async (req, res) => {
  try {
    const { appointment_id, rating, comment } = req.body;

    if (!appointment_id || !rating) {
      return res.status(400).json({ error: 'appointment_id and rating are required' });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const feedback = await feedbackService.submitFeedback(appointment_id, rating, comment);

    res.status(201).json({
      message: 'Thank you! Your feedback helps improve the service.',
      feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('not completed') ||
        error.message.includes('already submitted')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all feedback for a business (business owner only - requires auth)
const getBusinessFeedback = async (req, res) => {
  try {
    // Verify provider exists and get business_id
    const provider = await providerService.getProviderByUserId(req.user.id);
    
    const feedback = await feedbackService.getBusinessFeedback(provider.id);

    res.json({ feedback });
  } catch (error) {
    console.error('Get business feedback error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if feedback exists for an appointment (no auth required)
const checkFeedback = async (req, res) => {
  try {
    const { appointment_id } = req.params;

    if (!appointment_id) {
      return res.status(400).json({ error: 'appointment_id is required' });
    }

    const feedback = await feedbackService.getFeedbackByAppointmentId(appointment_id);

    res.json({ 
      exists: feedback !== null,
      feedback: feedback || null
    });
  } catch (error) {
    console.error('Check feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  submitFeedback,
  getBusinessFeedback,
  checkFeedback
};




