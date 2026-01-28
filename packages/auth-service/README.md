# 🔐 Auth Service

The **Auth Service** manages user authentication and authorization for the MonshyFlow platform. It provides JWT-based authentication, user registration, login, and API key management.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Security](#-security)
- [Environment Variables](#-environment-variables)
- [Setup & Installation](#-setup--installation)
- [API-Endpoints](#-api-endpoints)
- [Authentication Flow](#-authentication-flow)
- [Request/Response Examples](#-requestresponse-examples)
- [JWT Tokens](#-jwt-tokens)
- [API Keys](#-api-keys)
- [Health Checks](#-health-checks)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Overview

The Auth Service is an **Express.js-based HTTP service** that runs on port **5002** (configurable). It provides:

- **User Authentication:** Login, Registration, Token Validation
- **JWT Management:** Token Generation and Validation
- **API Key Management:** Create, Manage, and Revoke API Keys
- **Password Security:** bcrypt-based password hashing
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
- ✅ Rate Limiting (stricter for auth endpoints)
- ✅ Security Headers (Helmet)
- ✅ CORS Configuration
- ✅ Request ID for tracing

---

## 🔒 Security

### Password Hashing

Passwords are hashed with **bcrypt**:
- **Rounds:** 10 (configurable)
- **Algorithm:** bcrypt
- **Salt:** Automatically generated

**Best Practices:**
- Passwords are never stored in plain text
- Passwords are never written to logs
- Password comparison is done with `bcrypt.compare()`

### JWT Tokens

- **Algorithm:** HS256 (HMAC SHA-256)
- **Expiration:** Configurable (default: 24h)
- **Payload:** `userId`, `tenantId`, `email`, `role`
- **Secret:** From environment variable (`JWT_SECRET`)

### API Keys

- **Format:** `mf_` + 32 random characters
- **Storage:** Hashed (SHA-256) in database
- **Validation:** Timing-safe comparison
- **Expiration:** Optional, configurable

---

## 🔧 Environment Variables

### Required Variables

```bash
# Port (Default: 5002)
PORT=5002

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/monshyflow

# JWT Secret (MINIMUM 32 characters!)
# Supports multiple variable names (for compatibility):
JWT_SECRET_KEY=your-very-long-and-secure-jwt-secret-min-32-chars
# or
JWT_SECRET=your-very-long-and-secure-jwt-secret-min-32-chars
# or (for .NET compatibility)
JwtSettings__SecretKey=your-very-long-and-secure-jwt-secret-min-32-chars

# JWT Issuer (optional, default: 'monshy-auth-service')
JWT_ISSUER=monshy-auth-service
# or
JwtSettings__Issuer=monshy-auth-service

# JWT Audience (optional, default: 'monshy-services')
JWT_AUDIENCE=monshy-services
# or
JwtSettings__Audience=monshy-services

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

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

1. **JWT Secret:**
   - At least 32 characters long
   - Randomly generated (e.g., `openssl rand -hex 32`)
   - Never commit to code
   - In Production: Use Azure Key Vault or similar

2. **Password Hashing:**
   - bcrypt rounds should be >= 10
   - Never log passwords

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
# In the auth-service directory
cd packages/auth-service
pnpm dev

# Or from root
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

### Public Endpoints (no auth required)

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

**Validation:**
- `email`: Required, must be unique
- `password`: Required, min. 8 characters (recommended)
- `tenantId`: Optional, automatically created if not present

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

#### API Key Validation (for Gateway)

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

### Protected Endpoints (JWT Authentication required)

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

#### Get API keys

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

**Note:** The API key itself is only returned during creation, after that only metadata.

---

#### Create API key

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

**⚠️ IMPORTANT:** The `apiKey` is only returned once during creation. Store it securely!

---

#### Revoke API key

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

#### Delete API key

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
  ↓ Validation (Email, Password)
  ↓ Hash password (bcrypt)
  ↓ Save user to DB
  ↓ Generate JWT token
  ↓ Response with token
Client
  ↓ Store token (e.g., localStorage)
```

### 2. User Login

```
Client
  ↓ POST /api/auth/login
Auth Service
  ↓ Find user in DB
  ↓ Compare password (bcrypt.compare)
  ↓ Generate JWT token
  ↓ Response with token
Client
  ↓ Store token
```

### 3. Authenticated Request

```
Client
  ↓ Request mit Authorization: Bearer {token}
API Service / Auth Service
  ↓ Validate token (verifyToken)
  ↓ Extract user info from token
  ↓ Forward request
```

---

## 📝 Request/Response Examples

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

- ✅ Keys are hashed (SHA-256) when stored
- ✅ Keys are never logged in plain text
- ✅ Keys can be revoked
- ✅ Keys can expire (optional)
- ✅ Keys are tenant-scoped

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
- `200` - Service is healthy
- `500` - Service has issues

---

## 🛠️ Development

### Logging

The service uses **Pino** for structured logging:

```typescript
import { logger } from '@monshy/core';

logger.info({ userId: '123', email: 'user@example.com' }, 'User logged in');
logger.error({ err: error }, 'Login failed');
```

**⚠️ Important:** Passwords are **NEVER** logged!

### Testing

```bash
# Run tests
pnpm test

# Tests with coverage
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

The service is part of `docker-compose.yml` in the root directory.

### Azure Container Apps

The service is configured for Azure Container Apps:

- **Port:** 80 (intern)
- **Health Check:** `/health`
- **Key Management:** Azure Key Vault recommended for `JWT_SECRET`

### ⚠️ Production Checklist

- [ ] `JWT_SECRET_KEY` (or `JWT_SECRET`) from Azure Key Vault or similar
- [ ] `JWT_ISSUER` and `JWT_AUDIENCE` configured
- [ ] `NODE_ENV=production`
- [ ] Rate Limiting enabled
- [ ] Security Headers enabled
- [ ] CORS correctly configured
- [ ] Never log passwords
- [ ] bcrypt Rounds >= 10

---

## 🔗 Further Information

- **Auth Package:** See `@monshy/auth` Package
- **Database Models:** See `@monshy/database` Package
- **Packages Overview:** See [`../README.md`](../README.md)

---

## 📄 License

See root repository for license information.

