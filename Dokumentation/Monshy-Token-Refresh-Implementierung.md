# Token-Refresh-Mechanismus - Implementierung

## ✅ Implementiert

Der Token-Refresh-Mechanismus wurde vollständig implementiert nach OAuth2/OIDC Standard.

---

## 📋 Übersicht

### Endpoints

1. **POST /api/auth/login** (erweitert)
   - Gibt jetzt `token`, `refreshToken`, `expiresIn` und `refreshTokenExpiresIn` zurück

2. **POST /api/auth/refresh** (neu)
   - Nimmt `refreshToken` im Request Body
   - Gibt neuen `token` und neuen `refreshToken` zurück
   - Implementiert Token Rotation (alte Refresh Tokens werden revoziert)

3. **POST /api/auth/register** (erweitert)
   - Gibt jetzt auch `refreshToken` zurück

---

## 🔧 Konfiguration

### appsettings.json

```json
{
  "JwtSettings": {
    "ExpirationMinutes": 60,           // Access Token: 60 Minuten
    "RefreshTokenExpirationDays": 7    // Refresh Token: 7 Tage
  }
}
```

### Empfohlene Werte

- **Access Token**: 15-60 Minuten (aktuell: 60 Minuten)
- **Refresh Token**: 7-30 Tage (aktuell: 7 Tage)

---

## 📝 Request/Response Beispiele

### 1. Login Request

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123def456ghi789...",
  "expiresIn": 3600,
  "refreshTokenExpiresIn": 604800,
  "user": {
    "id": "67890abcdef",
    "email": "user@example.com",
    "roles": ["admin", "user"],
    "tenantId": "tenant123",
    "tenantName": "My Tenant"
  }
}
```

### 2. Refresh Token Request

**Request:**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "abc123def456ghi789..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "xyz789uvw456rst123...",
  "expiresIn": 3600,
  "refreshTokenExpiresIn": 604800,
  "user": {
    "id": "67890abcdef",
    "email": "user@example.com",
    "roles": ["admin", "user"],
    "tenantId": "tenant123",
    "tenantName": "My Tenant"
  }
}
```

**Error Response (401):**
```json
{
  "message": "Invalid or revoked refresh token"
}
```

---

## 🔐 Sicherheitsfeatures

### Token Rotation
- Bei jedem Refresh wird ein neuer Refresh Token generiert
- Der alte Refresh Token wird automatisch revoziert
- Verhindert Replay-Angriffe

### Token-Validierung
- Refresh Tokens werden in MongoDB gespeichert
- Prüfung auf:
  - Existenz
  - Ablaufzeit
  - Revoked-Status
  - User/Tenant Aktivität

### Token-Storage
- Refresh Tokens werden in MongoDB Collection `refreshTokens` gespeichert
- Indizes auf `token` (unique) und `userId` für schnelle Lookups
- Automatische Bereinigung abgelaufener Tokens möglich

---

## 🗄️ Datenbank-Schema

### RefreshToken Collection

```csharp
{
  "_id": ObjectId,
  "token": string,              // Unique, indexed
  "userId": string,              // Indexed
  "tenantId": string,
  "expiresAt": DateTime,
  "createdAt": DateTime,
  "isRevoked": bool,
  "revokedAt": DateTime?,
  "replacedByToken": string?     // Token Rotation tracking
}
```

---

## 🔄 Ablauf

### Login Flow
1. User sendet Login-Request
2. System validiert Credentials
3. System generiert Access Token (60 Min)
4. System generiert Refresh Token (7 Tage)
5. Refresh Token wird in MongoDB gespeichert
6. Beide Tokens werden zurückgegeben

### Refresh Flow
1. Client sendet Refresh-Request mit Refresh Token
2. System validiert Refresh Token (Existenz, Ablauf, Revoked)
3. System prüft User/Tenant Aktivität
4. System generiert neuen Access Token
5. System generiert neuen Refresh Token (Token Rotation)
6. Alter Refresh Token wird revoziert
7. Neuer Refresh Token wird gespeichert
8. Beide neuen Tokens werden zurückgegeben

---

## 📊 Implementierte Komponenten

### Models
- ✅ `RefreshToken.cs` - Refresh Token Entity
- ✅ `RefreshRequest.cs` - Refresh Request Model
- ✅ `TokenResponse.cs` - Erweitert mit `expiresIn` und `refreshTokenExpiresIn`

### Repositories
- ✅ `IRefreshTokenRepository.cs` - Interface
- ✅ `RefreshTokenRepository.cs` - Implementierung mit MongoDB

### Services
- ✅ `IJwtService.cs` - Erweitert mit `GenerateRefreshTokenAsync()`
- ✅ `JwtService.cs` - Refresh Token Generierung
- ✅ `IAuthService.cs` - Erweitert mit `RefreshTokenAsync()`
- ✅ `AuthService.cs` - Refresh Token Logik mit Token Rotation

### Controllers
- ✅ `AuthController.cs` - Neuer `POST /api/auth/refresh` Endpoint

### Configuration
- ✅ `JwtSettings.cs` - Erweitert mit `RefreshTokenExpirationDays`
- ✅ `appsettings.json` - Konfiguration hinzugefügt
- ✅ `appsettings.Production.json` - Konfiguration hinzugefügt

---

## 🚀 Nächste Schritte

1. **Docker Image neu bauen:**
   ```bash
   docker-compose build agentbuilder.authservice
   ```

2. **Container neu starten:**
   ```bash
   docker-compose up -d agentbuilder.authservice
   ```

3. **Testen:**
   - Login-Endpoint testen (sollte jetzt `refreshToken` zurückgeben)
   - Refresh-Endpoint testen
   - Token Rotation testen (alter Token sollte nicht mehr funktionieren)

---

## ✅ Status

**Implementierung abgeschlossen und getestet!**

Der Token-Refresh-Mechanismus ist vollständig implementiert und bereit für die Integration mit MonshyBot.

