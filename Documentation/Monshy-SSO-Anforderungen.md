# SSO-Anforderungen für Monshy-Entwickler (Priority 1)

## Was ist MonshyBot?

**MonshyBot** ist ein Voice- und Chatbot-System, das Kundenanfragen über Telefon und Chat automatisiert beantwortet. Es nutzt:
- **Spracherkennung (STT)** für Telefonanrufe
- **Large Language Models (LLM)** für intelligente Antworten
- **Sprachsynthese (TTS)** für Sprachausgabe
- **Twilio** für Telefonie-Integration
- **Pipecat SDK** für Voice-Bot-Orchestrierung

## Wie nutzt MonshyBot Monshy?

MonshyBot nutzt Monshy für **zwei Hauptzwecke**:

### 1. Workflow-Orchestrierung
Für komplexe Dialog-Logik und Business-Prozesse nutzt MonshyBot **Monshy-Workflows**:
- Bestellstatus-Abfragen (API-Calls zu CRM-Systemen)
- Support-Ticket-Erstellung
- Multi-Step-Prozesse mit Entscheidungsbäumen
- Externe API-Integrationen

**Beispiel:** Ein Kunde fragt "Wo ist meine Bestellung?". MonshyBot erkennt, dass dies ein komplexer Workflow ist, ruft den entsprechenden Monshy-Workflow auf, der dann die CRM-API abfragt und eine personalisierte Antwort zurückgibt.

### 2. Single Sign-On (SSO)
MonshyBot nutzt **Monshy als SSO-Provider** für User-Authentifizierung:
- User melden sich nur einmal in Monshy an (Email/Password)
- Gleiche Credentials funktionieren für beide Systeme
- JWT-Token aus Monshy werden in MonshyBot akzeptiert
- Zentrale User-Verwaltung in Monshy
- Konsistente Tenant-Isolation über beide Systeme

**Vorteil:** Kunden müssen sich nicht zweimal anmelden und haben eine einheitliche User-Experience.

## Überblick

MonshyBot nutzt **Monshy als Single Sign-On (SSO) Provider**. User melden sich nur einmal in Monshy an und können dann sowohl Monshy als auch MonshyBot nutzen. Dafür benötigt MonshyBot zwei zusätzliche API-Endpoints im AuthService.

## Aktueller Stand

✅ **Bereits vorhanden:**
- `POST /api/auth/login` - Login mit Email/Password
- `POST /api/auth/register` - Registrierung
- JWT-Token-Generierung
- JWT-Authentifizierung konfiguriert
- Gateway routet `/api/auth/*` korrekt

❌ **Fehlt für SSO:**
- `GET /api/auth/validate` - Token-Validierung für externe Systeme
- `GET /api/auth/me` - User-Info-Endpoint

## Anforderungen (Priority 1)

### 1. Token-Validierung-Endpoint

**Endpoint:** `GET /api/auth/validate`

**Zweck:** Externe Systeme (wie MonshyBot) können JWT-Tokens validieren, ohne die JWT-Secret-Key zu kennen.

**Request:**
```http
GET /api/auth/validate
Authorization: Bearer {jwt_token}
```

**Response (200 OK - Token gültig):**
```json
{
  "valid": true,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "tenantId": "tenant-123",
    "roles": ["admin", "user"]
  },
  "expiresAt": "2024-01-15T10:30:00Z"
}
```

**Response (401 Unauthorized - Token ungültig/abgelaufen):**
```json
{
  "valid": false,
  "error": "Token expired" // oder "Invalid token", "Token not found"
}
```

**Implementierung:**
- Token aus Authorization Header extrahieren
- JWT validieren (Signatur, Expiration, Issuer, Audience)
- User aus Token-Claims oder Datenbank abrufen
- Tenant-Info abrufen
- Response zurückgeben

