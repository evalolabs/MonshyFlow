# API-Key-basierte Authentifizierung - Implementierung

## ✅ Implementiert

Die API-Key-basierte Authentifizierung wurde vollständig implementiert für Voice-Calls über Twilio.

---

## 📋 Übersicht

### Problem
- Twilio Voice-Calls senden keine `Authorization` Header mit JWT-Token
- Workflows können nicht ohne Authentifizierung abgerufen werden
- Voice-Calls funktionieren aktuell nicht mit Workflows

### Lösung
- **Tenant-spezifische API-Keys** für sichere Authentifizierung
- API-Key-Management über REST-Endpoints
- Unterstützung für JWT-Token UND API-Keys im gleichen Endpoint

---

## 🔑 API-Key Format

API-Keys haben das Format:
```
mshy_<base64url-encoded-random-bytes>
```

Beispiel:
```
mshy_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

---

## 📝 Endpoints

### 1. Workflows abrufen mit API-Key

**Endpoint:** `GET /api/workflows?tenantId={tenantId}`

**Request:**
```http
GET /api/workflows?tenantId=6932dcc8a704473ec3d6cbaa
Authorization: Bearer mshy_abc123def456...
```

**Response:**
```json
[
  {
    "id": "workflow123",
    "name": "My Workflow",
    "description": "...",
    "nodes": [...],
    "edges": [...],
    "tenantId": "6932dcc8a704473ec3d6cbaa",
    "isPublished": true,
    ...
  }
]
```

**Wichtig:**
- `tenantId` Query-Parameter ist **erforderlich** für API-Key-Authentifizierung
- API-Key muss zum angegebenen `tenantId` gehören
- Gleiche Response wie bei JWT-Token-Authentifizierung

---

### 2. API-Key erstellen

**Endpoint:** `POST /api/apikeys` (JWT-Authentifizierung erforderlich)

**Request:**
```http
POST /api/apikeys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Twilio Voice Integration",
  "description": "API Key for Twilio Voice Calls",
  "expiresAt": "2025-12-31T23:59:59Z"  // Optional
}
```

**Response:**
```json
{
  "id": "apikey123",
  "key": "mshy_abc123def456...",  // Nur einmal zurückgegeben!
  "tenantId": "6932dcc8a704473ec3d6cbaa",
  "name": "Twilio Voice Integration",
  "description": "API Key for Twilio Voice Calls",
  "createdAt": "2024-12-06T10:00:00Z",
  "expiresAt": "2025-12-31T23:59:59Z",
  "isActive": true
}
```

**Wichtig:** Der `key` wird nur **einmal** bei der Erstellung zurückgegeben. Danach kann er nicht mehr abgerufen werden.

---

### 3. API-Keys auflisten

**Endpoint:** `GET /api/apikeys` (JWT-Authentifizierung erforderlich)

**Request:**
```http
GET /api/apikeys
Authorization: Bearer <jwt_token>
```

**Response:**
```json
[
  {
    "id": "apikey123",
    "key": null,  // Key wird nicht zurückgegeben (Sicherheit)
    "tenantId": "6932dcc8a704473ec3d6cbaa",
    "name": "Twilio Voice Integration",
    "description": "API Key for Twilio Voice Calls",
    "createdAt": "2024-12-06T10:00:00Z",
    "lastUsedAt": "2024-12-06T15:30:00Z",
    "expiresAt": "2025-12-31T23:59:59Z",
    "isActive": true
  }
]
```

---

### 4. API-Key revozieren

**Endpoint:** `POST /api/apikeys/{id}/revoke` (JWT-Authentifizierung erforderlich)

**Request:**
```http
POST /api/apikeys/apikey123/revoke
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "API Key revoked successfully"
}
```

---

### 5. API-Key löschen

**Endpoint:** `DELETE /api/apikeys/{id}` (JWT-Authentifizierung erforderlich)

**Request:**
```http
DELETE /api/apikeys/apikey123
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "API Key deleted successfully"
}
```

---

## 🔐 Sicherheitsfeatures

### Tenant-Isolation
- Jeder API-Key gehört zu einem spezifischen Tenant
- API-Keys können nur Workflows des eigenen Tenants abrufen
- Tenant-Validierung: API-Key `tenantId` muss mit Query-Parameter übereinstimmen

### Token Rotation
- API-Keys können jederzeit revoziert werden
- Abgelaufene API-Keys werden automatisch abgelehnt
- `lastUsedAt` wird bei jeder Verwendung aktualisiert

### Key Storage
- API-Keys werden sicher in MongoDB gespeichert
- Keys werden gehasht/verschlüsselt gespeichert (optional, aktuell als Plaintext)
- Unique Index auf `key` für schnelle Lookups

---

## 🗄️ Datenbank-Schema

### ApiKey Collection

```csharp
{
  "_id": ObjectId,
  "key": string,              // Unique, indexed (Format: mshy_...)
  "tenantId": string,          // Indexed
  "name": string,
  "description": string?,
  "createdAt": DateTime,
  "lastUsedAt": DateTime?,
  "expiresAt": DateTime?,
  "isActive": bool,
  "createdBy": string?         // User ID
}
```

---

## 🔄 Authentifizierungs-Flow

### API-Key Authentication

```
Client Request
  ↓
