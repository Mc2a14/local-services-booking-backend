# Quick Deploy Guide - Customer Inquiries Feature

## ✅ All Files Are Ready

All backend and frontend changes have been implemented. Here's what to do next:

## Deployment Options for Railway

Railway typically deploys from:
1. **GitHub Repository** (most common)
2. **Direct file upload** (via Railway CLI)
3. **Connected Git repository**

## Option 1: Deploy via GitHub (Recommended)

### Backend:

```bash
# Navigate to backend directory
cd /Users/nelsonbarreto/Desktop/local-services-booking-backend

# If git is not initialized:
git init
git add .
git commit -m "Add customer inquiries feature - AI lead collection and management"

# Add your GitHub repository as remote (replace with your repo URL)
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

### Frontend:

```bash
# Navigate to frontend directory
cd /Users/nelsonbarreto/Desktop/local-services-booking-frontend

# If git is not initialized:
git init
git add .
git commit -m "Add customer inquiries UI - chat form and dashboard page"

# Add your GitHub repository as remote (replace with your repo URL)
git remote add origin https://github.com/your-username/your-frontend-repo.git
git branch -M main
git push -u origin main
```

**Then in Railway:**
- Make sure your Railway project is connected to the GitHub repository
- Railway will automatically deploy when you push changes

## Option 2: Railway CLI

If you have Railway CLI installed:

```bash
# For backend
cd /Users/nelsonbarreto/Desktop/local-services-booking-backend
railway up

# For frontend (in a separate terminal)
cd /Users/nelsonbarreto/Desktop/local-services-booking-frontend
railway up
```

## What Will Happen on Deployment

### Backend:
1. ✅ Railway will build the Node.js application
2. ✅ Run database migrations automatically (`npm run start:migrate`)
3. ✅ Create `customer_inquiries` table in your database
4. ✅ Start the server with new endpoints available

### Frontend:
1. ✅ Railway will build the React application
2. ✅ New `/inquiries` page will be available
3. ✅ Updated ChatWidget with inquiry form will be live
4. ✅ Navigation button will appear in dashboard

## Verify Deployment Success

### Backend Health Check:
```bash
curl https://your-backend-url.railway.app/health
```

### Check Migration:
Look in Railway logs for:
```
✅ Customer inquiries table migration completed
```

### Test API Endpoint:
```bash
curl -X POST https://your-backend-url.railway.app/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{"business_slug": "test-business", "customer_name": "Test User"}'
```

## Need Help?

1. **Check Railway Dashboard:**
   - Go to your Railway project
   - Check "Deployments" tab for build status
   - Check "Logs" tab for any errors

2. **Common Issues:**
   - Database migration fails → Check database connection in Railway environment variables
   - Build fails → Check Railway logs for specific error messages
   - API not working → Verify environment variables (especially `DATABASE_URL`)

3. **Test Locally First (Optional):**
   ```bash
   # Backend
   cd /Users/nelsonbarreto/Desktop/local-services-booking-backend
   npm install
   npm run migrate  # Run migrations manually
   npm start        # Start server
   
   # Frontend (in separate terminal)
   cd /Users/nelsonbarreto/Desktop/local-services-booking-frontend
   npm install
   npm run dev      # Start dev server
   ```

## Files Changed Summary

### Backend (5 new files, 5 modified):
- ✅ New: `src/db/migrations/add_customer_inquiries_table.sql`
- ✅ New: `src/services/inquiryService.js`
- ✅ New: `src/controllers/inquiryController.js`
- ✅ New: `src/routes/inquiries.js`
- ✅ Modified: `src/services/aiService.js`
- ✅ Modified: `src/controllers/aiController.js`
- ✅ Modified: `src/services/emailService.js`
- ✅ Modified: `src/routes/index.js`
- ✅ Modified: `src/server.js`

### Frontend (1 new file, 4 modified):
- ✅ New: `src/pages/CustomerInquiries.jsx`
- ✅ Modified: `src/components/ChatWidget.jsx`
- ✅ Modified: `src/App.jsx`
- ✅ Modified: `src/pages/ProviderDashboard.jsx`
- ✅ Modified: `src/translations/en.json` and `es.json`

---

**Once deployed, test the feature and let me know if you encounter any issues!**

