const bookingService = require('../services/bookingService');
const { query } = require('../db');

// Create a new booking (customer only - requires auth)
const createBooking = async (req, res) => {
  try {
    const { service_id, booking_date, notes } = req.body;

    // Validation
    if (!service_id || !booking_date) {
      return res.status(400).json({ error: 'service_id and booking_date are required' });
    }

    // Validate booking_date is in the future
    const bookingDate = new Date(booking_date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({ error: 'Invalid booking_date format' });
    }

    if (bookingDate < new Date()) {
      return res.status(400).json({ error: 'Booking date must be in the future' });
    }

    const booking = await bookingService.createBooking(req.user.id, {
      service_id,
      booking_date,
      notes
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    
    if (error.message === 'Service not found' || error.message === 'Service is not available') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('not available') || error.message.includes('Time slot')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a guest booking (no auth required - public)
const createGuestBooking = async (req, res) => {
  try {
    const { service_id, booking_date, notes, customer_name, customer_email, customer_phone } = req.body;

    // Validation
    if (!service_id || !booking_date) {
      return res.status(400).json({ error: 'service_id and booking_date are required' });
    }

    if (!customer_name || !customer_email) {
      return res.status(400).json({ error: 'customer_name and customer_email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate booking_date is in the future
    const bookingDate = new Date(booking_date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({ error: 'Invalid booking_date format' });
    }

    if (bookingDate < new Date()) {
      return res.status(400).json({ error: 'Booking date must be in the future' });
    }

    const booking = await bookingService.createGuestBooking({
      service_id,
      booking_date,
      notes,
      customer_name,
      customer_email,
      customer_phone
    });

    // Get full booking details with service info
    const fullBookingResult = await query(
      `SELECT b.*, s.title as service_title, s.price, s.duration_minutes, 
       p.business_name, u.full_name as provider_name
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       LEFT JOIN providers p ON b.provider_id = p.user_id
       JOIN users u ON b.provider_id = u.id
       WHERE b.id = $1`,
      [booking.id]
    );

    const fullBooking = fullBookingResult.rows[0] || booking;

    res.status(201).json({
      message: 'Booking created successfully. A confirmation email will be sent to your email address.',
      booking: {
        id: fullBooking.id,
        service_id: fullBooking.service_id,
        service_title: fullBooking.service_title,
        booking_date: fullBooking.booking_date,
        status: fullBooking.status,
        customer_name: fullBooking.customer_name,
        customer_email: fullBooking.customer_email,
        customer_phone: fullBooking.customer_phone,
        notes: fullBooking.notes,
        price: fullBooking.price,
        duration_minutes: fullBooking.duration_minutes,
        business_name: fullBooking.business_name,
        provider_name: fullBooking.provider_name
      }
    });
  } catch (error) {
    console.error('Create guest booking error:', error);
    
    if (error.message === 'Service not found' || error.message === 'Service is not available') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('not available') || error.message.includes('Time slot')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes('required')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get booking by ID
const getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    const userType = req.user ? req.user.user_type : null;

    const booking = await bookingService.getBookingById(id, userId, userType);

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    
    if (error.message === 'Booking not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all bookings for current customer
const getMyBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getBookingsByCustomerId(req.user.id);

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get bookings by email (for guest bookings lookup)
const getBookingsByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const bookings = await bookingService.getBookingsByEmail(email);

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings by email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all bookings for current provider
const getProviderBookings = async (req, res) => {
  try {
    // Verify provider exists
    const providerService = require('../services/providerService');
    await providerService.getProviderByUserId(req.user.id);
    
    const bookings = await bookingService.getBookingsByProviderId(req.user.id);

    res.json({ bookings });
  } catch (error) {
    console.error('Get provider bookings error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update booking status (provider only)
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    // Verify provider exists
    const providerService = require('../services/providerService');
    await providerService.getProviderByUserId(req.user.id);
    
    const booking = await bookingService.updateBookingStatus(id, req.user.id, status);

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    
    if (error.message === 'Booking not found or unauthorized' || error.message === 'Invalid booking status') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel booking (customer can cancel their own bookings)
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await bookingService.cancelBooking(id, req.user.id);

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    
    if (error.message === 'Booking not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createBooking,
  createGuestBooking,
  getBooking,
  getMyBookings,
  getBookingsByEmail,
  getProviderBookings,
  updateBookingStatus,
  cancelBooking
};
