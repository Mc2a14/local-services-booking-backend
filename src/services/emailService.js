const { query } = require('../db');
const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // Check if using SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // Check if using custom SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Default: Gmail SMTP (for testing)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  // If no email config, return null (will log only)
  return null;
};

// Create HTML email template
const createEmailTemplate = (title, content, bookingDetails = null) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
        .booking-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #007bff; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
          ${bookingDetails ? `
            <div class="booking-details">
              <h2>Booking Details</h2>
              ${Object.entries(bookingDetails).map(([key, value]) => 
                value ? `<div class="detail-row">
                  <span class="label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                  <span class="value">${value}</span>
                </div>` : ''
              ).join('')}
            </div>
          ` : ''}
          <div class="footer">
            <p>Thank you for using our booking service!</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send email notification
const sendEmail = async (emailData) => {
  const { booking_id, recipient_email, recipient_type, notification_type, subject, body, html, fromEmail, fromName, replyTo } = emailData;

  // Store email notification in database first
  let emailRecord;
  try {
    const result = await query(
      `INSERT INTO email_notifications (booking_id, recipient_email, recipient_type, notification_type, subject, body, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [booking_id || null, recipient_email, recipient_type, notification_type, subject || null, body || null]
    );
    emailRecord = result.rows[0];
  } catch (error) {
    console.error('Error saving email notification:', error);
  }

  // Try to send actual email
  const transporter = createTransporter();
  if (transporter) {
    try {
      // System email for sending (must be verified in email service)
      const systemEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER || 'noreply@bookingservice.com';
      const systemName = process.env.EMAIL_FROM_NAME || 'Booking Service';
      
      // Use business name if provided, otherwise use system name
      const senderName = fromName || systemName;
      
      // Build mail options
      const mailOptions = {
        // Send FROM system email (must be verified), but show business name
        from: `"${senderName}" <${systemEmail}>`,
        to: recipient_email,
        subject: subject,
        text: body,
        html: html || createEmailTemplate(subject, body.replace(/\n/g, '<br>'))
      };

      // Add reply-to to business owner's email (customers can reply directly to them)
      if (replyTo) {
        mailOptions.replyTo = replyTo;
      } else if (fromEmail) {
        // If fromEmail (provider's email) is set, use it as reply-to
        mailOptions.replyTo = fromEmail;
      }

      await transporter.sendMail(mailOptions);

      console.log(`✅ Email sent successfully to ${recipient_email}`);
      
      // Update status to sent
      if (emailRecord) {
        await query(
          'UPDATE email_notifications SET status = $1 WHERE id = $2',
          ['sent', emailRecord.id]
        );
      }
    } catch (error) {
      console.error(`❌ Failed to send email to ${recipient_email}:`, error.message);
      
      // Update status to failed
      if (emailRecord) {
        await query(
          'UPDATE email_notifications SET status = $1, error_message = $2 WHERE id = $3',
          ['failed', error.message, emailRecord.id]
        );
      }
    }
  } else {
    console.log(`📧 Email notification logged (no email service configured) to ${recipient_email}`);
    console.log(`   To enable email sending, configure one of: GMAIL_USER/GMAIL_APP_PASSWORD, SENDGRID_API_KEY, or SMTP settings`);
    
    // Update status to logged (if no email service)
    if (emailRecord) {
      await query(
        'UPDATE email_notifications SET status = $1 WHERE id = $2',
        ['logged', emailRecord.id]
      );
    }
  }

  return emailRecord;
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking, customerEmail, providerEmail, providerBusinessName = null) => {
  const bookingDate = new Date(booking.booking_date);
  const formattedDate = bookingDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Use business name if available, otherwise use provider name
  const senderName = providerBusinessName || booking.provider_name || 'Booking Service';
  const replyToEmail = providerEmail; // Customers can reply directly to the business owner

  // Email to customer - appears to come from the business owner
  const customerHtml = createEmailTemplate(
    'Booking Confirmed! ✅',
    `<p>Hello ${booking.customer_name || 'Valued Customer'},</p>
     <p>Your booking has been confirmed! We're excited to serve you.</p>
     <p><strong>What's next?</strong> You'll receive a reminder before your appointment. If you need to make any changes, please reply to this email or contact us directly.</p>`,
    {
      'Booking ID': `#${booking.id}`,
      'Service': booking.service_title || 'Service',
      'Date & Time': formattedDate,
      'Status': booking.status || 'pending'
    }
  );

  await sendEmail({
    booking_id: booking.id,
    recipient_email: customerEmail,
    recipient_type: 'customer',
    notification_type: 'booking_confirmation',
    subject: `Booking Confirmation - ${booking.service_title || 'Service'}`,
    body: `Your booking has been confirmed!\n\nService: ${booking.service_title || 'Service'}\nDate: ${formattedDate}\nBooking ID: #${booking.id}\nStatus: ${booking.status}\n\nThank you for your booking!\n\nIf you need to make changes, please reply to this email.`,
    html: customerHtml,
    fromEmail: providerEmail, // Send FROM the business owner's email
    fromName: senderName,      // Use business name
    replyTo: providerEmail     // Reply-To also set to business owner
  });

  // Email to provider - notification of new booking
  const providerHtml = createEmailTemplate(
    'New Booking Received 📅',
    `<p>Hello ${booking.provider_name || 'Provider'},</p>
     <p>You have received a new booking!</p>`,
    {
      'Booking ID': `#${booking.id}`,
      'Service': booking.service_title || 'Service',
      'Customer': booking.customer_name || 'Customer',
      'Customer Email': booking.customer_email || customerEmail,
      'Customer Phone': booking.customer_phone || 'Not provided',
      'Date & Time': formattedDate,
      'Status': booking.status || 'pending'
    }
  );

  await sendEmail({
    booking_id: booking.id,
    recipient_email: providerEmail,
    recipient_type: 'provider',
    notification_type: 'new_booking',
    subject: `New Booking - ${booking.service_title || 'Service'}`,
    body: `You have a new booking!\n\nService: ${booking.service_title || 'Service'}\nCustomer: ${booking.customer_name || 'Customer'}\nDate: ${formattedDate}\nStatus: ${booking.status}`,
    html: providerHtml
  });
};

