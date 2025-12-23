const { query } = require('../db');

// Log email notification (for now, just store it - can integrate with email service later)
const sendEmail = async (emailData) => {
  const { booking_id, recipient_email, recipient_type, notification_type, subject, body } = emailData;

  // Store email notification in database
  const result = await query(
    `INSERT INTO email_notifications (booking_id, recipient_email, recipient_type, notification_type, subject, body, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'sent')
     RETURNING *`,
    [booking_id || null, recipient_email, recipient_type, notification_type, subject || null, body || null]
  );

  // TODO: Integrate with email service (SendGrid, Mailgun, AWS SES, etc.)
  // For now, we just log it. In production, you would:
  // 1. Call email service API here
  // 2. Update status to 'sent' or 'failed' based on result
  // 3. Handle retries for failed emails

  console.log(`📧 Email notification logged: ${notification_type} to ${recipient_email}`);

  return result.rows[0];
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking, customerEmail, providerEmail) => {
  const bookingDate = new Date(booking.booking_date).toLocaleString();

  // Email to customer
  await sendEmail({
    booking_id: booking.id,
    recipient_email: customerEmail,
    recipient_type: 'customer',
    notification_type: 'booking_confirmation',
    subject: `Booking Confirmation - ${booking.service_title || 'Service'}`,
    body: `Your booking has been confirmed!\n\nService: ${booking.service_title || 'Service'}\nDate: ${bookingDate}\nStatus: ${booking.status}\n\nThank you for your booking!`
  });

  // Email to provider
  await sendEmail({
    booking_id: booking.id,
    recipient_email: providerEmail,
    recipient_type: 'provider',
    notification_type: 'new_booking',
    subject: `New Booking - ${booking.service_title || 'Service'}`,
    body: `You have a new booking!\n\nService: ${booking.service_title || 'Service'}\nCustomer: ${booking.customer_name || 'Customer'}\nDate: ${bookingDate}\nStatus: ${booking.status}`
  });
};

// Send booking status update email
const sendBookingStatusUpdate = async (booking, customerEmail, oldStatus, newStatus) => {
  const bookingDate = new Date(booking.booking_date).toLocaleString();

  await sendEmail({
    booking_id: booking.id,
    recipient_email: customerEmail,
    recipient_type: 'customer',
    notification_type: 'booking_status_update',
    subject: `Booking Update - ${booking.service_title || 'Service'}`,
    body: `Your booking status has been updated!\n\nService: ${booking.service_title || 'Service'}\nDate: ${bookingDate}\nPrevious Status: ${oldStatus}\nNew Status: ${newStatus}`
  });
};

// Send booking reminder email
const sendBookingReminder = async (booking, customerEmail) => {
  const bookingDate = new Date(booking.booking_date).toLocaleString();

  await sendEmail({
    booking_id: booking.id,
    recipient_email: customerEmail,
    recipient_type: 'customer',
    notification_type: 'booking_reminder',
    subject: `Reminder: Upcoming Booking - ${booking.service_title || 'Service'}`,
    body: `This is a reminder about your upcoming booking.\n\nService: ${booking.service_title || 'Service'}\nDate: ${bookingDate}\n\nWe look forward to seeing you!`
  });
};

// Get email notifications for a booking
const getEmailNotifications = async (bookingId) => {
  const result = await query(
    'SELECT * FROM email_notifications WHERE booking_id = $1 ORDER BY sent_at DESC',
    [bookingId]
  );

  return result.rows;
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendBookingStatusUpdate,
  sendBookingReminder,
  getEmailNotifications
};

