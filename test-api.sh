#!/bin/bash

# Simple API Testing Script
# Usage: ./test-api.sh

BASE_URL="http://localhost:3000/api"

echo "🧪 Testing Local Services Booking API"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1. Testing Health Check..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/../health)
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed (Status: $response)${NC}"
fi
echo ""

# Test 2: Register Provider
echo "2. Registering Provider..."
PROVIDER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testprovider@example.com",
    "password": "test123456",
    "full_name": "Test Provider",
    "user_type": "provider"
  }')

PROVIDER_TOKEN=$(echo $PROVIDER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$PROVIDER_TOKEN" ]; then
    echo -e "${RED}❌ Provider registration failed${NC}"
    echo "Response: $PROVIDER_RESPONSE"
else
    echo -e "${GREEN}✅ Provider registered successfully${NC}"
    echo "Token: ${PROVIDER_TOKEN:0:20}..."
fi
echo ""

# Test 3: Register Customer
echo "3. Registering Customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testcustomer@example.com",
    "password": "test123456",
    "full_name": "Test Customer",
    "user_type": "customer"
  }')

CUSTOMER_TOKEN=$(echo $CUSTOMER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$CUSTOMER_TOKEN" ]; then
    echo -e "${RED}❌ Customer registration failed${NC}"
    echo "Response: $CUSTOMER_RESPONSE"
else
    echo -e "${GREEN}✅ Customer registered successfully${NC}"
    echo "Token: ${CUSTOMER_TOKEN:0:20}..."
fi
echo ""

# Test 4: Create Provider Profile
if [ ! -z "$PROVIDER_TOKEN" ]; then
    echo "4. Creating Provider Profile..."
    PROFILE_RESPONSE=$(curl -s -X POST $BASE_URL/providers \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PROVIDER_TOKEN" \
      -d '{
        "business_name": "Test Business",
        "description": "A test business for API testing",
        "phone": "555-0100",
        "address": "123 Test Street"
      }')
    
    if echo "$PROFILE_RESPONSE" | grep -q "Provider created successfully"; then
        echo -e "${GREEN}✅ Provider profile created${NC}"
    else
        echo -e "${YELLOW}⚠️  Provider profile may already exist or error occurred${NC}"
    fi
    echo ""
fi

# Test 5: Browse Services (Public)
echo "5. Testing Browse Services (Public)..."
BROWSE_RESPONSE=$(curl -s $BASE_URL/services/browse)
if echo "$BROWSE_RESPONSE" | grep -q "services"; then
    echo -e "${GREEN}✅ Browse services endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️  No services found (this is OK if none created yet)${NC}"
fi
echo ""

echo "======================================"
echo -e "${GREEN}✅ Basic API tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Create services as provider"
echo "2. Add business info"
echo "3. Test bookings"
echo "4. Test AI chat"
echo ""
echo "See TESTING_GUIDE.md for detailed testing instructions"






