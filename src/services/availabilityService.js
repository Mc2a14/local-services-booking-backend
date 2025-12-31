const { query } = require('../db');

// Check if a time slot is available
const isTimeSlotAvailable = async (providerId, bookingDate) => {
  const date = new Date(bookingDate);
  const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
  const time = date.toTimeString().slice(0, 5); // HH:MM format

  // Check if date is blocked
  const blockedCheck = await query(
    'SELECT id FROM blocked_dates WHERE provider_id = $1 AND blocked_date = $2',
    [providerId, date.toISOString().split('T')[0]]
  );

  if (blockedCheck.rows.length > 0) {
    return { available: false, reason: 'Date is blocked' };
  }

  // Check availability for the day of week
  const availabilityCheck = await query(
    'SELECT * FROM availability WHERE provider_id = $1 AND day_of_week = $2 AND is_available = true',
    [providerId, dayOfWeek]
  );

  if (availabilityCheck.rows.length === 0) {
    return { available: false, reason: 'No availability set for this day' };
  }

  // Check if time falls within available hours
  const available = availabilityCheck.rows.some(slot => {
    return time >= slot.start_time && time < slot.end_time;
  });

  if (!available) {
    return { available: false, reason: 'Time slot is outside business hours' };
  }

  // Check if there's already a booking at this time
  const existingBooking = await query(
    `SELECT id FROM bookings 
     WHERE provider_id = $1 
     AND DATE(booking_date) = $2 
     AND EXTRACT(HOUR FROM booking_date) = $3
     AND EXTRACT(MINUTE FROM booking_date) = $4
     AND status NOT IN ('cancelled')`,
    [providerId, date.toISOString().split('T')[0], date.getHours(), date.getMinutes()]
  );

  if (existingBooking.rows.length > 0) {
    return { available: false, reason: 'Time slot is already booked' };
  }

  return { available: true };
};

// Get available time slots for a date
const getAvailableTimeSlots = async (providerId, date) => {
  const bookingDate = new Date(date);
  const dayOfWeek = bookingDate.getDay();

  // Get availability for this day
  const availability = await query(
    'SELECT * FROM availability WHERE provider_id = $1 AND day_of_week = $2 AND is_available = true',
    [providerId, dayOfWeek]
  );

  if (availability.rows.length === 0) {
    return [];
  }

  // Get existing bookings for this date
  const existingBookings = await query(
    `SELECT booking_date FROM bookings 
     WHERE provider_id = $1 
     AND DATE(booking_date) = $2 
     AND status NOT IN ('cancelled')`,
    [providerId, bookingDate.toISOString().split('T')[0]]
  );

  const bookedTimes = existingBookings.rows.map(b => {
    const time = new Date(b.booking_date);
    return `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;
  });

  // Generate time slots (every 30 minutes)
  const availableSlots = [];
  availability.rows.forEach(slot => {
    const [startHour, startMin] = slot.start_time.split(':').map(Number);
    const [endHour, endMin] = slot.end_time.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      if (!bookedTimes.includes(timeString)) {
        availableSlots.push(timeString);
      }

      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
  });

  return availableSlots;
};

// Set availability schedule
const setAvailability = async (providerId, availabilityData) => {
  // Delete existing availability
  await query('DELETE FROM availability WHERE provider_id = $1', [providerId]);

  // Insert new availability
  const results = [];
  for (const slot of availabilityData) {
    const { day_of_week, start_time, end_time, is_available = true } = slot;
    
    const result = await query(
      'INSERT INTO availability (provider_id, day_of_week, start_time, end_time, is_available) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [providerId, day_of_week, start_time, end_time, is_available]
    );
    
    results.push(result.rows[0]);
  }

  return results;
};

// Get availability schedule
const getAvailability = async (providerId) => {
  const result = await query(
    'SELECT * FROM availability WHERE provider_id = $1 ORDER BY day_of_week, start_time',
    [providerId]
  );

  return result.rows;
};

// Block a date
const blockDate = async (providerId, blockedDate, reason) => {
  const result = await query(
    'INSERT INTO blocked_dates (provider_id, blocked_date, reason) VALUES ($1, $2, $3) RETURNING *',
    [providerId, blockedDate, reason || null]
  );

  return result.rows[0];
};

// Get blocked dates
const getBlockedDates = async (providerId, startDate, endDate) => {
  const result = await query(
    'SELECT * FROM blocked_dates WHERE provider_id = $1 AND blocked_date BETWEEN $2 AND $3 ORDER BY blocked_date',
    [providerId, startDate, endDate]
  );

  return result.rows;
};

// Unblock a date
const unblockDate = async (providerId, blockedDateId) => {
  const result = await query(
    'DELETE FROM blocked_dates WHERE id = $1 AND provider_id = $2 RETURNING *',
    [blockedDateId, providerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Blocked date not found or unauthorized');
  }

  return true;
};

module.exports = {
  isTimeSlotAvailable,
  getAvailableTimeSlots,
  setAvailability,
  getAvailability,
  blockDate,
  getBlockedDates,
  unblockDate
};




