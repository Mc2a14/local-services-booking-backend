const { query } = require('../db');
const availabilityService = require('./availabilityService');
const emailService = require('./emailService');

// Create a new booking (for registered users)
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

  // Get customer and provider emails for notifications (including business name and email config)
  const customerResult = await query('SELECT email, full_name FROM users WHERE id = $1', [customerId]);
  const providerResult = await query(
    `SELECT u.email, u.full_name, p.business_name,
     p.email_service_type, p.email_smtp_host, p.email_smtp_port, p.email_smtp_secure,
     p.email_smtp_user, p.email_smtp_password_encrypted, p.email_from_address, p.email_from_name
     FROM users u 
     LEFT JOIN providers p ON u.id = p.user_id 
     WHERE u.id = $1`,
    [service.provider_id]
  );

  // Insert booking
  const result = await query(
    'INSERT INTO bookings (customer_id, service_id, provider_id, booking_date, notes, customer_name, customer_email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [customerId, service_id, service.provider_id, booking_date, notes || null, customerResult.rows[0].full_name, customerResult.rows[0].email]
  );

  const booking = result.rows[0];
  
  // Add service title and names for email
  booking.service_title = service.title;
  booking.customer_name = customerResult.rows[0].full_name;
  booking.provider_name = providerResult.rows[0].full_name;
  const providerBusinessName = providerResult.rows[0].business_name;
  
  // Get provider's email configuration
  const providerEmailConfig = providerResult.rows[0].email_smtp_user ? {
    email_service_type: providerResult.rows[0].email_service_type,
    email_smtp_host: providerResult.rows[0].email_smtp_host,
    email_smtp_port: providerResult.rows[0].email_smtp_port,
    email_smtp_secure: providerResult.rows[0].email_smtp_secure,
    email_smtp_user: providerResult.rows[0].email_smtp_user,
    email_smtp_password_encrypted: providerResult.rows[0].email_smtp_password_encrypted,
    email_from_address: providerResult.rows[0].email_from_address,
    email_from_name: providerResult.rows[0].email_from_name
  } : null;

  // Send confirmation emails (non-blocking - fire and forget)
  // This allows the booking response to return immediately
  emailService.sendBookingConfirmation(
    booking,
    customerResult.rows[0].email,
    providerResult.rows[0].email,
    providerBusinessName,
    providerEmailConfig
  ).catch(error => {
    console.error('Failed to send booking confirmation emails:', error);
    // Log error but don't fail the booking - email will be logged in database
  });

  return booking;
};

// Create a guest booking (no account required)
const createGuestBooking = async (bookingData) => {
  const { service_id, booking_date, notes, customer_name, customer_email, customer_phone } = bookingData;

  // Validation
  if (!customer_name || !customer_email) {
    throw new Error('Customer name and email are required');
  }

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

  // Get provider info for notifications (including business name and email config)
  const providerResult = await query(
    `SELECT u.email, u.full_name, p.business_name,
     p.email_service_type, p.email_smtp_host, p.email_smtp_port, p.email_smtp_secure,
     p.email_smtp_user, p.email_smtp_password_encrypted, p.email_from_address, p.email_from_name
     FROM users u 
     LEFT JOIN providers p ON u.id = p.user_id 
     WHERE u.id = $1`,
    [service.provider_id]
  );

  // Insert guest booking (customer_id is NULL)
  const result = await query(
    `INSERT INTO bookings (customer_id, service_id, provider_id, booking_date, notes, customer_name, customer_email, customer_phone) 
     VALUES (NULL, $1, $2, $3, $4, $5, $6, $7) 
     RETURNING *`,
    [service_id, service.provider_id, booking_date, notes || null, customer_name, customer_email, customer_phone || null]
  );

  const booking = result.rows[0];
  
  // Add service title and names for email
  booking.service_title = service.title;
  booking.customer_name = customer_name;
  booking.provider_name = providerResult.rows[0].full_name;
  const providerBusinessName = providerResult.rows[0].business_name;
  
  // Get provider's email configuration
  const providerEmailConfig = providerResult.rows[0].email_smtp_user ? {
    email_service_type: providerResult.rows[0].email_service_type,
    email_smtp_host: providerResult.rows[0].email_smtp_host,
    email_smtp_port: providerResult.rows[0].email_smtp_port,
    email_smtp_secure: providerResult.rows[0].email_smtp_secure,
    email_smtp_user: providerResult.rows[0].email_smtp_user,
    email_smtp_password_encrypted: providerResult.rows[0].email_smtp_password_encrypted,
    email_from_address: providerResult.rows[0].email_from_address,
    email_from_name: providerResult.rows[0].email_from_name
  } : null;

  // Send confirmation emails (non-blocking - fire and forget)
  // This allows the booking response to return immediately
  emailService.sendBookingConfirmation(
    booking,
    customer_email,
    providerResult.rows[0].email,
    providerBusinessName,
    providerEmailConfig
  ).catch(error => {
    console.error('Failed to send booking confirmation emails:', error);
    // Log error but don't fail the booking - email will be logged in database
  });

  return booking;
};

