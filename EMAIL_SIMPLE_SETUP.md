# Simple Email Setup Guide

## How It Works Now

**Each business owner's registered email is automatically used!**

When a business owner:
1. ✅ Creates an account with their email (e.g., `john@plumbing.com`)
2. ✅ Creates their business profile

**That's it!** The system automatically:
- Uses their registered email as the "From" address
- Uses their business name as the sender name
- Sets Reply-To to their email (so customers reply directly to them)
- Sends emails through a system-wide email service (configured once)

## What You Need to Configure (Once, System-Wide)

You only need to set up **one** email service for the entire platform. All business owners will send emails through this service, but customers will see emails **from** each business owner's email address.

### Option 1: SendGrid (Recommended)

1. Sign up at https://sendgrid.com (free: 100 emails/day)
2. Create an API Key
3. Add to Railway Variables:
   ```
   SENDGRID_API_KEY=SG.your-api-key-here
   EMAIL_FROM=your-verified-email@domain.com (this is just a fallback)
   EMAIL_FROM_NAME=Booking System
   ```

### Option 2: Gmail (Simple for Testing)

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to Railway Variables:
   ```
   GMAIL_USER=admin@yourdomain.com (this is just for sending, not what customers see)
   GMAIL_APP_PASSWORD=your-app-password
   EMAIL_FROM=admin@yourdomain.com (fallback only)
   EMAIL_FROM_NAME=Booking System
   ```

## How Customers See Emails

When a customer books with "John's Plumbing" (john@plumbing.com):

- **From:** "John's Plumbing" <john@plumbing.com>
- **Reply-To:** john@plumbing.com
- **Sent through:** Your system email service (SendGrid/Gmail)

The customer sees it as coming from John, and when they hit "Reply", it goes directly to John's email!

## Optional: Business Owner's Own Email Service

If a business owner wants to use their own email service (their own Gmail, SendGrid account, etc.), they can optionally configure it. Otherwise, the system email service is used automatically.

This is optional - most business owners don't need to configure anything!

## Summary

✅ **Business Owner:** Just creates account and business profile  
✅ **You (Platform Admin):** Configure one email service (SendGrid/Gmail)  
✅ **Customers:** See emails from business owner's email, can reply directly

No redundant configuration needed!

