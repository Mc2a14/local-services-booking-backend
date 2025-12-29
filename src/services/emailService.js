const { query } = require('../db');
const nodemailer = require('nodemailer');
const { decrypt } = require('../utils/encryption');

// Create email transporter from provider's email config or system defaults
const createTransporter = (providerEmailConfig = null) => {
  // Priority 1: Use provider's email configuration if available
  if (providerEmailConfig) {
    const { email_service_type, email_smtp_host, email_smtp_port, email_smtp_secure, email_smtp_user, email_smtp_password_encrypted } = providerEmailConfig;
    
    if (email_smtp_user && email_smtp_password_encrypted) {
      const decryptedPassword = decrypt(email_smtp_password_encrypted);
      
      if (email_service_type === 'gmail') {
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: email_smtp_user,
            pass: decryptedPassword
          }
        });
      } else if (email_service_type === 'sendgrid') {
        return nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: decryptedPassword // API key for SendGrid
          }
        });
      } else if (email_smtp_host) {
        // Custom SMTP
        return nodemailer.createTransport({
          host: email_smtp_host,
          port: parseInt(email_smtp_port || '587'),
          secure: email_smtp_secure === true,
          auth: {
            user: email_smtp_user,
            pass: decryptedPassword
          }
        });
      }
    }
  }

  // If provider doesn't have email configured, return null (will log only)
  // No system-wide fallback - each business owner must configure their own email
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
  const { booking_id, recipient_email, recipient_type, notification_type, subject, body, html, fromEmail, fromName, replyTo, providerEmailConfig } = emailData;

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

  // Try to send actual email - use provider's config if available
  const transporter = createTransporter(providerEmailConfig);
  if (transporter) {
    try {
      // Determine sender email and name - use provider's email
      let senderEmail, senderName;
      
      // Use provider's registered email address (from their user account)
      if (providerEmailConfig && providerEmailConfig.email_from_address) {
        senderEmail = providerEmailConfig.email_from_address;
        senderName = providerEmailConfig.email_from_name || fromName || 'Booking Service';
      } else if (fromEmail) {
        senderEmail = fromEmail; // Fallback to provider's registered email
        senderName = fromName || 'Booking Service';
      } else {
        // This shouldn't happen, but just in case
        senderEmail = 'noreply@bookingservice.com';
        senderName = 'Booking Service';
      }
      
      // Build mail options
      const mailOptions = {
        // Send FROM the business owner's email (or system email if not configured)
        from: `"${senderName}" <${senderEmail}>`,
        to: recipient_email,
        subject: subject,
        text: body,
        html: html || createEmailTemplate(subject, body.replace(/\n/g, '<br>'))
      };

      // Always set reply-to to business owner's registered email
      // This way customers can reply directly to the business owner
      if (replyTo) {
        mailOptions.replyTo = replyTo; // Usually the provider's registered email
      } else if (fromEmail) {
        mailOptions.replyTo = fromEmail; // Provider's registered email from account
      } else if (providerEmailConfig && providerEmailConfig.email_from_address) {
        mailOptions.replyTo = providerEmailConfig.email_from_address;
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
const sendBookingConfirmation = async (booking, customerEmail, providerEmail, providerBusinessName = null, providerEmailConfig = null) => {
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
    fromEmail: providerEmail, // Fallback email if provider config not available
    fromName: senderName,      // Use business name
    replyTo: providerEmail,    // Reply-To set to business owner
    providerEmailConfig: providerEmailConfig // Provider's email config for sending
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

// Send password reset email (system-level email, doesn't require provider config)
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://atencio.app';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const subject = 'Password Reset Request - Atencio';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563EB; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F59E0B; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${userName || 'User'},</p>
          <p>We received a request to reset your password for your Atencio account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563EB;">${resetLink}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your password will not change until you create a new one</li>
            </ul>
          </div>
          <div class="footer">
            <p>Thank you for using Atencio!</p>
            <p>If you have any questions, please contact support.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hello ${userName || 'User'},

We received a request to reset your password for your Atencio account.

Click this link to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email. Your password will not change until you create a new one.

Thank you for using Atencio!`;

  // Try to send using system email if configured
  // For now, we'll use a simple nodemailer setup
  // If system email is not configured, this will log the email content
  try {
    // Check if system email is configured via environment variables
    const systemEmail = process.env.SYSTEM_EMAIL || process.env.GMAIL_USER;
    const systemEmailPassword = process.env.SYSTEM_EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD;

    if (systemEmail && systemEmailPassword) {
      // Support both Gmail and custom SMTP
      let transporter;
      
      if (process.env.SMTP_HOST) {
        // Custom SMTP configuration
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: systemEmail,
            pass: systemEmailPassword
          }
        });
      } else {
        // Default to Gmail
        // Try OAuth2 first if OAUTH_CLIENT_ID is set, otherwise use password
        if (process.env.OAUTH_CLIENT_ID && process.env.OAUTH_CLIENT_SECRET && process.env.OAUTH_REFRESH_TOKEN) {
          transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: systemEmail,
              clientId: process.env.OAUTH_CLIENT_ID,
              clientSecret: process.env.OAUTH_CLIENT_SECRET,
              refreshToken: process.env.OAUTH_REFRESH_TOKEN
            }
          });
        } else {
          // Use regular password authentication (works with app password or regular password)
          // Use explicit SMTP settings for Gmail with longer timeout
          transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: systemEmail,
              pass: systemEmailPassword
            },
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 30000, // 30 seconds
            socketTimeout: 60000, // 60 seconds
            // Additional options for better reliability
            tls: {
              rejectUnauthorized: false // Allow self-signed certificates if needed
            }
          });
        }
      }

      await transporter.sendMail({
        from: `"Atencio" <${systemEmail}>`,
        to: email,
        subject: subject,
        text: text,
        html: html
      });

      console.log(`✅ Password reset email sent to ${email}`);
      return true;
    } else {
      // No system email configured - log it
      console.log(`📧 Password reset email would be sent to ${email}`);
      console.log(`   Reset link: ${resetLink}`);
      console.log(`   To enable email sending, set SYSTEM_EMAIL and SYSTEM_EMAIL_PASSWORD environment variables`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error.message);
    // Log the reset link so it's not completely lost
    console.log(`   Reset link: ${resetLink}`);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendBookingStatusUpdate,
  sendBookingReminder,
  getEmailNotifications,
  sendPasswordResetEmail
};
