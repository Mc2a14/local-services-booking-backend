# Customer Inquiries Feature - Implementation Summary

## Backend Implementation ✅ (COMPLETE)

### What Was Implemented:

1. **Database Migration** (`src/db/migrations/add_customer_inquiries_table.sql`)
   - Created `customer_inquiries` table with fields: id, provider_id, customer_name, customer_email, customer_phone, inquiry_message, status, created_at, updated_at
   - Added indexes for performance
   - Status can be: 'new', 'contacted', 'followed_up'

2. **Inquiry Service** (`src/services/inquiryService.js`)
   - `createInquiry()` - Save customer inquiries
   - `getInquiriesByProvider()` - Get all inquiries for a business owner
   - `updateInquiryStatus()` - Update inquiry status
   - `getInquiryById()` - Get single inquiry
   - Automatically sends email notification to business owner when inquiry is created

3. **Inquiry Controller** (`src/controllers/inquiryController.js`)
   - `POST /api/inquiries` (public) - Customers submit inquiries
   - `GET /api/inquiries` (authenticated) - Business owners get their inquiries
   - `GET /api/inquiries/:inquiryId` (authenticated) - Get single inquiry
   - `PATCH /api/inquiries/:inquiryId/status` (authenticated) - Update inquiry status

4. **Routes** (`src/routes/inquiries.js` and `src/routes/index.js`)
   - Registered inquiry routes at `/api/inquiries`

5. **AI Service Updates** (`src/services/aiService.js`)
   - Modified `generateAIResponse()` to detect when lead collection should be suggested
   - Returns object: `{ response: string, shouldCollectInfo: boolean }`
   - Uses a lightweight second AI call to analyze if info collection is appropriate

6. **AI Controller Updates** (`src/controllers/aiController.js`)
   - Updated `/api/ai/chat` endpoint to return `shouldCollectInfo` flag
   - Response format: `{ question, response, shouldCollectInfo, business_name }`

7. **Email Notifications** (`src/services/emailService.js`)
   - Added `sendInquiryNotification()` function
   - Sends email to business owner when new inquiry is received
   - Includes all inquiry details (name, email, phone, message, timestamp)

8. **Database Migration Integration** (`src/server.js`)
   - Added customer_inquiries table migration to auto-run on server start

## Frontend Implementation Required (TODO)

### 1. Update ChatWidget Component

**File**: `src/components/ChatWidget.jsx` (or similar customer chat component)

**Changes needed:**

1. **Add "Request Contact" Button**
   - Add a persistent button in the chat UI: "Request Contact" or "Get in Touch"
   - This is the manual trigger (Option 3 - Hybrid approach)

2. **Handle AI Response Flag**
   - When AI returns `shouldCollectInfo: true`, show the info collection form
   - Display a message like: "I'd be happy to have [Business Name] contact you. Can I get your information?"

3. **Info Collection Form**
   - Create a form component with fields (all optional):
     - Name (text input)
     - Email (email input)
     - Phone (tel input)
     - Message (textarea)
   - Submit button: "Submit" or "Send"
   - Form validation: At least one field must be filled

4. **Submit Inquiry**
   - On form submission, call: `POST /api/inquiries`
   - Body: `{ business_slug, customer_name, customer_email, customer_phone, inquiry_message }`
   - Show success message: "Your information has been received. The business will contact you soon!"
   - Reset form after successful submission

5. **UI/UX Flow**
   - Show form inline in chat (similar to how messages appear)
   - Form can be triggered by:
     - AI detecting need (`shouldCollectInfo: true`)
     - User clicking "Request Contact" button
   - Form should be dismissible/cancelable

### 2. Create Customer Inquiries Page (Business Owner Dashboard)

**New File**: `src/pages/CustomerInquiries.jsx`

**Features needed:**

1. **List View**
   - Display all inquiries in a table or card list
   - Show: Customer Name, Email, Phone, Message, Date Received, Status
   - Filter by status: All / New / Contacted / Followed Up

2. **Status Management**
   - Dropdown or buttons to change status
   - Call: `PATCH /api/inquiries/:inquiryId/status`
   - Body: `{ status: 'new' | 'contacted' | 'followed_up' }`

3. **Inquiry Details**
   - Click to view full details
   - Show all collected information
   - Allow updating status from detail view

