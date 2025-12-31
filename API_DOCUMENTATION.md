# Local Services Booking API Documentation

Base URL: `http://localhost:3000/api` (or your Railway deployment URL)

All endpoints return JSON. Protected routes require `Authorization: Bearer <token>` header.

---

## Authentication

### Register User
**POST** `/auth/register`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "123-456-7890",
  "user_type": "customer" // or "provider"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "user_type": "customer"
  },
  "token": "jwt-token-here"
}
```

### Login
**POST** `/auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "jwt-token-here"
}
```

### Get Current User
**GET** `/auth/me` 🔒

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "123-456-7890",
    "user_type": "customer",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Providers (Business Profiles)

### Create Provider Profile
**POST** `/providers` 🔒 (Provider only)

**Body:**
```json
{
  "business_name": "Joe's Plumbing",
  "description": "Professional plumbing services",
  "phone": "555-0100",
  "address": "123 Main St, City, State"
}
```

**Response:** `201 Created`

### Get My Provider Profile
**GET** `/providers/me` 🔒 (Provider only)

**Response:** `200 OK`

### Update Provider Profile
**PUT** `/providers/me` 🔒 (Provider only)

**Body:** (all fields optional)
```json
{
  "business_name": "Updated Name",
  "description": "Updated description",
  "phone": "555-0200",
  "address": "New Address"
}
```

---

## Services

### Create Service
**POST** `/services` 🔒 (Provider only)

**Body:**
```json
{
  "title": "Plumbing Repair",
  "description": "Fix leaks and clogs",
  "category": "Plumbing",
  "price": 75.00,
  "duration_minutes": 60
}
```

**Response:** `201 Created`

### Get My Services
**GET** `/services` 🔒 (Provider only)

**Response:** `200 OK`
```json
{
  "services": [
    {
      "id": 1,
      "provider_id": 1,
      "title": "Plumbing Repair",
      "description": "Fix leaks and clogs",
      "category": "Plumbing",
      "price": "75.00",
      "duration_minutes": 60,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Browse Services (Public)
**GET** `/services/browse`

**Query Parameters:**
- `category` (optional) - Filter by category
- `search` (optional) - Search in title/description
- `limit` (optional, default: 50) - Results per page
- `offset` (optional, default: 0) - Pagination offset

**Example:** `/services/browse?category=Plumbing&search=repair`

**Response:** `200 OK`

### Get Service Details
**GET** `/services/:id` (Public)

**Response:** `200 OK`

### Update Service
**PUT** `/services/:id` 🔒 (Provider only)

**Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "category": "New Category",
  "price": 100.00,
  "duration_minutes": 90,
  "is_active": false
}
```

### Delete Service
**DELETE** `/services/:id` 🔒 (Provider only)

**Response:** `200 OK`
```json
{
  "message": "Service deleted successfully"
}
```

---

## Bookings

### Create Booking
**POST** `/bookings` 🔒 (Customer only)

**Body:**
```json
{
  "service_id": 1,
  "booking_date": "2024-01-15T10:00:00.000Z",
  "notes": "Please call when you arrive"
}
```

**Response:** `201 Created`

### Get My Bookings
**GET** `/bookings/my-bookings` 🔒 (Customer only)

**Response:** `200 OK`
```json
{
  "bookings": [
    {
      "id": 1,
      "customer_id": 2,
      "service_id": 1,
      "provider_id": 1,
      "booking_date": "2024-01-15T10:00:00.000Z",
      "status": "pending",
      "notes": "Please call when you arrive",
      "service_title": "Plumbing Repair",
      "price": "75.00",
      "provider_name": "Joe's Plumbing"
    }
  ]
}
```

### Get Provider Bookings
**GET** `/bookings/provider/my-bookings` 🔒 (Provider only)

**Response:** `200 OK`

### Get Booking Details
**GET** `/bookings/:id` 🔒

**Response:** `200 OK`

### Update Booking Status
**PUT** `/bookings/:id/status` 🔒 (Provider only)

**Body:**
```json
{
  "status": "confirmed" // "pending", "confirmed", "completed", "cancelled"
}
```

**Response:** `200 OK`

### Cancel Booking
**PUT** `/bookings/:id/cancel` 🔒 (Customer only)

**Response:** `200 OK`
```json
{
  "message": "Booking cancelled successfully",
  "booking": { ... }
}
```

---

## Business Info (for AI Context)

### Create/Update Business Info
**POST** or **PUT** `/business-info` 🔒 (Provider only)

**Body:**
```json
{
  "business_hours": "Mon-Fri: 9am-5pm, Sat: 10am-2pm",
  "location_details": "Located in downtown, free parking available",
  "policies": "24-hour cancellation policy, payment due at service",
  "other_info": "We offer emergency services 24/7. Senior discounts available."
}
```

**Response:** `200 OK`

### Get My Business Info
**GET** `/business-info/me` 🔒 (Provider only)

**Response:** `200 OK`
```json
{
  "businessInfo": {
    "id": "uuid-here",
    "provider_id": "uuid-here",
    "business_hours": "Mon-Fri: 9am-5pm",
    "location_details": "...",
    "policies": "...",
    "other_info": "...",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## AI Customer Service

### Ask AI a Question
**POST** `/ai/chat` (Public)

**Body:**
```json
{
  "question": "What are your business hours?",
  "provider_id": 1
}
```

**Response:** `200 OK`
```json
{
  "question": "What are your business hours?",
  "response": "Our business hours are Monday through Friday from 9am to 5pm, and Saturday from 10am to 2pm. We're closed on Sundays.",
  "provider_id": 1
}
```

**Note:** `provider_id` should be the user_id of the provider (not the provider UUID).

---

## Health Check

### Check Server Health
**GET** `/health` (Public)

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (wrong user type)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error
- `502` - Bad Gateway (AI service unavailable)
- `503` - Service Unavailable (AI not configured)

---

## Authentication Flow

1. Register or login to get a JWT token
2. Include token in all protected requests:
   ```
   Authorization: Bearer <your-jwt-token>
   ```
3. Token expires after 7 days

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Prices are stored as decimals (strings in JSON)
- Provider must create provider profile before creating services
- Customer must be registered before creating bookings
- AI chat requires OpenAI API key to be configured