// Get booking by ID
const getBookingById = async (bookingId, userId, userType) => {
  let queryText = `SELECT b.*, s.title as service_title, s.price, 
                   COALESCE(b.customer_name, u1.full_name) as customer_name,
                   COALESCE(b.customer_email, u1.email) as customer_email,
                   COALESCE(b.customer_phone, u1.phone) as customer_phone,
                   u2.full_name as provider_name 
                   FROM bookings b 
                   JOIN services s ON b.service_id = s.id 
                   LEFT JOIN users u1 ON b.customer_id = u1.id 
                   JOIN users u2 ON b.provider_id = u2.id 
                   WHERE b.id = $1`;
  const params = [bookingId];

  // Ensure user can only see their own bookings
  if (userType === 'customer' && userId) {
    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length > 0) {
      queryText += ' AND (b.customer_id = $2 OR b.customer_email = $3)';
      params.push(userId, userResult.rows[0].email);
    }
  } else if (userType === 'provider' && userId) {
    queryText += ' AND b.provider_id = $2';
    params.push(userId);
  }

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    throw new Error('Booking not found');
  }

  return result.rows[0];
};

// Get all bookings for a customer (by user ID or email)
const getBookingsByCustomerId = async (customerId) => {
  const result = await query(
    `SELECT b.*, s.title as service_title, s.price, 
     COALESCE(b.customer_name, u.full_name) as customer_name,
     u.full_name as provider_name, p.business_name 
     FROM bookings b 
     JOIN services s ON b.service_id = s.id 
     LEFT JOIN users u ON b.provider_id = u.id 
     LEFT JOIN providers p ON u.id = p.user_id
     WHERE b.customer_id = $1 
     ORDER BY b.booking_date DESC`,
    [customerId]
  );

  return result.rows;
};

// Get bookings by email (for guest bookings)
const getBookingsByEmail = async (email) => {
  const result = await query(
    `SELECT b.*, s.title as service_title, s.price, 
     b.customer_name, u.full_name as provider_name, p.business_name 
     FROM bookings b 
     JOIN services s ON b.service_id = s.id 
     LEFT JOIN users u ON b.provider_id = u.id 
     LEFT JOIN providers p ON u.id = p.user_id
     WHERE b.customer_email = $1 AND b.customer_id IS NULL
     ORDER BY b.booking_date DESC`,
    [email]
  );

  return result.rows;
};

// Get all bookings for a provider
const getBookingsByProviderId = async (providerId) => {
  const result = await query(
    `SELECT b.*, s.title as service_title, s.price, 
     COALESCE(b.customer_name, u.full_name) as customer_name,
     COALESCE(b.customer_email, u.email) as customer_email,
     COALESCE(b.customer_phone, u.phone) as customer_phone
     FROM bookings b 
     JOIN services s ON b.service_id = s.id 
     LEFT JOIN users u ON b.customer_id = u.id 
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

  // Get additional booking details for email (including business info and provider email config)
  const bookingDetails = await query(
    `SELECT b.*, s.title as service_title,
     COALESCE(b.customer_name, u.full_name) as customer_name,
     COALESCE(b.customer_email, u.email) as customer_email,
     provider_user.full_name as provider_name,
     p.business_name,
     p.email_service_type, p.email_smtp_host, p.email_smtp_port, p.email_smtp_secure,
     p.email_smtp_user, p.email_smtp_password_encrypted, p.email_from_address, p.email_from_name
     FROM bookings b
     JOIN services s ON b.service_id = s.id
     LEFT JOIN users u ON b.customer_id = u.id
     JOIN users provider_user ON b.provider_id = provider_user.id
     LEFT JOIN providers p ON b.provider_id = p.user_id
     WHERE b.id = $1`,
    [bookingId]
  );
  
  const booking = bookingDetails.rows[0] || result.rows[0];

  // Build provider email config if available
  const providerEmailConfig = booking.email_service_type ? {
    email_service_type: booking.email_service_type,
    email_smtp_host: booking.email_smtp_host,
    email_smtp_port: booking.email_smtp_port,
    email_smtp_secure: booking.email_smtp_secure,
    email_smtp_user: booking.email_smtp_user,
    email_smtp_password_encrypted: booking.email_smtp_password_encrypted,
    email_from_address: booking.email_from_address,
    email_from_name: booking.email_from_name
  } : null;

  // Send status update email if status changed
  if (oldStatus !== status && booking.customer_email) {
    try {
      await emailService.sendBookingStatusUpdate(
        booking,
        booking.customer_email,
        oldStatus,
        status,
        providerEmailConfig
      );
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
  createGuestBooking,
  getBookingById,
  getBookingsByCustomerId,
  getBookingsByEmail,
  getBookingsByProviderId,
  updateBookingStatus,
  cancelBooking
};
