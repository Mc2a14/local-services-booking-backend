# Testing Guide

## Quick Start Testing

### 1. Setup Environment

Make sure your `.env` file has:
```env
DATABASE_URL=your-database-url
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-your-key
PORT=3000
RUN_MIGRATIONS=true
```

### 2. Run Database Migrations

```bash
RUN_MIGRATIONS=true npm start
```

Or set `RUN_MIGRATIONS=true` in your `.env` file.

### 3. Start the Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server should start on `http://localhost:3000`

---

## Testing with cURL

### 1. Register a Provider

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "provider@test.com",
    "password": "test123",
    "full_name": "Test Provider",
    "user_type": "provider"
  }'
```

**Save the token** from the response!

### 2. Create Provider Profile

```bash
curl -X POST http://localhost:3000/api/providers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "business_name": "Test Business",
    "description": "A test business",
    "phone": "555-0100",
    "address": "123 Test St"
  }'
```

### 3. Add Business Info

```bash
curl -X POST http://localhost:3000/api/business-info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "business_hours": "Mon-Fri: 9am-5pm",
    "location_details": "Downtown location",
    "policies": "24-hour cancellation",
    "other_info": "We offer senior discounts"
  }'
```

### 4. Create a Service

```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Test Service",
    "description": "A test service",
    "category": "Testing",
    "price": 50.00,
    "duration_minutes": 30
  }'
```

### 5. Register a Customer

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "test123",
    "full_name": "Test Customer",
    "user_type": "customer"
  }'
```

**Save this customer token!**

### 6. Browse Services (Public)

```bash
curl http://localhost:3000/api/services/browse
```

### 7. Create a Booking

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CUSTOMER_TOKEN_HERE" \
  -d '{
    "service_id": 1,
    "booking_date": "2024-12-25T10:00:00.000Z",
    "notes": "Test booking"
  }'
```

### 8. Test AI Chat

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are your business hours?",
    "provider_id": 1
  }'
```

### 9. Get Provider Bookings

```bash
curl http://localhost:3000/api/bookings/provider/my-bookings \
  -H "Authorization: Bearer PROVIDER_TOKEN_HERE"
```

### 10. Update Booking Status

```bash
curl -X PUT http://localhost:3000/api/bookings/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PROVIDER_TOKEN_HERE" \
  -d '{
    "status": "confirmed"
  }'
```

---

## Testing with Postman

1. **Import Collection:**
   - Create a new collection
   - Add all endpoints from API_DOCUMENTATION.md
   - Set base URL: `http://localhost:3000/api`

2. **Setup Environment Variables:**
   - Create environment variables:
     - `base_url`: `http://localhost:3000/api`
     - `provider_token`: (set after login)
     - `customer_token`: (set after login)

3. **Test Flow:**
   - Register provider → Save token
   - Create provider profile
   - Add business info
   - Create service
   - Register customer → Save token
   - Browse services
   - Create booking
   - Test AI chat
   - Manage bookings

---

## Testing Checklist

### Authentication
- [ ] Register provider user
- [ ] Register customer user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Get current user profile
- [ ] Access protected route without token (should fail)

### Providers
- [ ] Create provider profile
- [ ] Try to create duplicate provider (should fail)
- [ ] Get provider profile
- [ ] Update provider profile

### Services
- [ ] Create service (provider)
- [ ] List my services (provider)
- [ ] Browse services (public)
- [ ] Search services by category
- [ ] Get service details
- [ ] Update service
- [ ] Delete service
- [ ] Try to create service without provider profile (should fail)

### Bookings
- [ ] Create booking (customer)
- [ ] List my bookings (customer)
- [ ] List provider bookings
- [ ] Get booking details
- [ ] Update booking status (provider)
- [ ] Cancel booking (customer)
- [ ] Try to book inactive service (should fail)

### Business Info
- [ ] Add business info
- [ ] Update business info
- [ ] Get business info

### AI Chat
- [ ] Ask AI about business hours
- [ ] Ask AI about services
- [ ] Ask AI about policies
- [ ] Ask AI custom question (from other_info)
- [ ] Test without OpenAI key (should return error)

### Health Check
- [ ] Check health endpoint
- [ ] Verify database connection status

---

## Common Issues

### "Provider not found" error
- Make sure you created a provider profile first
- Check that you're using the correct user_id

### "Service not found" error
- Verify the service_id exists
- Check that the service belongs to the provider

### "OpenAI API error"
- Verify OPENAI_API_KEY is set in .env
- Check that the key is valid
- Ensure you have credits in your OpenAI account

### Database connection errors
- Verify DATABASE_URL is correct
- Check that PostgreSQL is running
- Ensure database exists

---

## Performance Testing

### Load Test with Apache Bench

```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3000/health

# Test browse services
ab -n 500 -c 5 http://localhost:3000/api/services/browse
```

---

## Next Steps

1. Test all endpoints
2. Fix any issues found
3. Deploy to Railway
4. Test in production environment