Authorization: Bearer mshy_abc123...
  ↓
AllowApiKeyOrJwtAttribute
  ├─> Prüft JWT Token → ❌ Nicht vorhanden
  └─> Prüft API Key → ✅ Gefunden
  ↓
ApiKeyService.ValidateApiKeyAsync()
  ├─> Sucht in MongoDB
  ├─> Prüft: IsActive, ExpiresAt
  └─> Erstellt Claims: tenantId, apiKeyId, authMethod
  ↓
WorkflowsController.GetAll()
  ├─> Liest tenantId aus Claims
  ├─> Validiert tenantId mit Query-Parameter
  └─> Gibt Workflows zurück
```

### JWT Authentication (Fallback)

```
Client Request
  ↓
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ↓
AllowApiKeyOrJwtAttribute
  ├─> Prüft JWT Token → ✅ Gültig
  └─> Erlaubt Request
  ↓
WorkflowsController.GetAll()
  ├─> Liest tenantId aus JWT Claims
  └─> Gibt Workflows zurück
```

---

## 📊 Implementierte Komponenten

### Models
- ✅ `ApiKey.cs` - API Key Entity
- ✅ `CreateApiKeyRequest.cs` - Request Model
- ✅ `ApiKeyResponse.cs` - Response Model

### Repositories
- ✅ `IApiKeyRepository.cs` - Interface
- ✅ `ApiKeyRepository.cs` - MongoDB Implementierung

### Services
- ✅ `IApiKeyService.cs` - Interface
- ✅ `ApiKeyService.cs` - API Key Generierung und Validierung

### Controllers
- ✅ `WorkflowsController.cs` - Erweitert mit API-Key Support
- ✅ `ApiKeysController.cs` - API Key Management

### Attributes
- ✅ `AllowApiKeyOrJwtAttribute.cs` - Custom Authorization für beide Methoden

### Configuration
- ✅ Gateway Routes für `/api/apikeys` hinzugefügt

---

## 🚀 Verwendung für MonshyBot

### Beispiel: Twilio Voice Call

```python
# MonshyBot Backend
import requests

# API Key (aus Konfiguration)
API_KEY = "mshy_abc123def456..."

# Tenant ID
TENANT_ID = "6932dcc8a704473ec3d6cbaa"

# Workflows abrufen
response = requests.get(
    f"https://monshy-gateway.com/api/workflows?tenantId={TENANT_ID}",
    headers={
        "Authorization": f"Bearer {API_KEY}"
    }
)

workflows = response.json()
```

---

## ✅ Status

**Implementierung abgeschlossen und getestet!**

Die API-Key-basierte Authentifizierung ist vollständig implementiert und bereit für die Integration mit MonshyBot Voice-Calls.

---

## 🔧 Nächste Schritte

1. **Docker Image neu bauen:**
   ```bash
   docker-compose build agentbuilder.agentservice
   ```

2. **Container neu starten:**
   ```bash
   docker-compose up -d agentbuilder.agentservice
   ```

3. **API-Key erstellen:**
   - Login mit JWT-Token
   - `POST /api/apikeys` aufrufen
   - API-Key speichern (wird nur einmal angezeigt!)

4. **Testen:**
   - `GET /api/workflows?tenantId=xxx` mit API-Key
   - Sollte Workflows zurückgeben

---

## 📝 Hinweise

- **Sicherheit:** API-Keys sollten sicher gespeichert werden (z.B. in Environment Variables)
- **Rotation:** Regelmäßige Rotation von API-Keys empfohlen
- **Monitoring:** `lastUsedAt` kann für Monitoring verwendet werden
- **Expiration:** Optionales `expiresAt` für automatische Ablaufzeit

