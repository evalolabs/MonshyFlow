# 🔐 Auth Service

Der **Auth Service** verwaltet Benutzerauthentifizierung und Autorisierung für die MonshyFlow-Plattform. Er bietet JWT-basierte Authentication, User Registration, Login und API Key Management.

---

## 📋 Inhaltsverzeichnis

- [Übersicht](#-übersicht)
- [Features](#-features)
- [Security](#-security)
- [Environment Variables](#-environment-variables)
- [Setup & Installation](#-setup--installation)
- [API-Endpoints](#-api-endpoints)
- [Authentication Flow](#-authentication-flow)
- [Request/Response-Beispiele](#-requestresponse-beispiele)
- [JWT Tokens](#-jwt-tokens)
- [API Keys](#-api-keys)
- [Health Checks](#-health-checks)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Übersicht

Der Auth Service ist ein **Express.js-basierter HTTP-Service**, der auf Port **5002** läuft (konfigurierbar). Er bietet:

- **User Authentication:** Login, Registration, Token-Validierung
- **JWT Management:** Token-Generierung und -Validierung
- **API Key Management:** Erstellen, Verwalten und Revokieren von API Keys
- **Password Security:** bcrypt-basierte Passwort-Hashing
- **Tenant Support:** Multi-Tenant Authentication

---

## ✨ Features

### User Authentication
- ✅ User Registration
- ✅ User Login (Email + Password)
- ✅ JWT Token Generation
- ✅ Token Validation
- ✅ Current User Info (`/me` Endpoint)
- ✅ Password Hashing (bcrypt)

### API Key Management
- ✅ API Key Generation
- ✅ API Key Validation
- ✅ API Key Revocation
- ✅ API Key Expiration
- ✅ Tenant-scoped API Keys

### Security
- ✅ bcrypt Password Hashing (10 rounds)
- ✅ JWT Token Signing & Verification
- ✅ Rate Limiting (stricter für Auth-Endpoints)
- ✅ Security Headers (Helmet)
- ✅ CORS Configuration
- ✅ Request ID für Tracing

---

## 🔒 Security

### Password Hashing

Passwörter werden mit **bcrypt** gehasht:
- **Rounds:** 10 (konfigurierbar)
- **Algorithm:** bcrypt
- **Salt:** Automatisch generiert

**Best Practices:**
- Passwörter werden niemals im Klartext gespeichert
- Passwörter werden niemals in Logs geschrieben
- Passwort-Vergleich erfolgt mit `bcrypt.compare()`

### JWT Tokens

- **Algorithm:** HS256 (HMAC SHA-256)
- **Expiration:** Konfigurierbar (Standard: 24h)
- **Payload:** `userId`, `tenantId`, `email`, `role`
- **Secret:** Aus Environment Variable (`JWT_SECRET`)

### API Keys

- **Format:** `mf_` + 32 zufällige Zeichen
- **Storage:** Gehasht (SHA-256) in Datenbank
- **Validation:** Timing-safe Vergleich
- **Expiration:** Optional, konfigurierbar

---

## 🔧 Environment Variables

### Erforderliche Variablen

```bash
# Port (Standard: 5002)
PORT=5002

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/monshyflow

# JWT Secret (MINDESTENS 32 Zeichen!)
# Unterstützt mehrere Variablennamen (für Kompatibilität):
JWT_SECRET_KEY=your-very-long-and-secure-jwt-secret-min-32-chars
# oder
JWT_SECRET=your-very-long-and-secure-jwt-secret-min-32-chars
# oder (für .NET Kompatibilität)
JwtSettings__SecretKey=your-very-long-and-secure-jwt-secret-min-32-chars

# JWT Issuer (optional, Standard: 'monshy-auth-service')
JWT_ISSUER=monshy-auth-service
# oder
JwtSettings__Issuer=monshy-auth-service

# JWT Audience (optional, Standard: 'monshy-services')
JWT_AUDIENCE=monshy-services
# oder
JwtSettings__Audience=monshy-services

# Frontend URL (für CORS)
FRONTEND_URL=http://localhost:5173

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

1. **JWT Secret:**
   - Mindestens 32 Zeichen lang
   - Zufällig generiert (z.B. `openssl rand -hex 32`)
   - Nie im Code committen
   - In Production: Azure Key Vault oder ähnliches verwenden

2. **Password Hashing:**
   - bcrypt Rounds sollten >= 10 sein
   - Passwörter niemals loggen

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
# Im auth-service Verzeichnis
cd packages/auth-service
pnpm dev

# Oder vom Root
pnpm --filter @monshy/auth-service dev
```

### Production Build

```bash
cd packages/auth-service
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
  "service": "auth-service",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### Public Endpoints (keine Auth erforderlich)

#### User Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "tenantId": "optional-tenant-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "tenantId": "507f191e810c19729de860ea",
      "roles": ["user"]
    }
  }
}
```

**Validierung:**
- `email`: Erforderlich, muss eindeutig sein
- `password`: Erforderlich, min. 8 Zeichen (empfohlen)
- `tenantId`: Optional, wird automatisch erstellt falls nicht vorhanden

---

#### User Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "tenantId": "507f191e810c19729de860ea",
      "tenantName": "My Tenant",
      "roles": ["user"]
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

#### Token Validation

```http
GET /api/auth/validate
Authorization: Bearer {token}
```

**Response (valid):**
```json
{
  "valid": true,
  "payload": {
    "userId": "507f1f77bcf86cd799439011",
    "tenantId": "507f191e810c19729de860ea",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "error": "Token expired"
}
```

---

#### API Key Validation (für Gateway)

```http
POST /api/auth/validate-apikey
Content-Type: application/json

{
  "apiKey": "mf_abc123..."
}
```

**Response (valid):**
```json
{
  "success": true,
  "data": {
    "tenantId": "507f191e810c19729de860ea",
    "userId": "507f1f77bcf86cd799439011",
    "apiKeyId": "507f1f77bcf86cd799439012"
  }
}
```

**Response (invalid):**
```json
{
  "success": false,
  "error": "Invalid or expired API Key"
}
```

---

### Protected Endpoints (JWT Authentication erforderlich)

#### Current User Info

```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "tenantId": "507f191e810c19729de860ea",
    "tenantName": "My Tenant",
    "roles": ["user"],
    "isActive": true,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

#### API Keys abrufen

```http
GET /api/apikeys
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Production API Key",
      "description": "API Key for production use",
      "tenantId": "507f191e810c19729de860ea",
      "isActive": true,
      "expiresAt": "2025-01-01T12:00:00.000Z",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Hinweis:** Der API Key selbst wird nur bei der Erstellung zurückgegeben, danach nur noch Metadaten.

---

#### API Key erstellen

```http
POST /api/apikeys
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Production API Key",
  "description": "API Key for production use",
  "expiresAt": "2025-01-01T12:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "apiKey": "mf_abc123def456...",  // ← Nur einmal sichtbar!
    "name": "Production API Key",
    "description": "API Key for production use",
    "expiresAt": "2025-01-01T12:00:00.000Z"
  }
}
```

**⚠️ WICHTIG:** Der `apiKey` wird nur einmal bei der Erstellung zurückgegeben. Speichere ihn sicher!

---

#### API Key revokieren

```http
POST /api/apikeys/:id/revoke
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "API Key revoked successfully"
}
```

---

#### API Key löschen

```http
DELETE /api/apikeys/:id
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "API Key deleted successfully"
}
```

---

## 🔄 Authentication Flow

### 1. User Registration

```
Client
  ↓ POST /api/auth/register
Auth Service
  ↓ Validierung (Email, Password)
  ↓ Passwort hashen (bcrypt)
  ↓ User in DB speichern
  ↓ JWT Token generieren
  ↓ Response mit Token
Client
  ↓ Token speichern (z.B. localStorage)
```

### 2. User Login

```
Client
  ↓ POST /api/auth/login
Auth Service
  ↓ User in DB finden
  ↓ Passwort vergleichen (bcrypt.compare)
  ↓ JWT Token generieren
  ↓ Response mit Token
Client
  ↓ Token speichern
```

### 3. Authenticated Request

```
Client
  ↓ Request mit Authorization: Bearer {token}
API Service / Auth Service
  ↓ Token validieren (verifyToken)
  ↓ User-Info aus Token extrahieren
  ↓ Request weiterleiten
```

---

## 📝 Request/Response-Beispiele

### Registration

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJ0ZW5hbnRJZCI6IjUwN2YxOTFlODEwYzE5NzI5ZGU4NjBlYSIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTcwNDExMjAwMCwiZXhwIjoxNzA0MTk4NDAwfQ...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "tenantId": "507f191e810c19729de860ea",
      "roles": ["user"]
    }
  }
}
```

### Login

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "tenantId": "507f191e810c19729de860ea",
      "tenantName": "John's Tenant",
      "roles": ["user"]
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

## 🎫 JWT Tokens

### Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "tenantId": "507f191e810c19729de860ea",
  "email": "user@example.com",
  "role": "user",
  "iat": 1704112000,
  "exp": 1704198400
}
```

### Token Usage

```typescript
// In Client (z.B. Frontend)
const token = response.data.token;
localStorage.setItem('token', token);

// In Requests
fetch('/api/workflows', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Token Validation

```typescript
// In anderen Services
import { verifyToken } from '@monshy/auth';

const payload = verifyToken(token);
// payload: { userId, tenantId, email, role }
```

---

## 🔑 API Keys

### API Key Format

```
mf_{32 random characters}
```

Beispiel:
```
mf_abc123def456ghi789jkl012mno345pqr678
```

### API Key Usage

```http
POST /api/workflows
X-API-Key: mf_abc123def456...
```

Oder als Bearer Token:
```http
POST /api/workflows
Authorization: Bearer mf_abc123def456...
```

### API Key Security

- ✅ Keys werden gehasht (SHA-256) gespeichert
- ✅ Keys werden niemals im Klartext geloggt
- ✅ Keys können revokiert werden
- ✅ Keys können ablaufen (optional)
- ✅ Keys sind tenant-scoped

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
  "service": "auth-service",
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

logger.info({ userId: '123', email: 'user@example.com' }, 'User logged in');
logger.error({ err: error }, 'Login failed');
```

**⚠️ Wichtig:** Passwörter werden **NIE** geloggt!

### Testing

```bash
# Tests ausführen
pnpm test

# Tests mit Coverage
pnpm test --coverage
```

### Code Structure

```
auth-service/
├── src/
│   ├── controllers/      # Request Handler
│   │   ├── AuthController.ts
│   │   └── ApiKeyController.ts
│   ├── services/         # Business Logic
│   │   ├── AuthService.ts
│   │   ├── JwtService.ts
│   │   ├── ApiKeyService.ts
│   │   └── UserService.ts
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
docker build -t monshyflow-auth-service -f packages/auth-service/Dockerfile .

# Run
docker run -p 5002:80 \
  -e MONGODB_URI=mongodb://mongo:27017/monshyflow \
  -e JWT_SECRET=your-very-long-jwt-secret \
  -e FRONTEND_URL=https://app.monshyflow.com \
  monshyflow-auth-service
```

### Docker Compose

Der Service ist Teil der `docker-compose.yml` im Root-Verzeichnis.

### Azure Container Apps

Der Service ist für Azure Container Apps konfiguriert:

- **Port:** 80 (intern)
- **Health Check:** `/health`
- **Key Management:** Azure Key Vault empfohlen für `JWT_SECRET`

### ⚠️ Production Checklist

- [ ] `JWT_SECRET_KEY` (oder `JWT_SECRET`) aus Azure Key Vault oder ähnlichem
- [ ] `JWT_ISSUER` und `JWT_AUDIENCE` konfiguriert
- [ ] `NODE_ENV=production`
- [ ] Rate Limiting aktiviert
- [ ] Security Headers aktiviert
- [ ] CORS korrekt konfiguriert
- [ ] Passwörter niemals loggen
- [ ] bcrypt Rounds >= 10

---

## 🔗 Weitere Informationen

- **Auth Package:** Siehe `@monshy/auth` Package
- **Database Models:** Siehe `@monshy/database` Package
- **Packages Overview:** Siehe [`../README.md`](../README.md)

---

## 📄 Lizenz

Siehe Root-Repository für Lizenzinformationen.

