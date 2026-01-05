# Next Steps Guide - Step by Step

## Step 1: Run Database Migrations

Migrations will create all the new tables (availability, reviews, email_notifications, etc.)

### Option A: Using Environment Variable (Recommended)

1. Open your `.env` file
2. Add or update this line:
   ```env
   RUN_MIGRATIONS=true
   ```
3. Save the file
4. Start the server:
   ```bash
   npm start
   ```
5. You should see: `✅ Database migrations completed successfully`
6. **Important:** After migrations run once, change `RUN_MIGRATIONS=false` to avoid running them every time

### Option B: One-Time Run

```bash
RUN_MIGRATIONS=true npm start
```

Then stop the server (Ctrl+C) and start normally:
```bash
npm start
```

---

## Step 2: Verify Migrations Worked

Check your database to see if new tables were created:

**In Railway:**
1. Go to your Railway project
2. Click on your PostgreSQL database
3. Open the "Data" tab
4. You should see these new tables:
   - `availability`
   - `blocked_dates`
   - `reviews`
   - `email_notifications`
   - `services` table should have `image_url` column

**Or test via API:**
```bash
curl http://localhost:3000/health
```

Should return: `{"status":"healthy","database":"connected"}`

---

## Step 3: Test the New Features

### Test 1: Set Provider Availability

```bash
# First, login as provider and get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"provider@test.com","password":"yourpassword"}'

# Save the token, then set availability
curl -X POST http://localhost:3000/api/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "availability": [
      {"day_of_week": 1, "start_time": "09:00", "end_time": "17:00"},
      {"day_of_week": 2, "start_time": "09:00", "end_time": "17:00"},
      {"day_of_week": 3, "start_time": "09:00", "end_time": "17:00"},
      {"day_of_week": 4, "start_time": "09:00", "end_time": "17:00"},
      {"day_of_week": 5, "start_time": "09:00", "end_time": "17:00"}
    ]
  }'
```

**Note:** day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, etc.

### Test 2: Get Available Time Slots

```bash
# Get available slots for a provider on a specific date
curl "http://localhost:3000/api/availability/1/slots?date=2024-12-25"
```

### Test 3: Create Service with Image

```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PROVIDER_TOKEN" \
  -d '{
    "title": "Plumbing Service",
    "description": "Professional plumbing",
    "category": "Plumbing",
    "price": 75.00,
    "duration_minutes": 60,
    "image_url": "https://example.com/image.jpg"
  }'
```

### Test 4: Create Booking (Will Check Availability)

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -d '{
    "service_id": 1,
    "booking_date": "2024-12-25T10:00:00.000Z",
    "notes": "Please call when you arrive"
  }'
```

**This will:**
- ✅ Check if time slot is available
- ✅ Create the booking
- ✅ Send confirmation emails (logged to database)

### Test 5: Create a Review

```bash
# First, complete a booking (provider updates status to "completed")
# Then customer can review:

curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -d '{
    "booking_id": 1,
    "service_id": 1,
    "provider_id": 1,
    "rating": 5,
    "comment": "Great service!"
  }'
```

### Test 6: Get Service with Ratings

```bash
# Get service details (now includes ratings)
curl http://localhost:3000/api/services/1

# Get reviews for a service
curl http://localhost:3000/api/reviews/service/1

# Get average rating
curl http://localhost:3000/api/reviews/service/1/rating
```

---

## Step 4: Check Email Notifications

Emails are logged to the database. Check them:

```sql
SELECT * FROM email_notifications ORDER BY sent_at DESC;
```

Or via API (you'd need to add an endpoint, or check directly in database).

---

## Step 5: (Optional) Integrate Real Email Service

### Using SendGrid:

1. Sign up at https://sendgrid.com
2. Get API key
3. Add to `.env`:
   ```env
   SENDGRID_API_KEY=your-key-here
   ```
4. Install SendGrid:
   ```bash
   npm install @sendgrid/mail
   ```
5. Update `src/services/emailService.js`:
   ```javascript
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);

   const sendEmail = async (emailData) => {
     // ... existing code to log to database ...
     
     // Send actual email
     await sgMail.send({
       to: emailData.recipient_email,
       from: 'noreply@yourdomain.com',
       subject: emailData.subject,
       text: emailData.body
     });
     
     return result.rows[0];
   };
   ```

### Using Mailgun:

Similar process, but use Mailgun SDK instead.

---

## Troubleshooting

### "Table already exists" error
- This is OK! It means migrations already ran
- Set `RUN_MIGRATIONS=false` in `.env`

### "Column already exists" error
- Migrations partially ran
- You may need to manually add missing columns or reset database

### Availability not working
- Make sure you set availability schedule first
- Check that booking date matches available day/time
- Verify no blocked dates conflict

### Emails not sending
- This is normal! Emails are logged to database
- To send real emails, integrate SendGrid/Mailgun (Step 5)

### Reviews not working
- Booking must be "completed" status first
- Only one review per booking
- Customer must be the one who made the booking

---

## Quick Test Checklist

- [ ] Migrations ran successfully
- [ ] Can set provider availability
- [ ] Can get available time slots
- [ ] Can create service with image_url
- [ ] Can create booking (checks availability)
- [ ] Email notifications logged to database
- [ ] Can create review after completing booking
- [ ] Ratings show on services

---

## Need Help?

If something doesn't work:
1. Check server logs for errors
2. Verify database connection
3. Check that all environment variables are set
4. Make sure you're using correct tokens
5. Verify database tables exist






