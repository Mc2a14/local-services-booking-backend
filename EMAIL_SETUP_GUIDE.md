# Email Setup Guide - Step by Step

## Option 1: Gmail Setup (Easiest - Recommended to Start)

### Step 1: Enable 2-Step Verification on Your Google Account

1. Go to: https://myaccount.google.com/security
2. Scroll down to "How you sign in to Google"
3. Click on "2-Step Verification"
4. Follow the prompts to enable it (you'll need your phone)

### Step 2: Generate an App Password

1. Go to: https://myaccount.google.com/apppasswords
   - If you can't find it, go to: https://myaccount.google.com/security → "2-Step Verification" → Scroll down to "App passwords"
2. Select "Mail" as the app
3. Select "Other (Custom name)" as the device
4. Type: "Booking System"
5. Click "Generate"
6. **COPY THE 16-CHARACTER PASSWORD** (it looks like: `abcd efgh ijkl mnop`)
   - You won't be able to see it again!

### Step 3: Add to Railway

1. Go to your Railway dashboard: https://railway.app
2. Select your backend project: `local-services-booking-backend`
3. Click on your backend service
4. Go to the **"Variables"** tab
5. Click **"+ New Variable"** for each of these:

   **Variable 1:**
   - Name: `GMAIL_USER`
   - Value: `your-email@gmail.com` (use your actual Gmail address)

   **Variable 2:**
   - Name: `GMAIL_APP_PASSWORD`
   - Value: `abcdefghijklmnop` (the 16-character password from Step 2, no spaces)

   **Variable 3:**
   - Name: `EMAIL_FROM`
   - Value: `your-email@gmail.com` (same as GMAIL_USER)

   **Variable 4:**
   - Name: `EMAIL_FROM_NAME`
   - Value: `Booking System` (or whatever you want)

6. Railway will automatically redeploy when you add variables

### Step 4: Test It!

1. Wait for Railway to finish redeploying (check the Deployments tab)
2. Create a test booking on your frontend
3. Check your email (and the customer email) - you should receive confirmation emails!

---

## Option 2: SendGrid Setup (Better for Production)

### Step 1: Sign Up for SendGrid

1. Go to: https://signup.sendgrid.com
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### Step 2: Create an API Key

1. Go to: https://app.sendgrid.com/settings/api_keys
2. Click "Create API Key"
3. Name it: "Booking System"
4. Give it "Full Access" permissions (or at least "Mail Send")
5. Click "Create & View"
6. **COPY THE API KEY** (you won't see it again!)

### Step 3: Verify Sender Email (Important!)

1. Go to: https://app.sendgrid.com/settings/sender_auth/senders/new
2. Enter your email address
3. Fill in your name and business info
4. SendGrid will send you a verification email
5. Click the verification link in your email

### Step 4: Add to Railway

1. Go to your Railway dashboard
2. Select your backend project
3. Click on your backend service
4. Go to the **"Variables"** tab
5. Add these variables:

   **Variable 1:**
   - Name: `SENDGRID_API_KEY`
   - Value: `SG.your-api-key-here` (the API key from Step 2)

   **Variable 2:**
   - Name: `EMAIL_FROM`
   - Value: `your-verified-email@domain.com` (the email you verified in Step 3)

   **Variable 3:**
   - Name: `EMAIL_FROM_NAME`
   - Value: `Your Business Name`

6. Railway will automatically redeploy

---

## Troubleshooting

### Gmail Issues:
- **"Invalid login"**: Make sure you used an App Password, not your regular Gmail password
- **"Less secure app"**: You need to use App Passwords with 2FA enabled, not less secure apps
- **Can't find App Passwords**: Make sure 2-Step Verification is enabled first

### SendGrid Issues:
- **"Unauthorized"**: Make sure the API key is correct and has Mail Send permissions
- **"Sender not verified"**: You must verify your sender email first
- **Emails in spam**: Add SPF/DKIM records (SendGrid will guide you)

### General:
- **Emails not sending**: Check Railway logs for error messages
- **Check email status**: Look in the `email_notifications` table in your database

---

## How It Works

Once configured:
- **System Level**: One email service (Gmail or SendGrid) handles all sending
- **Per Business**: Each business owner's email appears in "Reply-To"
- **From Name**: Shows the business name (e.g., "John's Plumbing")
- **Customer Experience**: Emails look like they come from the business, and replies go to the business owner

No need for each business owner to configure anything - it all works automatically!






