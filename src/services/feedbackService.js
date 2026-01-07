const { query } = require('../db');

// Submit feedback for a completed appointment
const submitFeedback = async (appointmentId, rating, comment) => {
  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if appointment exists and is completed
  const bookingResult = await query(
    `SELECT b.id, b.status, b.provider_id, p.id as business_id
     FROM bookings b
     LEFT JOIN providers p ON b.provider_id = p.user_id
     WHERE b.id = $1`,
    [appointmentId]
  );

  if (bookingResult.rows.length === 0) {
    throw new Error('Appointment not found');
  }

  const booking = bookingResult.rows[0];

  if (booking.status !== 'completed') {
    throw new Error('Feedback can only be submitted for completed appointments');
  }

  if (!booking.business_id) {
    throw new Error('Business information not found for this appointment');
  }

  // Check if feedback already exists for this appointment
  const existingFeedback = await query(
    'SELECT id FROM feedback WHERE appointment_id = $1',
    [appointmentId]
  );

  if (existingFeedback.rows.length > 0) {
    throw new Error('Feedback already submitted for this appointment');
  }

  // Insert feedback
  const result = await query(
    `INSERT INTO feedback (appointment_id, business_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [appointmentId, booking.business_id, rating, comment || null]
  );

  return result.rows[0];
};

// Get all feedback for a business (business owner only)
const getBusinessFeedback = async (businessId) => {
  const result = await query(
    `SELECT 
       f.id,
       f.appointment_id,
       f.rating,
       f.comment,
       f.created_at,
       b.service_id,
       b.customer_name,
       b.customer_email,
       b.booking_date,
       s.title as service_title
     FROM feedback f
     JOIN bookings b ON f.appointment_id = b.id
     LEFT JOIN services s ON b.service_id = s.id
     WHERE f.business_id = $1
     ORDER BY f.created_at DESC`,
    [businessId]
  );

  return result.rows;
};

// Check if feedback exists for an appointment
const getFeedbackByAppointmentId = async (appointmentId) => {
  const result = await query(
    'SELECT * FROM feedback WHERE appointment_id = $1',
    [appointmentId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

module.exports = {
  submitFeedback,
  getBusinessFeedback,
  getFeedbackByAppointmentId
};