4. **Empty State**
   - Message when no inquiries exist
   - Helpful text explaining what inquiries are

5. **UI Elements**
   - Status badges (New = blue, Contacted = yellow, Followed Up = green)
   - Sort by date (newest first)
   - Mobile-friendly layout

### 3. Add Navigation Link

**File**: `src/components/Navigation.jsx` or dashboard sidebar

**Change needed:**
- Add "Customer Inquiries" link to business owner navigation
- Show badge with count of new inquiries (optional enhancement)
- Route: `/dashboard/inquiries` or `/inquiries`

### 4. Update Translations

**Files**: `src/translations/en.json` and `src/translations/es.json`

**Add translation keys:**

```json
{
  "inquiries": {
    "title": "Customer Inquiries",
    "new": "New Inquiry",
    "contacted": "Contacted",
    "followedUp": "Followed Up",
    "noInquiries": "No inquiries yet",
    "noInquiriesDesc": "When customers request contact through your AI assistant, their information will appear here.",
    "name": "Name",
    "email": "Email",
    "phone": "Phone",
    "message": "Message",
    "received": "Received",
    "status": "Status",
    "updateStatus": "Update Status",
    "requestContact": "Request Contact",
    "getInTouch": "Get in Touch",
    "submitInfo": "Submit Information",
    "infoSubmitted": "Your information has been received. The business will contact you soon!",
    "aiSuggestion": "I'd be happy to have {{businessName}} contact you. Can I get your information?",
    "allStatuses": "All",
    "newStatus": "New",
    "contactedStatus": "Contacted",
    "followedUpStatus": "Followed Up"
  }
}
```

### 5. API Integration Helpers

**File**: `src/utils/apiRequest.js` or similar

**Add helper functions** (if not already using `apiRequest`):

```javascript
// Get inquiries
export const getInquiries = (status = null) => {
  const url = status ? `/api/inquiries?status=${status}` : '/api/inquiries';
  return apiRequest(url);
};

// Create inquiry (public, no auth)
export const createInquiry = (data) => {
  return fetch(`${API_URL}/api/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());
};

// Update inquiry status
export const updateInquiryStatus = (inquiryId, status) => {
  return apiRequest(`/api/inquiries/${inquiryId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};
```

## Testing Checklist

### Backend Testing:
- [x] Database migration runs successfully
- [x] Create inquiry endpoint works (public)
- [x] Get inquiries endpoint works (authenticated)
- [x] Update inquiry status works (authenticated)
- [x] AI returns `shouldCollectInfo` flag
- [x] Email notifications are sent

### Frontend Testing (After Implementation):
- [ ] "Request Contact" button appears in chat
- [ ] AI can trigger info collection form
- [ ] Form submission works
- [ ] Business owner can view inquiries
- [ ] Status updates work
- [ ] Translations work (English/Spanish)
- [ ] Mobile-friendly UI
- [ ] Email notifications received by business owners

## API Endpoints Summary

### Public Endpoints:
- `POST /api/inquiries` - Submit inquiry
  - Body: `{ business_slug, customer_name?, customer_email?, customer_phone?, inquiry_message? }`
  - Response: `{ success: true, message: string, inquiry: { id, created_at } }`

### Authenticated Endpoints (Business Owner):
- `GET /api/inquiries?status=new` - Get inquiries (filter by status)
  - Response: `{ inquiries: [...], count: number }`

- `GET /api/inquiries/:inquiryId` - Get single inquiry
  - Response: `{ inquiry: {...} }`

- `PATCH /api/inquiries/:inquiryId/status` - Update status
  - Body: `{ status: 'new' | 'contacted' | 'followed_up' }`
  - Response: `{ success: true, inquiry: {...} }`

### Updated Endpoint:
- `POST /api/ai/chat` - Now returns `shouldCollectInfo` flag
  - Response: `{ question, response, shouldCollectInfo: boolean, business_name }`

## Notes

- All fields in inquiry form are optional, but at least one must be provided
- Email notifications use the business owner's email configuration (if set)
- Inquiries are automatically assigned status 'new' when created
- Business owners can track and manage inquiries through the dashboard
- The AI assistant intelligently detects when to suggest collecting info, but users can also manually request contact

