#!/bin/bash
# Test-Script zum Anlegen von Tenants und Users für Monshy
# Verwendung: ./create-test-users.sh

BASE_URL="http://localhost:5000"  # Gateway URL
AUTH_SERVICE_URL="http://localhost:5244"  # Direkt zum Auth-Service

echo "=== Monshy Test-User Setup ==="
echo ""

# Funktion zum Senden von HTTP-Requests
api_request() {
    local method=$1
    local url=$2
    local body=$3
    local token=$4
    
    local headers=(-H "Content-Type: application/json")
    
    if [ -n "$token" ]; then
        headers+=(-H "Authorization: Bearer $token")
    fi
    
    if [ -n "$body" ]; then
        curl -s -X "$method" "$url" "${headers[@]}" -d "$body"
    else
        curl -s -X "$method" "$url" "${headers[@]}"
    fi
}

# Schritt 1: Ersten Tenant + Admin-User erstellen
echo "1. Erstelle ersten Tenant und Admin-User..."

REGISTER_DATA='{
  "email": "admin@test.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "User",
  "tenantName": "TestTenant"
}'

REGISTER_RESPONSE=$(api_request "POST" "$BASE_URL/api/auth/register" "$REGISTER_DATA")

if [ $? -eq 0 ] && [ -n "$REGISTER_RESPONSE" ]; then
    ADMIN_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    TENANT_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"tenantId":"[^"]*' | cut -d'"' -f4)
    echo "✓ Tenant 'TestTenant' erstellt (ID: $TENANT_ID)"
    echo "✓ Admin-User 'admin@test.com' erstellt"
    echo "✓ Token erhalten"
    echo ""
else
    echo "✗ Fehler beim Erstellen des Tenants/Users"
    exit 1
fi

# Schritt 2: Weitere Test-User erstellen
echo "2. Erstelle weitere Test-User..."

# User 1
USER1_DATA='{
  "email": "user1@test.com",
  "password": "user123",
  "firstName": "Test",
  "lastName": "User 1",
  "roles": ["user"]
}'

USER1_RESPONSE=$(api_request "POST" "$BASE_URL/api/admin/users" "$USER1_DATA" "$ADMIN_TOKEN")
if [ $? -eq 0 ] && [ -n "$USER1_RESPONSE" ]; then
    echo "✓ User 'user1@test.com' erstellt"
else
    echo "✗ Fehler beim Erstellen von 'user1@test.com'"
fi

# User 2
USER2_DATA='{
  "email": "user2@test.com",
  "password": "user123",
  "firstName": "Test",
  "lastName": "User 2",
  "roles": ["user"]
}'

USER2_RESPONSE=$(api_request "POST" "$BASE_URL/api/admin/users" "$USER2_DATA" "$ADMIN_TOKEN")
if [ $? -eq 0 ] && [ -n "$USER2_RESPONSE" ]; then
    echo "✓ User 'user2@test.com' erstellt"
else
    echo "✗ Fehler beim Erstellen von 'user2@test.com'"
fi

# Manager
MANAGER_DATA='{
  "email": "manager@test.com",
  "password": "manager123",
  "firstName": "Manager",
  "lastName": "User",
  "roles": ["admin", "user"]
}'

MANAGER_RESPONSE=$(api_request "POST" "$BASE_URL/api/admin/users" "$MANAGER_DATA" "$ADMIN_TOKEN")
if [ $? -eq 0 ] && [ -n "$MANAGER_RESPONSE" ]; then
    echo "✓ User 'manager@test.com' erstellt"
else
    echo "✗ Fehler beim Erstellen von 'manager@test.com'"
fi

echo ""

# Schritt 3: Alle User auflisten
echo "3. Liste alle User auf..."

USERS_RESPONSE=$(api_request "GET" "$BASE_URL/api/admin/users" "" "$ADMIN_TOKEN")

if [ $? -eq 0 ] && [ -n "$USERS_RESPONSE" ]; then
    echo "Gefundene User:"
    echo "$USERS_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4 | while read email; do
        echo "  - $email"
    done
else
    echo "✗ Fehler beim Abrufen der User"
fi

echo ""
echo "=== Setup abgeschlossen ==="
echo ""
echo "Test-Credentials:"
echo "  Admin: admin@test.com / admin123"
echo "  User1: user1@test.com / user123"
echo "  User2: user2@test.com / user123"
echo "  Manager: manager@test.com / manager123"
echo ""

