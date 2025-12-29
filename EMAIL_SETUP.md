# Email Configuration Guide

This guide explains how to set up email sending for the booking system.

## Quick Start Options

### Option 1: Gmail (Easiest for Testing)

1. Go to your Google Account settings: https://myaccount.google.com/
2. Enable 2-Step Verification
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate an app password for "Mail"
5. Add these to your `.env` file:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password-here
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Your Business Name
```

### Option 2: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Create an API Key in SendGrid dashboard
3. Add to your `.env` file:

```env
SENDGRID_API_KEY=your-sendgrid-api-key-here
EMAIL_FROM=your-verified-email@yourdomain.com
EMAIL_FROM_NAME=Your Business Name
```

### Option 3: Custom SMTP Server

If you have your own SMTP server:

```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Business Name
```

## Railway Deployment

When deploying to Railway, add the environment variables in the Railway dashboard:

1. Go to your Railway project
2. Select your backend service
3. Go to "Variables" tab
4. Add the email configuration variables

## Testing

After setting up, test by creating a booking. You should receive confirmation emails.

If emails aren't sending, check:
- Environment variables are set correctly
- For Gmail: App password is correct and 2FA is enabled
- For SendGrid: API key is valid and sender email is verified
- Check server logs for email errors

## Email Templates

Emails are sent as HTML with a professional template including:
- Booking confirmation emails to customers
- New booking notifications to providers
- Status update emails
- Booking reminders


