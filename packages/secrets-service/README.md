# 🔐 Secrets Service

Der **Secrets Service** verwaltet verschlüsselte Secrets für Workflows und Anwendungen. Er bietet sichere Speicherung, Verschlüsselung und Entschlüsselung von sensiblen Daten wie API-Keys, Passwörtern und Credentials.

---

## 📋 Inhaltsverzeichnis

- [Übersicht](#-übersicht)
- [Features](#-features)
- [Security](#-security)
- [Environment Variables](#-environment-variables)
- [Setup & Installation](#-setup--installation)
- [API-Endpoints](#-api-endpoints)
- [Authentication](#-authentication)
- [Request/Response-Beispiele](#-requestresponse-beispiele)
- [Encryption Details](#-encryption-details)
- [Health Checks](#-health-checks)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Übersicht

Der Secrets Service ist ein **Express.js-basierter HTTP-Service**, der auf Port **5003** läuft (konfigurierbar). Er bietet:

- **Verschlüsselte Speicherung:** AES-256-GCM Verschlüsselung für alle Secrets
- **Tenant-Isolation:** Secrets sind pro Tenant isoliert
- **Service-to-Service API:** Andere Services können Secrets abrufen
- **Secret Management:** CRUD-Operationen für Secrets
- **Type Support:** Verschiedene Secret-Typen (API Key, Password, Token, etc.)

---

## ✨ Features

### Secret Management
- ✅ Secret CRUD (Create, Read, Update, Delete)
- ✅ Verschlüsselte Speicherung (AES-256-GCM)
- ✅ Secret Decryption on-demand
- ✅ Secret Types (API Key, Password, Token, etc.)
- ✅ Provider Support (OpenAI, Azure, etc.)
- ✅ Active/Inactive Status

### Security
- ✅ AES-256-GCM Verschlüsselung
- ✅ Salt-basierte Key Derivation
- ✅ Tenant-Isolation
- ✅ JWT Authentication für Public Endpoints
- ✅ Service Key Authentication für Internal Endpoints
- ✅ Rate Limiting
- ✅ Security Headers (Helmet)

### Service Integration
- ✅ Internal API für andere Services
- ✅ Bulk Secret Retrieval per Tenant
- ✅ Secret Lookup by Name
- ✅ Automatic Decryption für Services

---

## 🔒 Security

### Verschlüsselung

Der Service verwendet **AES-256-GCM** (Galois/Counter Mode) für Verschlüsselung:

- **Algorithm:** AES-256-GCM
- **Key Length:** 256 bits (32 bytes)
- **IV Length:** 128 bits (16 bytes)
- **Salt Length:** 256 bits (32 bytes)
- **Auth Tag:** 128 bits (16 bytes)

### Key Management

Der Encryption Key wird aus Environment Variables geladen:

1. `SECRETS_ENCRYPTION_KEY` (bevorzugt)
2. `ENCRYPTION_KEY` (Fallback)
3. Default Key (nur Development, **NICHT für Production!**)

**⚠️ WICHTIG:** In Production sollte der Key aus einem sicheren Key Management System kommen (z.B. Azure Key Vault).

### Salt-basierte Key Derivation

Jedes Secret verwendet einen eigenen Salt:
- Salt wird zufällig generiert bei Verschlüsselung
- Key wird aus Master Key + Salt abgeleitet
- Verhindert Rainbow Table Attacks

### Tenant-Isolation

- Secrets sind pro Tenant isoliert
- User können nur Secrets ihres eigenen Tenants sehen
- Superadmin kann alle Secrets sehen (für Support)

---

## 🔧 Environment Variables

### Erforderliche Variablen

```bash
# Port (Standard: 5003)
PORT=5003

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/monshyflow

# Encryption Key (MINDESTENS 32 Zeichen!)
SECRETS_ENCRYPTION_KEY=your-very-long-and-secure-encryption-key-min-32-chars
# oder
ENCRYPTION_KEY=your-very-long-and-secure-encryption-key-min-32-chars

# Frontend URL (für CORS)
FRONTEND_URL=http://localhost:5173

# Auth Service URL (für Token-Validierung)
AUTH_SERVICE_URL=http://localhost:5002

# Internal Service Key (für Service-to-Service Kommunikation)
INTERNAL_SERVICE_KEY=your-secret-service-key-change-in-production

# Node Environment
NODE_ENV=development  # oder production
```

### Optionale Variablen

```bash
# Azure Container Apps
AZURE_CONTAINER_APPS_ENVIRONMENT=your-environment-name

# Logging
LOG_LEVEL=info  # debug, info, warn, error
```

### ⚠️ Security Best Practices

1. **Encryption Key:**
   - Mindestens 32 Zeichen lang
   - Zufällig generiert (z.B. `openssl rand -hex 32`)
   - Nie im Code committen
   - In Production: Azure Key Vault oder ähnliches verwenden

2. **Internal Service Key:**
   - Starker, zufälliger Wert
   - Nur für Service-to-Service Kommunikation
   - Nie im Code committen

---

## 🚀 Setup & Installation

### Voraussetzungen

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- MongoDB (lokal oder Remote)

### Installation

```bash
# Im Root-Verzeichnis
pnpm install

# Packages bauen
pnpm build:packages
```

### Development starten

```bash
# Im secrets-service Verzeichnis
cd packages/secrets-service
pnpm dev

# Oder vom Root
pnpm --filter @monshy/secrets-service dev
```

### Production Build

```bash
cd packages/secrets-service
pnpm build
pnpm start
```

---

## 📡 API-Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "secrets-service",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### Public Endpoints (JWT Authentication)

#### Secrets abrufen

```http
GET /api/secrets
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "openai-api-key",
      "description": "OpenAI API Key",
      "secretType": "api-key",
      "provider": "openai",
      "isActive": true,
      "tenantId": "507f191e810c19729de860ea",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Hinweis:** Secrets werden **verschlüsselt** zurückgegeben. Verwende `/api/secrets/:id/decrypt` für entschlüsselte Werte.

---

#### Secret abrufen (verschlüsselt)

```http
GET /api/secrets/:id
Authorization: Bearer {token}
```

---

#### Secret entschlüsseln

```http
GET /api/secrets/:id/decrypt
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "openai-api-key",
    "value": "sk-...",  // ← Entschlüsselt!
    "secretType": "api-key",
    "provider": "openai"
  }
}
```

**⚠️ Sicherheitshinweis:** Entschlüsselte Secrets sollten nur bei Bedarf abgerufen werden und nicht geloggt werden.

---

#### Secret erstellen

```http
POST /api/secrets
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "openai-api-key",
  "description": "OpenAI API Key for GPT models",
  "value": "sk-proj-...",
  "secretType": "api-key",
  "provider": "openai",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "openai-api-key",
    "description": "OpenAI API Key for GPT models",
    "secretType": "api-key",
    "provider": "openai",
    "isActive": true,
    "tenantId": "507f191e810c19729de860ea",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Validierung:**
- `name`: Erforderlich, eindeutig pro Tenant
- `value`: Erforderlich, wird verschlüsselt gespeichert
- `secretType`: Optional (z.B. "api-key", "password", "token")
- `provider`: Optional (z.B. "openai", "azure", "aws")

---

#### Secret aktualisieren

```http
PUT /api/secrets/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "openai-api-key-v2",
  "value": "sk-new-key...",
  "isActive": false
}
```

**Hinweis:** Wenn `value` aktualisiert wird, wird es neu verschlüsselt.

---

#### Secret löschen

```http
DELETE /api/secrets/:id
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Secret deleted successfully"
}
```

---

### Internal Endpoints (Service-to-Service)

#### Secrets per Tenant abrufen (entschlüsselt)

```http
GET /api/internal/secrets/tenant/:tenantId
X-Service-Key: {INTERNAL_SERVICE_KEY}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "openai-api-key",
      "value": "sk-proj-...",  // ← Entschlüsselt!
      "secretType": "api-key",
      "provider": "openai"
    },
    {
      "name": "azure-key",
      "value": "azure-key-value",
      "secretType": "api-key",
      "provider": "azure"
    }
  ]
}
```

**Verwendung:** Wird von `execution-service` und anderen Services verwendet, um Secrets für Workflow-Execution zu laden.

---

#### Secret per Name abrufen (entschlüsselt)

```http
GET /api/internal/secrets/tenant/:tenantId/name/:name
X-Service-Key: {INTERNAL_SERVICE_KEY}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "openai-api-key",
    "value": "sk-proj-...",
    "secretType": "api-key",
    "provider": "openai"
  }
}
```

---

## 🔐 Authentication

### JWT Authentication (Public Endpoints)

```http
Authorization: Bearer {jwt-token}
```

Der Token wird vom `auth-service` ausgestellt und enthält:
- `userId`
- `tenantId`
- `role`

**Berechtigungen:**
- **User:** Kann nur Secrets des eigenen Tenants sehen
- **Superadmin:** Kann alle Secrets sehen (für Support)

### Service-to-Service Authentication (Internal Endpoints)

```http
X-Service-Key: {INTERNAL_SERVICE_KEY}
```

**Verwendung:** Für Service-to-Service Kommunikation (z.B. `execution-service` → `secrets-service`).

---

## 📝 Request/Response-Beispiele

### Secret erstellen

**Request:**
```http
POST /api/secrets
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "openai-api-key",
  "description": "OpenAI API Key",
  "value": "sk-proj-abc123...",
  "secretType": "api-key",
  "provider": "openai",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "openai-api-key",
    "description": "OpenAI API Key",
    "secretType": "api-key",
    "provider": "openai",
    "isActive": true,
    "tenantId": "507f191e810c19729de860ea",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Secret entschlüsseln

**Request:**
```http
GET /api/secrets/507f1f77bcf86cd799439011/decrypt
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "openai-api-key",
    "value": "sk-proj-abc123...",
    "secretType": "api-key",
    "provider": "openai"
  }
}
```

### Internal: Secrets per Tenant

**Request:**
```http
GET /api/internal/secrets/tenant/507f191e810c19729de860ea
X-Service-Key: internal-service-key
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "openai-api-key",
      "value": "sk-proj-abc123...",
      "secretType": "api-key",
      "provider": "openai"
    },
    {
      "name": "azure-key",
      "value": "azure-key-value",
      "secretType": "api-key",
      "provider": "azure"
    }
  ]
}
```

### Error Response

```json
{
  "success": false,
  "error": "Secret with name 'openai-api-key' already exists for this tenant",
  "requestId": "req-1234567890"
}
```

---

## 🔐 Encryption Details

### Verschlüsselungsprozess

1. **Salt Generation:** Zufälliger 32-byte Salt wird generiert
2. **Key Derivation:** Key wird aus Master Key + Salt abgeleitet (scrypt)
3. **IV Generation:** Zufälliger 16-byte IV wird generiert
4. **Encryption:** Wert wird mit AES-256-GCM verschlüsselt
5. **Storage:** `encryptedValue` (IV:tag:data) und `salt` werden gespeichert

### Entschlüsselungsprozess

1. **Key Derivation:** Key wird aus Master Key + gespeichertem Salt abgeleitet
2. **Parsing:** `encryptedValue` wird in IV, Tag und verschlüsselte Daten aufgeteilt
3. **Decryption:** Wert wird mit AES-256-GCM entschlüsselt
4. **Validation:** Auth Tag wird validiert (verhindert Manipulation)

### Format

**Encrypted Value Format:**
```
{IV}:{AuthTag}:{EncryptedData}
```

Beispiel:
```
a1b2c3d4e5f6...:f1e2d3c4b5a6...:9f8e7d6c5b4a...
```

---

## 🏥 Health Checks

### Health Endpoint

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "secrets-service",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Status Codes:**
- `200` - Service ist gesund
- `500` - Service hat Probleme

---

## 🛠️ Development

### Logging

Der Service nutzt **Pino** für strukturiertes Logging:

```typescript
import { logger } from '@monshy/core';

logger.info({ tenantId: '123', secretId: '456' }, 'Secret created');
logger.error({ err: error }, 'Failed to encrypt secret');
```

**⚠️ Wichtig:** Entschlüsselte Secrets werden **NIE** geloggt!

### Testing

```bash
# Tests ausführen
pnpm test

# Tests mit Coverage
pnpm test --coverage
```

### Code Structure

```
secrets-service/
├── src/
│   ├── controllers/      # Request Handler
│   │   ├── SecretsController.ts        # Public Endpoints
│   │   └── InternalSecretsController.ts # Internal Endpoints
│   ├── services/         # Business Logic
│   │   ├── SecretsService.ts
│   │   └── EncryptionService.ts
│   ├── repositories/     # Data Access
│   ├── middleware/       # Express Middleware
│   └── routes/           # Route Definitions
├── dist/                 # Compiled JavaScript
└── package.json
```

---

## 🚢 Deployment

### Docker

```bash
# Build
docker build -t monshyflow-secrets-service -f packages/secrets-service/Dockerfile .

# Run
docker run -p 5003:80 \
  -e MONGODB_URI=mongodb://mongo:27017/monshyflow \
  -e SECRETS_ENCRYPTION_KEY=your-very-long-encryption-key \
  -e INTERNAL_SERVICE_KEY=your-service-key \
  -e AUTH_SERVICE_URL=http://auth-service:80 \
  monshyflow-secrets-service
```

### Docker Compose

Der Service ist Teil der `docker-compose.yml` im Root-Verzeichnis.

### Azure Container Apps

Der Service ist für Azure Container Apps konfiguriert:

- **Port:** 80 (intern)
- **Health Check:** `/health`
- **Key Management:** Azure Key Vault empfohlen

### ⚠️ Production Checklist

- [ ] `SECRETS_ENCRYPTION_KEY` aus Azure Key Vault oder ähnlichem
- [ ] `INTERNAL_SERVICE_KEY` stark und zufällig
- [ ] `NODE_ENV=production`
- [ ] Rate Limiting aktiviert
- [ ] Security Headers aktiviert
- [ ] CORS korrekt konfiguriert
- [ ] Logging für Audit-Zwecke aktiviert
- [ ] Backup-Strategie für Secrets

---

## 🔗 Weitere Informationen

- **Packages Overview:** Siehe [`../README.md`](../README.md)
- **Database Models:** Siehe `@monshy/database` Package
- **Auth Integration:** Siehe `@monshy/auth-service`

---

## 📄 Lizenz

Siehe Root-Repository für Lizenzinformationen.

