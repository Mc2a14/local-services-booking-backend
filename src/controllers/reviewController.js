const reviewService = require('../services/reviewService');

// Create a review
const createReview = async (req, res) => {
  try {
    const { booking_id, service_id, provider_id, rating, comment } = req.body;

    // Validation
    if (!booking_id || !service_id || !provider_id || !rating) {
      return res.status(400).json({ error: 'booking_id, service_id, provider_id, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const review = await reviewService.createReview({
      booking_id,
      customer_id: req.user.id,
      service_id,
      provider_id,
      rating,
      comment
    });

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    
    if (error.message === 'Booking not found or unauthorized' || 
        error.message === 'Can only review completed bookings' ||
        error.message === 'Review already exists for this booking') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews for a service
const getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const reviews = await reviewService.getServiceReviews(parseInt(serviceId));

    res.json({ reviews });
  } catch (error) {
    console.error('Get service reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews for a provider
const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    const reviews = await reviewService.getProviderReviews(parseInt(providerId));

    res.json({ reviews });
  } catch (error) {
    console.error('Get provider reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get average rating for a service
const getServiceRating = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const rating = await reviewService.getServiceAverageRating(parseInt(serviceId));

    res.json({ rating });
  } catch (error) {
    console.error('Get service rating error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get average rating for a provider
const getProviderRating = async (req, res) => {
  try {
    const { providerId } = req.params;
    const rating = await reviewService.getProviderAverageRating(parseInt(providerId));

    res.json({ rating });
  } catch (error) {
    console.error('Get provider rating error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({ error: 'rating is required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const review = await reviewService.updateReview(parseInt(id), req.user.id, rating, comment);

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    
    if (error.message === 'Review not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    await reviewService.deleteReview(parseInt(id), req.user.id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    
    if (error.message === 'Review not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createReview,
  getServiceReviews,
  getProviderReviews,
  getServiceRating,
  getProviderRating,
  updateReview,
  deleteReview
};

