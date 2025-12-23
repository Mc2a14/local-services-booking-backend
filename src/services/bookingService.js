const { query } = require('../db');
const availabilityService = require('./availabilityService');
const emailService = require('./emailService');

// Create a new booking
const createBooking = async (customerId, bookingData) => {
  const { service_id, booking_date, notes } = bookingData;

  // Get service to verify it exists and get provider_id
  const serviceResult = await query(
    'SELECT provider_id, is_active, title FROM services WHERE id = $1',
    [service_id]
  );

  if (serviceResult.rows.length === 0) {
    throw new Error('Service not found');
  }

  const service = serviceResult.rows[0];
  
  if (!service.is_active) {
    throw new Error('Service is not available');
  }

  // Check availability
  const availability = await availabilityService.isTimeSlotAvailable(service.provider_id, booking_date);
  if (!availability.available) {
    throw new Error(availability.reason || 'Time slot is not available');
  }

  // Get customer and provider emails for notifications
  const customerResult = await query('SELECT email, full_name FROM users WHERE id = $1', [customerId]);
  const providerResult = await query('SELECT email, full_name FROM users WHERE id = $1', [service.provider_id]);

  // Insert booking
  const result = await query(
    'INSERT INTO bookings (customer_id, service_id, provider_id, booking_date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [customerId, service_id, service.provider_id, booking_date, notes || null]
  );

  const booking = result.rows[0];
  
  // Add service title and names for email
  booking.service_title = service.title;
  booking.customer_name = customerResult.rows[0].full_name;
  booking.provider_name = providerResult.rows[0].full_name;

  // Send confirmation emails
  try {
    await emailService.sendBookingConfirmation(
      booking,
      customerResult.rows[0].email,
      providerResult.rows[0].email
    );
  } catch (error) {
    console.error('Failed to send booking confirmation emails:', error);
    // Don't fail the booking if email fails
  }

  return booking;
};

// Get booking by ID
const getBookingById = async (bookingId, userId, userType) => {
  let queryText = 'SELECT b.*, s.title as service_title, s.price, u1.full_name as customer_name, u2.full_name as provider_name FROM bookings b JOIN services s ON b.service_id = s.id JOIN users u1 ON b.customer_id = u1.id JOIN users u2 ON b.provider_id = u2.id WHERE b.id = $1';
  const params = [bookingId];

  // Ensure user can only see their own bookings
  if (userType === 'customer') {
    queryText += ' AND b.customer_id = $2';
    params.push(userId);
  } else if (userType === 'provider') {
    queryText += ' AND b.provider_id = $2';
    params.push(userId);
  }

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    throw new Error('Booking not found');
  }

  return result.rows[0];
};

// Get all bookings for a customer
const getBookingsByCustomerId = async (customerId) => {
  const result = await query(
    `SELECT b.*, s.title as service_title, s.price, u.full_name as provider_name, p.business_name 
     FROM bookings b 
     JOIN services s ON b.service_id = s.id 
     JOIN users u ON b.provider_id = u.id 
     LEFT JOIN providers p ON u.id = p.user_id
     WHERE b.customer_id = $1 
     ORDER BY b.booking_date DESC`,
    [customerId]
  );

  return result.rows;
};

// Get all bookings for a provider
const getBookingsByProviderId = async (providerId) => {
  const result = await query(
    `SELECT b.*, s.title as service_title, s.price, u.full_name as customer_name 
     FROM bookings b 
     JOIN services s ON b.service_id = s.id 
     JOIN users u ON b.customer_id = u.id 
     WHERE b.provider_id = $1 
     ORDER BY b.booking_date DESC`,
    [providerId]
  );

  return result.rows;
};

// Update booking status
const updateBookingStatus = async (bookingId, providerId, status) => {
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid booking status');
  }

  // Get old status
  const oldBooking = await query(
    'SELECT * FROM bookings WHERE id = $1 AND provider_id = $2',
    [bookingId, providerId]
  );

  if (oldBooking.rows.length === 0) {
    throw new Error('Booking not found or unauthorized');
  }

  const oldStatus = oldBooking.rows[0].status;

  // Update status
  const result = await query(
    `UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 AND provider_id = $3 
     RETURNING *`,
    [status, bookingId, providerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Booking not found or unauthorized');
  }

  // Get additional booking details for email
  const bookingDetails = await query(
    `SELECT b.*, s.title as service_title, u.full_name as customer_name
     FROM bookings b
     JOIN services s ON b.service_id = s.id
     JOIN users u ON b.customer_id = u.id
     WHERE b.id = $1`,
    [bookingId]
  );
  
  const booking = bookingDetails.rows[0] || result.rows[0];

  // Send status update email if status changed
  if (oldStatus !== status) {
    try {
      const customerResult = await query('SELECT email FROM users WHERE id = $1', [booking.customer_id]);
      if (customerResult.rows.length > 0) {
        await emailService.sendBookingStatusUpdate(
          booking,
          customerResult.rows[0].email,
          oldStatus,
          status
        );
      }
    } catch (error) {
      console.error('Failed to send status update email:', error);
    }
  }

  return booking;
};

// Cancel booking (customer can cancel their own bookings)
const cancelBooking = async (bookingId, customerId) => {
  const result = await query(
    'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND customer_id = $3 RETURNING *',
    ['cancelled', bookingId, customerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Booking not found or unauthorized');
  }

  return result.rows[0];
};

module.exports = {
  createBooking,
  getBookingById,
  getBookingsByCustomerId,
  getBookingsByProviderId,
  updateBookingStatus,
  cancelBooking
};

