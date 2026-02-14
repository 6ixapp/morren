#!/bin/bash

# Test script for new seller public profile endpoints
# Usage: bash TEST_NEW_ENDPOINTS.sh

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Testing New Seller Public Profile Endpoints${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Configuration
BASE_URL="${1:-http://localhost:5000}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo ""

# You need to replace these with actual values from your database
SELLER_ID="REPLACE_WITH_ACTUAL_SELLER_UUID"
ORDER_ID="REPLACE_WITH_ACTUAL_ORDER_UUID"
ACCESS_TOKEN="REPLACE_WITH_YOUR_ACCESS_TOKEN"

echo -e "${BLUE}Step 1: Testing Health Check${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "$body" | jq .
else
    echo -e "${RED}❌ Health check failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

echo -e "${BLUE}Step 2: Testing GET /api/sellers/:sellerId/public-profile${NC}"
echo "Endpoint: $BASE_URL/api/sellers/$SELLER_ID/public-profile"

if [ "$ACCESS_TOKEN" == "REPLACE_WITH_YOUR_ACCESS_TOKEN" ]; then
    echo -e "${RED}⚠️  Please update ACCESS_TOKEN in this script${NC}"
    echo "To get a token:"
    echo "1. Login via POST $BASE_URL/auth/login"
    echo "2. Copy the accessToken from response"
    echo "3. Update ACCESS_TOKEN variable in this script"
else
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$BASE_URL/api/sellers/$SELLER_ID/public-profile")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}✅ Seller public profile endpoint works${NC}"
        echo "$body" | jq .
    else
        echo -e "${RED}❌ Request failed (HTTP $http_code)${NC}"
        echo "$body"
    fi
fi
echo ""

echo -e "${BLUE}Step 3: Testing GET /api/orders/:orderId/bidders${NC}"
echo "Endpoint: $BASE_URL/api/orders/$ORDER_ID/bidders"

if [ "$ACCESS_TOKEN" == "REPLACE_WITH_YOUR_ACCESS_TOKEN" ]; then
    echo -e "${RED}⚠️  Please update ACCESS_TOKEN in this script${NC}"
else
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$BASE_URL/api/orders/$ORDER_ID/bidders")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}✅ Order bidders endpoint works${NC}"
        echo "$body" | jq .
    elif [ "$http_code" == "403" ]; then
        echo -e "${RED}❌ Access denied - You must be the order owner${NC}"
        echo "$body"
    else
        echo -e "${RED}❌ Request failed (HTTP $http_code)${NC}"
        echo "$body"
    fi
fi
echo ""

echo -e "${BLUE}Step 4: Testing anonymizedSellerId in bids${NC}"
echo "Endpoint: $BASE_URL/api/bids/order/$ORDER_ID"

if [ "$ACCESS_TOKEN" == "REPLACE_WITH_YOUR_ACCESS_TOKEN" ]; then
    echo -e "${RED}⚠️  Please update ACCESS_TOKEN in this script${NC}"
else
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$BASE_URL/api/bids/order/$ORDER_ID")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" == "200" ]; then
        # Check if response includes anonymizedSellerId
        has_field=$(echo "$body" | jq '.[0].anonymizedSellerId' 2>/dev/null)

        if [ "$has_field" != "null" ] && [ -n "$has_field" ]; then
            echo -e "${GREEN}✅ Bids include anonymizedSellerId field${NC}"
            echo "$body" | jq '.[] | {id, anonymizedSellerId, bidAmount, status}' | head -20
        else
            echo -e "${RED}❌ anonymizedSellerId field not found in response${NC}"
            echo "$body" | jq . | head -20
        fi
    else
        echo -e "${RED}❌ Request failed (HTTP $http_code)${NC}"
        echo "$body"
    fi
fi
echo ""

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "To test with real data:"
echo "1. Login and get an access token"
echo "2. Get a seller ID from database"
echo "3. Get an order ID from database"
echo "4. Update this script with real values"
echo "5. Run: bash TEST_NEW_ENDPOINTS.sh"
echo ""
echo "Or test manually with curl:"
echo ""
echo "curl -X GET '$BASE_URL/api/sellers/YOUR_SELLER_ID/public-profile' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""
