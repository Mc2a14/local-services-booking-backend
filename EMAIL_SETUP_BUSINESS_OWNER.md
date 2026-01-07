# Email Setup for Business Owners

## How It Works

**Each business owner uses their own email account to send booking confirmations.**

When a business owner creates their business profile, they can provide their email password/app password. The system will then send booking confirmation emails **directly from their email account**.

## Setup Steps for Business Owners

### For Gmail Users (Most Common)

1. **Enable 2-Step Verification** on their Gmail account:
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Type: "Booking System"
   - Click "Generate"
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

3. **When creating their business profile**, enter:
   - Business name
   - Description
   - Phone
   - Address
   - **Email App Password**: Paste the 16-character password (no spaces needed)
   - Email service type: "gmail" (default)

That's it! Now booking confirmations will be sent from their Gmail account.

### For Other Email Services

Business owners can also use:
- **Custom SMTP**: If they have their own email server
- **SendGrid**: If they have a SendGrid account

Just provide the appropriate credentials when creating the business profile.

## Important Notes

- ✅ Emails are sent **directly from the business owner's email account**
- ✅ Customers see emails **from the business owner's email address**
- ✅ Customers can **reply directly** to the business owner
- ✅ Each business owner's email credentials are **encrypted and stored securely**
- ✅ **No central email service needed** - each business owner uses their own

## What Happens if No Email Password is Provided?

If a business owner doesn't provide email credentials:
- Booking confirmations will still be created
- Email notifications will be **logged in the database** but not sent
- The business owner can add email credentials later by updating their profile

## Privacy & Security

- Email passwords are **encrypted** in the database
- Each business owner's credentials are stored **separately**
- No sharing of email accounts between businesses
- Business owners can update their email password anytime