// Send booking status update email
const sendBookingStatusUpdate = async (booking, customerEmail, oldStatus, newStatus) => {
  const bookingDate = new Date(booking.booking_date);
  const formattedDate = bookingDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const html = createEmailTemplate(
    'Booking Status Updated',
    `<p>Your booking status has been updated!</p>
     <p>The status of your booking has changed from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.</p>`,
    {
      'Booking ID': `#${booking.id}`,
      'Service': booking.service_title || 'Service',
      'Date & Time': formattedDate,
      'Previous Status': oldStatus,
      'New Status': newStatus
    }
  );

  await sendEmail({
    booking_id: booking.id,
    recipient_email: customerEmail,
    recipient_type: 'customer',
    notification_type: 'booking_status_update',
    subject: `Booking Update - ${booking.service_title || 'Service'}`,
    body: `Your booking status has been updated!\n\nService: ${booking.service_title || 'Service'}\nDate: ${formattedDate}\nPrevious Status: ${oldStatus}\nNew Status: ${newStatus}`,
    html: html
  });
};

// Send booking reminder email
const sendBookingReminder = async (booking, customerEmail) => {
  const bookingDate = new Date(booking.booking_date);
  const formattedDate = bookingDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const html = createEmailTemplate(
    'Reminder: Upcoming Booking',
    `<p>This is a friendly reminder about your upcoming booking.</p>
     <p>We look forward to seeing you!</p>`,
    {
      'Booking ID': `#${booking.id}`,
      'Service': booking.service_title || 'Service',
      'Date & Time': formattedDate
    }
  );

  await sendEmail({
    booking_id: booking.id,
    recipient_email: customerEmail,
    recipient_type: 'customer',
    notification_type: 'booking_reminder',
    subject: `Reminder: Upcoming Booking - ${booking.service_title || 'Service'}`,
    body: `This is a reminder about your upcoming booking.\n\nService: ${booking.service_title || 'Service'}\nDate: ${formattedDate}\n\nWe look forward to seeing you!`,
    html: html
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
