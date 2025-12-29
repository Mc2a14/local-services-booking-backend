const { query } = require('../db');

// Create a review
const createReview = async (reviewData) => {
  const { booking_id, customer_id, service_id, provider_id, rating, comment } = reviewData;

  // Check if booking exists and belongs to customer
  const bookingCheck = await query(
    'SELECT id, status FROM bookings WHERE id = $1 AND customer_id = $2',
    [booking_id, customer_id]
  );

  if (bookingCheck.rows.length === 0) {
    throw new Error('Booking not found or unauthorized');
  }

  // Check if booking is completed
  if (bookingCheck.rows[0].status !== 'completed') {
    throw new Error('Can only review completed bookings');
  }

  // Check if review already exists
  const existingReview = await query(
    'SELECT id FROM reviews WHERE booking_id = $1',
    [booking_id]
  );

  if (existingReview.rows.length > 0) {
    throw new Error('Review already exists for this booking');
  }

  // Insert review
  const result = await query(
    'INSERT INTO reviews (booking_id, customer_id, service_id, provider_id, rating, comment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [booking_id, customer_id, service_id, provider_id, rating, comment || null]
  );

  return result.rows[0];
};

// Get reviews for a service
const getServiceReviews = async (serviceId) => {
  const result = await query(
    `SELECT r.*, u.full_name as customer_name 
     FROM reviews r 
     JOIN users u ON r.customer_id = u.id 
     WHERE r.service_id = $1 
     ORDER BY r.created_at DESC`,
    [serviceId]
  );

  return result.rows;
};

// Get reviews for a provider
const getProviderReviews = async (providerId) => {
  const result = await query(
    `SELECT r.*, u.full_name as customer_name, s.title as service_title 
     FROM reviews r 
     JOIN users u ON r.customer_id = u.id 
     JOIN services s ON r.service_id = s.id 
     WHERE r.provider_id = $1 
     ORDER BY r.created_at DESC`,
    [providerId]
  );

  return result.rows;
};

// Get average rating for a service
const getServiceAverageRating = async (serviceId) => {
  const result = await query(
    'SELECT AVG(rating) as average_rating, COUNT(*) as review_count FROM reviews WHERE service_id = $1',
    [serviceId]
  );

  return {
    average_rating: result.rows[0].average_rating ? parseFloat(result.rows[0].average_rating).toFixed(1) : null,
    review_count: parseInt(result.rows[0].review_count) || 0
  };
};

// Get average rating for a provider
const getProviderAverageRating = async (providerId) => {
  const result = await query(
    'SELECT AVG(rating) as average_rating, COUNT(*) as review_count FROM reviews WHERE provider_id = $1',
    [providerId]
  );

  return {
    average_rating: result.rows[0].average_rating ? parseFloat(result.rows[0].average_rating).toFixed(1) : null,
    review_count: parseInt(result.rows[0].review_count) || 0
  };
};

// Update review
const updateReview = async (reviewId, customerId, rating, comment) => {
  const result = await query(
    'UPDATE reviews SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND customer_id = $4 RETURNING *',
    [rating, comment || null, reviewId, customerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Review not found or unauthorized');
  }

  return result.rows[0];
};

// Delete review
const deleteReview = async (reviewId, customerId) => {
  const result = await query(
    'DELETE FROM reviews WHERE id = $1 AND customer_id = $2 RETURNING id',
    [reviewId, customerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Review not found or unauthorized');
  }

  return true;
};

module.exports = {
  createReview,
  getServiceReviews,
  getProviderReviews,
  getServiceAverageRating,
  getProviderAverageRating,
  updateReview,
  deleteReview
};


