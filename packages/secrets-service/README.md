# 🔐 Secrets Service

The **Secrets Service** manages encrypted secrets for workflows and applications. It provides secure storage, encryption, and decryption of sensitive data such as API keys, passwords, and credentials.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Security](#-security)
- [Environment Variables](#-environment-variables)
- [Setup & Installation](#-setup--installation)
- [API-Endpoints](#-api-endpoints)
- [Authentication](#-authentication)
- [Request/Response Examples](#-requestresponse-examples)
- [Encryption Details](#-encryption-details)
- [Health Checks](#-health-checks)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Overview

The Secrets Service is an **Express.js-based HTTP service** that runs on port **5003** (configurable). It provides:

- **Encrypted Storage:** AES-256-GCM encryption for all secrets
- **Tenant Isolation:** Secrets are isolated per tenant
- **Service-to-Service API:** Other services can retrieve secrets
- **Secret Management:** CRUD operations for secrets
- **Type Support:** Various secret types (API Key, Password, Token, etc.)

---

## ✨ Features

### Secret Management
- ✅ Secret CRUD (Create, Read, Update, Delete)
- ✅ Encrypted storage (AES-256-GCM)
- ✅ Secret Decryption on-demand
- ✅ Secret Types (API Key, Password, Token, etc.)
- ✅ Provider Support (OpenAI, Azure, etc.)
- ✅ Active/Inactive Status

### Security
- ✅ AES-256-GCM encryption
- ✅ Salt-based key derivation
- ✅ Tenant isolation
- ✅ JWT Authentication for public endpoints
- ✅ Service Key Authentication for internal endpoints
- ✅ Rate Limiting
- ✅ Security Headers (Helmet)

### Service Integration
- ✅ Internal API for other services
- ✅ Bulk secret retrieval per tenant
- ✅ Secret lookup by name
- ✅ Automatic decryption for services

---

## 🔒 Security

### Encryption

The service uses **AES-256-GCM** (Galois/Counter Mode) for encryption:

- **Algorithm:** AES-256-GCM
- **Key Length:** 256 bits (32 bytes)
- **IV Length:** 128 bits (16 bytes)
- **Salt Length:** 256 bits (32 bytes)
- **Auth Tag:** 128 bits (16 bytes)

### Key Management

The encryption key is loaded from environment variables:

1. `SECRETS_ENCRYPTION_KEY` (preferred)
2. `ENCRYPTION_KEY` (fallback)
3. Default Key (Development only, **NOT for Production!**)

**⚠️ IMPORTANT:** In production, the key should come from a secure key management system (e.g., Azure Key Vault).

### Salt-based Key Derivation

Each secret uses its own salt:
- Salt is randomly generated during encryption
- Key is derived from master key + salt
- Prevents rainbow table attacks

### Tenant Isolation

- Secrets are isolated per tenant
- Users can only see secrets of their own tenant
- Superadmin can see all secrets (for support)

---

## 🔧 Environment Variables

### Required Variables

```bash
# Port (Default: 5003)
PORT=5003

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/monshyflow

# Encryption Key (MINIMUM 32 characters!)
SECRETS_ENCRYPTION_KEY=your-very-long-and-secure-encryption-key-min-32-chars
# or
ENCRYPTION_KEY=your-very-long-and-secure-encryption-key-min-32-chars

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Auth Service URL (for token validation)
AUTH_SERVICE_URL=http://localhost:5002

# Internal Service Key (for service-to-service communication)
INTERNAL_SERVICE_KEY=your-secret-service-key-change-in-production

# Node Environment
NODE_ENV=development  # or production
```

### Optional Variables

```bash
# Azure Container Apps
AZURE_CONTAINER_APPS_ENVIRONMENT=your-environment-name

# Logging
LOG_LEVEL=info  # debug, info, warn, error
```

### ⚠️ Security Best Practices

1. **Encryption Key:**
   - At least 32 characters long
   - Randomly generated (e.g., `openssl rand -hex 32`)
   - Never commit to code
   - In Production: Use Azure Key Vault or similar

2. **Internal Service Key:**
   - Strong, random value
   - Only for service-to-service communication
   - Never commit to code

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- MongoDB (local or remote)

### Installation

```bash
# In the root directory
pnpm install

# Build packages
pnpm build:packages
```

### Start Development

```bash
# In the secrets-service directory
cd packages/secrets-service
pnpm dev

# Or from root
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

#### Get secrets

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

**Note:** Secrets are returned **encrypted**. Use `/api/secrets/:id/decrypt` for decrypted values.

---

#### Get secret (encrypted)

```http
GET /api/secrets/:id
Authorization: Bearer {token}
```

---

#### Decrypt secret

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
    "value": "sk-...",  // ← Decrypted!
    "secretType": "api-key",
    "provider": "openai"
  }
}
```

**⚠️ Security Note:** Decrypted secrets should only be retrieved when needed and should not be logged.

---

#### Create secret

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

**Validation:**
- `name`: Required, unique per tenant
- `value`: Required, stored encrypted
- `secretType`: Optional (e.g., "api-key", "password", "token")
- `provider`: Optional (e.g., "openai", "azure", "aws")

---

#### Update secret

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

**Note:** If `value` is updated, it will be re-encrypted.

---

#### Delete secret

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

#### Get secrets per tenant (decrypted)

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
      "value": "sk-proj-...",  // ← Decrypted!
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

**Usage:** Used by `execution-service` and other services to load secrets for workflow execution.

---

#### Get secret by name (decrypted)

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

The token is issued by the `auth-service` and contains:
- `userId`
- `tenantId`
- `role`

**Permissions:**
- **User:** Can only see secrets of their own tenant
- **Superadmin:** Can see all secrets (for support)

### Service-to-Service Authentication (Internal Endpoints)

```http
X-Service-Key: {INTERNAL_SERVICE_KEY}
```

**Usage:** For service-to-service communication (e.g., `execution-service` → `secrets-service`).

---

## 📝 Request/Response Examples

### Create secret

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

### Decrypt secret

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

### Encryption Process

1. **Salt Generation:** Random 32-byte salt is generated
2. **Key Derivation:** Key is derived from master key + salt (scrypt)
3. **IV Generation:** Random 16-byte IV is generated
4. **Encryption:** Value is encrypted with AES-256-GCM
5. **Storage:** `encryptedValue` (IV:tag:data) and `salt` are stored

### Decryption Process

1. **Key Derivation:** Key is derived from master key + stored salt
2. **Parsing:** `encryptedValue` is split into IV, tag, and encrypted data
3. **Decryption:** Value is decrypted with AES-256-GCM
4. **Validation:** Auth tag is validated (prevents tampering)

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
- `200` - Service is healthy
- `500` - Service has issues

---

## 🛠️ Development

### Logging

The service uses **Pino** for structured logging:

```typescript
import { logger } from '@monshy/core';

logger.info({ tenantId: '123', secretId: '456' }, 'Secret created');
logger.error({ err: error }, 'Failed to encrypt secret');
```

**⚠️ Important:** Decrypted secrets are **NEVER** logged!

### Testing

```bash
# Run tests
pnpm test

# Tests with coverage
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

The service is part of `docker-compose.yml` in the root directory.

### Azure Container Apps

The service is configured for Azure Container Apps:

- **Port:** 80 (intern)
- **Health Check:** `/health`
- **Key Management:** Azure Key Vault recommended

### ⚠️ Production Checklist

- [ ] `SECRETS_ENCRYPTION_KEY` from Azure Key Vault or similar
- [ ] `INTERNAL_SERVICE_KEY` strong and random
- [ ] `NODE_ENV=production`
- [ ] Rate Limiting enabled
- [ ] Security Headers enabled
- [ ] CORS correctly configured
- [ ] Logging enabled for audit purposes
- [ ] Backup strategy for secrets

---

## 🔗 Further Information

- **Packages Overview:** See [`../README.md`](../README.md)
- **Database Models:** See `@monshy/database` Package
- **Auth Integration:** See `@monshy/auth-service`

---

## 📄 License

See root repository for license information.

