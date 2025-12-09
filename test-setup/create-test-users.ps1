# Test-Script zum Anlegen von Tenants und Users fuer Monshy
# Verwendung: .\create-test-users.ps1

$baseUrl = "http://localhost:5000"

Write-Host "=== Monshy Test-User Setup ===" -ForegroundColor Cyan
Write-Host ""

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [string]$Token = $null
    )
    
    $headers = @{}
    $headers["Content-Type"] = "application/json"
    
    if ($Token -ne $null -and $Token -ne "") {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        if ($Body -ne $null) {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $jsonBody
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
        }
        return $response
    } catch {
        Write-Host "Fehler: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        return $null
    }
}

# Schritt 1: Ersten Tenant + Admin-User erstellen
Write-Host "1. Erstelle ersten Tenant und Admin-User..." -ForegroundColor Yellow

$registerData = @{
    email = "admin@test.com"
    password = "admin123"
    firstName = "Admin"
    lastName = "User"
    tenantName = "TestTenant"
}

$registerResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/auth/register" -Body $registerData

if ($registerResponse -ne $null) {
    $adminToken = $registerResponse.token
    $tenantId = $registerResponse.user.tenantId
    Write-Host "[OK] Tenant 'TestTenant' erstellt (ID: $tenantId)" -ForegroundColor Green
    Write-Host "[OK] Admin-User 'admin@test.com' erstellt" -ForegroundColor Green
    Write-Host "[OK] Token erhalten" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[ERROR] Fehler beim Erstellen des Tenants/Users" -ForegroundColor Red
    exit 1
}

# Schritt 2: Weitere Test-User erstellen
Write-Host "2. Erstelle weitere Test-User..." -ForegroundColor Yellow

# User 1
$user1Data = @{
    email = "user1@test.com"
    password = "user123"
    firstName = "Test"
    lastName = "User 1"
    roles = @("user")
}
$user1Response = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/admin/users" -Body $user1Data -Token $adminToken
if ($user1Response -ne $null) {
    Write-Host "[OK] User 'user1@test.com' erstellt" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Fehler beim Erstellen von 'user1@test.com'" -ForegroundColor Red
}

# User 2
$user2Data = @{
    email = "user2@test.com"
    password = "user123"
    firstName = "Test"
    lastName = "User 2"
    roles = @("user")
}
$user2Response = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/admin/users" -Body $user2Data -Token $adminToken
if ($user2Response -ne $null) {
    Write-Host "[OK] User 'user2@test.com' erstellt" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Fehler beim Erstellen von 'user2@test.com'" -ForegroundColor Red
}

# Manager
$managerData = @{
    email = "manager@test.com"
    password = "manager123"
    firstName = "Manager"
    lastName = "User"
    roles = @("admin", "user")
}
$managerResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/api/admin/users" -Body $managerData -Token $adminToken
if ($managerResponse -ne $null) {
    Write-Host "[OK] User 'manager@test.com' erstellt" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Fehler beim Erstellen von 'manager@test.com'" -ForegroundColor Red
}

Write-Host ""

# Schritt 3: Alle User auflisten
Write-Host "3. Liste alle User auf..." -ForegroundColor Yellow

$usersResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/api/admin/users" -Token $adminToken

if ($usersResponse -ne $null) {
    Write-Host "Gefundene User:" -ForegroundColor Cyan
    foreach ($user in $usersResponse) {
        $roles = $user.roles -join ", "
        Write-Host "  - $($user.email) ($roles)" -ForegroundColor White
    }
} else {
    Write-Host "[ERROR] Fehler beim Abrufen der User" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Setup abgeschlossen ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test-Credentials:" -ForegroundColor Yellow
Write-Host "  Admin: admin@test.com / admin123" -ForegroundColor White
Write-Host "  User1: user1@test.com / user123" -ForegroundColor White
Write-Host "  User2: user2@test.com / user123" -ForegroundColor White
Write-Host "  Manager: manager@test.com / manager123" -ForegroundColor White
Write-Host ""
