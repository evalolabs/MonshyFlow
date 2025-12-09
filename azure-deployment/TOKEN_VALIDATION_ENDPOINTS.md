# Token-Validierungs-Endpoints für MonshyBot

## ✅ Implementierte Endpoints

### 1. GET /api/auth/me (Priorität: Hoch)

**Zweck:** User-Informationen für den aktuellen authentifizierten User abrufen (Standard OAuth2/OIDC Endpoint)

**Request:**
```http
GET /api/auth/me
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "id": "6932dcc9a704473ec3d6cbab",
  "email": "user@example.com",
  "tenantId": "tenant-123",
  "roles": ["admin", "user"],
  "name": "User Name"
}
```

**Response (401 Unauthorized - Token ungültig/abgelaufen):**
```json
{
  "error": "Invalid or expired token"
}
```

**Features:**
- ✅ JWT-Token aus `Authorization: Bearer {token}` Header extrahiert
- ✅ Token-Validierung: Signatur, Expiration, Issuer geprüft
- ✅ User-Info aus Token-Claims extrahiert
- ✅ Optional: User aus Datenbank abgerufen für vollständige Informationen (FirstName, LastName)
- ✅ `tenantId` im Response enthalten (für Multi-Tenancy)
- ✅ `name` Feld: Kombination aus FirstName + LastName, oder Email als Fallback

---

### 2. GET /api/auth/validate (Priorität: Mittel - optional)

**Zweck:** Explizite Token-Validierung für externe Systeme (MonshyBot Fallback)

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
    "id": "6932dcc9a704473ec3d6cbab",
    "email": "user@example.com",
    "tenantId": "tenant-123",
    "roles": ["admin", "user"]
  },
  "expiresAt": "2024-12-05T18:00:00Z"
}
```

**Response (401 Unauthorized - Token ungültig/abgelaufen):**
```json
{
  "valid": false,
  "error": "Token expired"
}
```

**Features:**
- ✅ JWT-Token aus `Authorization: Bearer {token}` Header extrahiert
- ✅ Token-Validierung: Signatur, Expiration, Issuer geprüft
- ✅ User-Info aus Token-Claims extrahiert
- ✅ `expiresAt` Feld mit Token-Expiration-Zeit
- ✅ `tenantId` im Response enthalten (für Multi-Tenancy)

---

## 🔧 Implementierungsdetails

### Code-Änderungen

1. **JwtService erweitert:**
   - `ValidateTokenAsync(string token)` - Validiert Token und gibt ClaimsPrincipal zurück
   - `ExtractUserInfoFromClaims(ClaimsPrincipal)` - Extrahiert User-Info aus Claims

2. **AuthController erweitert:**
   - `GET /api/auth/me` - Mit `[Authorize]` Attribut (nutzt ASP.NET Core JWT Middleware)
   - `GET /api/auth/validate` - Manuelle Token-Validierung (für externe Systeme)

3. **Gateway-Konfiguration:**
   - Bereits konfiguriert: `/api/auth/{everything}` routet zu AuthService
   - Neue Endpoints werden automatisch weitergeleitet

---

## 🧪 Testing

### Test mit curl:

```bash
# 1. Login und Token erhalten
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  | jq -r '.token')

# 2. /api/auth/me testen
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. /api/auth/validate testen
curl -X GET http://localhost:5000/api/auth/validate \
  -H "Authorization: Bearer $TOKEN"
```

### Test mit Postman/Insomnia:

1. **Login:**
   - POST `http://localhost:5000/api/auth/login`
   - Body: `{"email":"admin@test.com","password":"admin123"}`
   - Kopiere `token` aus Response

2. **GET /api/auth/me:**
   - GET `http://localhost:5000/api/auth/me`
   - Header: `Authorization: Bearer {token}`

3. **GET /api/auth/validate:**
   - GET `http://localhost:5000/api/auth/validate`
   - Header: `Authorization: Bearer {token}`

---

## 🔐 Sicherheit

### Token-Validierung

Beide Endpoints validieren:
- ✅ **Signatur** - Token wurde mit korrektem Secret signiert
- ✅ **Expiration** - Token ist nicht abgelaufen
- ✅ **Issuer** - Token wurde von korrektem Issuer erstellt
- ✅ **Audience** - Token ist für korrekte Audience bestimmt
- ✅ **User Status** - User existiert und ist aktiv

### Fehlerbehandlung

- **401 Unauthorized:** Token ungültig, abgelaufen, oder User nicht gefunden
- **500 Internal Server Error:** Unerwarteter Server-Fehler

---

## 📋 Response-Felder

### GET /api/auth/me

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | User ID |
| `email` | string | User E-Mail |
| `tenantId` | string | Tenant ID (für Multi-Tenancy) |
| `roles` | string[] | User Rollen |
| `name` | string | User Name (FirstName + LastName, oder Email) |

### GET /api/auth/validate

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `valid` | boolean | Token ist gültig |
| `user` | object | User-Informationen (siehe oben) |
| `expiresAt` | datetime? | Token Expiration-Zeit |
| `error` | string? | Fehlermeldung (nur wenn valid=false) |

---

## 🚀 Gateway-Routing

Die Endpoints sind über das Gateway erreichbar:

- `http://localhost:5000/api/auth/me` → AuthService
- `http://localhost:5000/api/auth/validate` → AuthService

**Azure:** Nach Deployment über Container App URL:
- `https://your-gateway.azurecontainerapps.io/api/auth/me`
- `https://your-gateway.azurecontainerapps.io/api/auth/validate`

---

## ✅ Erfüllte Anforderungen

- ✅ GET /api/auth/me implementiert
- ✅ GET /api/auth/validate implementiert
- ✅ JWT-Token aus Authorization Header extrahiert
- ✅ Token-Validierung (Signatur, Expiration, Issuer)
- ✅ User-Info aus Token-Claims oder Datenbank
- ✅ tenantId im Response enthalten
- ✅ Standard OAuth2/OIDC Format für /api/auth/me
- ✅ Fehlerbehandlung (401 für ungültige Tokens)

---

## 📚 Weitere Informationen

- [JWT Service Implementation](../AgentBuilder.AuthService/Services/JwtService.cs)
- [Auth Controller](../AgentBuilder.AuthService/Controllers/AuthController.cs)
- [Gateway Configuration](../AgentBuilder.Gateway/ocelot.json)

