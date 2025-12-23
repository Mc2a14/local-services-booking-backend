#!/bin/bash

# API Testing Script
# This script tests the main API endpoints

BASE_URL="http://localhost:3000/api"
echo "🧪 Testing API Endpoints"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Register Provider
echo -e "${BLUE}1. Registering Provider...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "provider@test.com",
    "password": "test123",
    "full_name": "Test Provider",
    "user_type": "provider"
  }')

PROVIDER_TOKEN=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$PROVIDER_TOKEN" ]; then
  # Try login instead (user might already exist)
  echo "  User might already exist, trying login..."
  LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"provider@test.com","password":"test123"}')
  PROVIDER_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
fi

if [ -n "$PROVIDER_TOKEN" ]; then
  echo -e "${GREEN}✓ Provider token obtained${NC}"
else
  echo -e "${RED}✗ Failed to get provider token${NC}"
  exit 1
fi

# Step 2: Register Customer
echo -e "${BLUE}2. Registering Customer...${NC}"
CUSTOMER_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "test123",
    "full_name": "Test Customer",
    "user_type": "customer"
  }')

CUSTOMER_TOKEN=$(echo $CUSTOMER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$CUSTOMER_TOKEN" ]; then
  echo "  User might already exist, trying login..."
  CUSTOMER_LOGIN=$(curl -s -X POST ${BASE_URL}/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"customer@test.com","password":"test123"}')
  CUSTOMER_TOKEN=$(echo $CUSTOMER_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
fi

if [ -n "$CUSTOMER_TOKEN" ]; then
  echo -e "${GREEN}✓ Customer token obtained${NC}"
else
  echo -e "${RED}✗ Failed to get customer token${NC}"
fi

# Step 3: Create Provider Profile
echo -e "${BLUE}3. Creating Provider Profile...${NC}"
PROVIDER_PROFILE=$(curl -s -X POST ${BASE_URL}/providers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  -d '{
    "business_name": "Joe'"'"'s Plumbing Service",
    "description": "Professional plumbing services with 10 years experience",
    "phone": "555-0100",
    "address": "123 Main St, City, State 12345"
  }')

PROVIDER_ID=$(echo $PROVIDER_PROFILE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('provider', {}).get('id', ''))" 2>/dev/null)

if [ -n "$PROVIDER_PROFILE" ] && echo "$PROVIDER_PROFILE" | grep -q "business_name"; then
  echo -e "${GREEN}✓ Provider profile created${NC}"
  echo "$PROVIDER_PROFILE" | python3 -m json.tool 2>/dev/null | head -10
else
  echo -e "${RED}✗ Failed to create provider profile${NC}"
  echo "$PROVIDER_PROFILE"
fi

# Step 4: Create Service
echo -e "${BLUE}4. Creating Service...${NC}"
SERVICE_RESPONSE=$(curl -s -X POST ${BASE_URL}/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  -d '{
    "title": "Emergency Plumbing Repair",
    "description": "24/7 emergency plumbing services",
    "category": "Plumbing",
    "price": 150.00,
    "duration_minutes": 90,
    "image_url": "https://example.com/plumbing.jpg"
  }')

SERVICE_ID=$(echo $SERVICE_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('service', {}).get('id', ''))" 2>/dev/null)

if [ -n "$SERVICE_ID" ]; then
  echo -e "${GREEN}✓ Service created (ID: $SERVICE_ID)${NC}"
  echo "$SERVICE_RESPONSE" | python3 -m json.tool 2>/dev/null | head -15
else
  echo -e "${RED}✗ Failed to create service${NC}"
  echo "$SERVICE_RESPONSE"
fi

# Step 5: Set Availability
echo -e "${BLUE}5. Setting Provider Availability...${NC}"
AVAILABILITY_RESPONSE=$(curl -s -X POST ${BASE_URL}/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  -d '{
    "availability": [
      {"day_of_week": 1, "start_time": "09:00", "end_time": "17:00"},
      {"day_of_week": 2, "start_time": "09:00", "end_time": "17:00"},
      {"day_of_week": 3, "start_time": "09:00", "end_time": "17:00"},
      {"day_of_week": 4, "start_time": "09:00", "end_time": "17:00"},
      {"day_of_week": 5, "start_time": "09:00", "end_time": "17:00"}
    ]
  }')

if echo "$AVAILABILITY_RESPONSE" | grep -q "availability"; then
  echo -e "${GREEN}✓ Availability set successfully${NC}"
else
  echo -e "${RED}✗ Failed to set availability${NC}"
  echo "$AVAILABILITY_RESPONSE"
fi

# Step 6: Get Available Time Slots
echo -e "${BLUE}6. Getting Available Time Slots...${NC}"
# Get provider user ID (usually 1 if first user)
SLOTS_RESPONSE=$(curl -s "http://localhost:3000/api/availability/1/slots?date=2025-12-25")

if echo "$SLOTS_RESPONSE" | grep -q "available_slots"; then
  echo -e "${GREEN}✓ Available slots retrieved${NC}"
  echo "$SLOTS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -20
else
  echo -e "${YELLOW}⚠ Could not get slots (may need provider user ID)${NC}"
fi

# Step 7: Browse Services (Public)
echo -e "${BLUE}7. Browsing Services (Public Endpoint)...${NC}"
BROWSE_RESPONSE=$(curl -s "${BASE_URL}/services/browse")

if echo "$BROWSE_RESPONSE" | grep -q "services"; then
  echo -e "${GREEN}✓ Services browsed successfully${NC}"
  echo "$BROWSE_RESPONSE" | python3 -m json.tool 2>/dev/null | head -20
else
  echo -e "${RED}✗ Failed to browse services${NC}"
  echo "$BROWSE_RESPONSE"
fi

# Step 8: Create Booking (if we have service ID and customer token)
if [ -n "$SERVICE_ID" ] && [ -n "$CUSTOMER_TOKEN" ]; then
  echo -e "${BLUE}8. Creating Booking...${NC}"
  BOOKING_DATE=$(date -u -v+1d +"%Y-%m-%dT10:00:00.000Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT10:00:00.000Z" 2>/dev/null || echo "2025-12-25T10:00:00.000Z")
  
  BOOKING_RESPONSE=$(curl -s -X POST ${BASE_URL}/bookings \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
    -d "{
      \"service_id\": $SERVICE_ID,
      \"booking_date\": \"$BOOKING_DATE\",
      \"notes\": \"Please call when you arrive\"
    }")
  
  BOOKING_ID=$(echo $BOOKING_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('booking', {}).get('id', ''))" 2>/dev/null)
  
  if [ -n "$BOOKING_ID" ]; then
    echo -e "${GREEN}✓ Booking created (ID: $BOOKING_ID)${NC}"
    echo "$BOOKING_RESPONSE" | python3 -m json.tool 2>/dev/null | head -20
  else
    echo -e "${YELLOW}⚠ Booking might have failed (check availability)${NC}"
    echo "$BOOKING_RESPONSE" | python3 -m json.tool 2>/dev/null
  fi
else
  echo -e "${BLUE}8. Skipping booking (need service ID and customer token)${NC}"
fi

# Step 9: Get Current User
echo -e "${BLUE}9. Getting Current User (Provider)...${NC}"
ME_RESPONSE=$(curl -s -X GET ${BASE_URL}/auth/me \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}")

if echo "$ME_RESPONSE" | grep -q "user"; then
  echo -e "${GREEN}✓ Current user retrieved${NC}"
  echo "$ME_RESPONSE" | python3 -m json.tool 2>/dev/null
else
  echo -e "${RED}✗ Failed to get current user${NC}"
  echo "$ME_RESPONSE"
fi

echo ""
echo -e "${GREEN}✅ API Testing Complete!${NC}"
echo ""
echo "Tokens saved:"
echo "  Provider Token: ${PROVIDER_TOKEN:0:50}..."
if [ -n "$CUSTOMER_TOKEN" ]; then
  echo "  Customer Token: ${CUSTOMER_TOKEN:0:50}..."
fi