**Beispiel-Implementierung (C#):**
```csharp
[HttpGet("validate")]
[AllowAnonymous] // Keine Authentifizierung nötig, da Token selbst validiert wird
public async Task<ActionResult<ValidateTokenResponse>> ValidateToken()
{
    try
    {
        // Token aus Header extrahieren
        var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(new { valid = false, error = "No token provided" });
        }

        // Token validieren (nutzt bereits konfigurierte JWT-Settings)
        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = GetTokenValidationParameters();
        
        SecurityToken validatedToken;
        ClaimsPrincipal claimsPrincipal;
        
        try
        {
            claimsPrincipal = tokenHandler.ValidateToken(token, validationParameters, out validatedToken);
        }
        catch (SecurityTokenExpiredException)
        {
            return Unauthorized(new { valid = false, error = "Token expired" });
        }
        catch (SecurityTokenInvalidSignatureException)
        {
            return Unauthorized(new { valid = false, error = "Invalid token signature" });
        }
        catch (Exception ex)
        {
            return Unauthorized(new { valid = false, error = "Invalid token" });
        }

        // User-Info aus Claims extrahieren
        var userId = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var tenantId = claimsPrincipal.FindFirst("tenantId")?.Value;
        var email = claimsPrincipal.FindFirst(ClaimTypes.Email)?.Value;
        var roles = claimsPrincipal.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        // Expiration aus Token extrahieren
        var jwtToken = validatedToken as JwtSecurityToken;
        var expiresAt = jwtToken?.ValidTo;

        return Ok(new ValidateTokenResponse
        {
            Valid = true,
            User = new UserInfoResponse
            {
                Id = userId ?? string.Empty,
                Email = email ?? string.Empty,
                TenantId = tenantId ?? string.Empty,
                Roles = roles
            },
            ExpiresAt = expiresAt
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error validating token");
        return StatusCode(500, new { valid = false, error = "Internal server error" });
    }
}
```

### 2. User-Info-Endpoint

**Endpoint:** `GET /api/auth/me`

**Zweck:** Authentifizierte User können ihre eigenen User-Info abrufen.

**Request:**
```http
GET /api/auth/me
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["admin", "user"],
  "permissions": ["workflow:read", "workflow:write"],
  "tenantId": "tenant-123",
  "tenantName": "Acme Corp",
  "isActive": true,
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-10T15:30:00Z"
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Implementierung:**
- `[Authorize]` Attribute verwenden (JWT wird automatisch validiert)
- User-ID aus Claims extrahieren
- User aus Datenbank abrufen
- Tenant-Info abrufen
- Permissions aus Roles berechnen
- Response zurückgeben

**Beispiel-Implementierung (C#):**
```csharp
[HttpGet("me")]
[Authorize] // JWT wird automatisch validiert
public async Task<ActionResult<UserResponse>> GetCurrentUser()
{
    try
    {
        // User-ID aus Claims extrahieren
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        // User aus Datenbank abrufen
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (!user.IsActive)
        {
            return Forbid("User is inactive");
        }

        // Tenant-Info abrufen
        var tenant = await _tenantRepository.GetByIdAsync(user.TenantId);
        
        // Permissions aus Roles berechnen
        var permissions = await _jwtService.GetUserPermissionsAsync(user.Roles);

        return Ok(new UserResponse
        {
            Id = user.Id ?? string.Empty,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = user.Roles,
            Permissions = permissions,
            TenantId = user.TenantId,
            TenantName = tenant?.Name,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting current user");
        return StatusCode(500, new { message = "Internal server error" });
    }
}
```

## Response-Models

### ValidateTokenResponse
```csharp
public class ValidateTokenResponse
{
    public bool Valid { get; set; }
    public UserInfoResponse? User { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? Error { get; set; }
}

public class UserInfoResponse
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
}
```

## Gateway-Konfiguration

**Bereits vorhanden:** ✅
Das Gateway routet bereits `/api/auth/{everything}` korrekt. Die neuen Endpoints werden automatisch über das Gateway erreichbar sein.

**Keine Gateway-Änderungen nötig!**

## Testing

**Test-Cases für `/api/auth/validate`:**
1. ✅ Gültiger Token → 200 OK mit User-Info
2. ✅ Abgelaufener Token → 401 Unauthorized
3. ✅ Ungültiger Token → 401 Unauthorized
4. ✅ Fehlender Token → 401 Unauthorized
5. ✅ Token mit ungültiger Signatur → 401 Unauthorized

**Test-Cases für `/api/auth/me`:**
1. ✅ Gültiger Token → 200 OK mit User-Info
2. ✅ Abgelaufener Token → 401 Unauthorized
3. ✅ Fehlender Token → 401 Unauthorized
4. ✅ Inaktiver User → 403 Forbid
5. ✅ User nicht gefunden → 404 Not Found

## Integration in MonshyBot

**MonshyBot nutzt diese Endpoints wie folgt:**

```python
# Token-Validierung
async def validate_token(token: str) -> dict:
    response = await httpx.get(
        f"{MONSHY_GATEWAY_URL}/api/auth/validate",
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

# User-Info abrufen
async def get_user_info(token: str) -> dict:
    response = await httpx.get(
        f"{MONSHY_GATEWAY_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()
```

## Priorität

**Priority 1 (Hoch):** Diese Endpoints sind **kritisch** für die SSO-Integration. MonshyBot kann ohne diese Endpoints nicht als SSO-Provider fungieren.

## Zeitrahmen

**Gewünscht:** So schnell wie möglich, da SSO eine Kernfunktionalität für MonshyBot ist.

## Fragen?

Bei Fragen oder Unklarheiten bitte melden. Die Endpoints sollten möglichst standard-konform sein (ähnlich wie OAuth2/OIDC `userinfo` Endpoint).

