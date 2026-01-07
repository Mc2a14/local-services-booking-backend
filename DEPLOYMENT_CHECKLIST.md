# Deployment Checklist - Customer Inquiries Feature

## Backend Changes (local-services-booking-backend)

### New Files Created:
1. `src/db/migrations/add_customer_inquiries_table.sql` - Database migration
2. `src/services/inquiryService.js` - Service for handling inquiries
3. `src/controllers/inquiryController.js` - Controller for inquiry endpoints
4. `src/routes/inquiries.js` - Routes for inquiry endpoints
5. `CUSTOMER_INQUIRIES_IMPLEMENTATION.md` - Implementation documentation

### Modified Files:
1. `src/services/aiService.js` - Updated to detect when to suggest lead collection
2. `src/controllers/aiController.js` - Updated to return `shouldCollectInfo` flag
3. `src/services/emailService.js` - Added `sendInquiryNotification()` function
4. `src/routes/index.js` - Added inquiry routes
5. `src/server.js` - Added customer_inquiries migration to auto-run

## Frontend Changes (local-services-booking-frontend)

### New Files Created:
1. `src/pages/CustomerInquiries.jsx` - Business owner inquiries dashboard page

### Modified Files:
1. `src/components/ChatWidget.jsx` - Added inquiry form, "Request Contact" button, and AI detection handling
2. `src/App.jsx` - Added route for `/inquiries`
3. `src/pages/ProviderDashboard.jsx` - Added navigation button for inquiries
4. `src/translations/en.json` - Added all inquiry-related translations
5. `src/translations/es.json` - Added all inquiry-related Spanish translations

## Deployment Steps

### Backend Deployment:

1. **If using Git + Railway:**
   ```bash
   cd /Users/nelsonbarreto/Desktop/local-services-booking-backend
   git add .
   git commit -m "Add customer inquiries feature - AI lead collection and management"
   git push
   ```

2. **If Railway is connected to GitHub:**
   - Push changes to your GitHub repository
   - Railway will automatically detect and deploy

3. **Verify Deployment:**
   - Check Railway logs for successful migration: "✅ Customer inquiries table migration completed"
   - Test API endpoint: `POST /api/inquiries` (should work after deployment)

### Frontend Deployment:

1. **Commit and push frontend changes:**
   ```bash
   cd /Users/nelsonbarreto/Desktop/local-services-booking-frontend
   git add .
   git commit -m "Add customer inquiries UI - chat form and dashboard page"
   git push
   ```

2. **Verify Frontend Deployment:**
   - Check that the "Customer Inquiries" button appears in the dashboard navigation
   - Test the inquiry form in the chat widget

## Post-Deployment Testing

### Test Customer Inquiry Collection:
1. Go to a business booking page
2. Open the AI chat
3. Ask a question that would trigger lead collection (e.g., "Can someone contact me?")
4. OR click "Request Contact" button
5. Fill out the inquiry form (at least one field)
6. Submit and verify success message

### Test Business Owner Dashboard:
1. Login as a business owner
2. Navigate to "Customer Inquiries" (📋 button in dashboard)
3. Verify you can see submitted inquiries
4. Test filtering by status (All/New/Contacted/Followed Up)
5. Click an inquiry to expand details
6. Test updating inquiry status
7. Verify email notification was received (check business owner's email)

### Test Email Notifications:
1. Submit an inquiry from customer chat
2. Check business owner's email inbox
3. Verify email notification with inquiry details was received

## Important Notes:

- The database migration will run automatically on backend deployment (via `start:migrate` command)
- Email notifications use the business owner's email configuration (if set in their profile)
- If email is not configured, the inquiry will still be saved but no email will be sent (logged to console)

