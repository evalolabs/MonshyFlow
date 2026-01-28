# 🚀 API Service

The **API Service** is the central service of the MonshyFlow platform. It combines **API Gateway functionality** with **Workflow Management** and provides a central interface for all client requests.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Environment Variables](#-environment-variables)
- [Setup & Installation](#-setup--installation)
- [API-Endpoints](#-api-endpoints)
- [Authentication](#-authentication)
- [Request/Response Examples](#-requestresponse-examples)
- [Health Checks](#-health-checks)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Overview

The API Service is an **Express.js-based HTTP service** that runs on port **5000** (configurable). It provides:

- **Workflow Management:** CRUD operations for workflows
- **API Gateway:** Routes requests to other services (auth-service, execution-service, etc.)
- **Admin Functions:** Tenant Management, User Management, Audit Logs
- **Swagger UI:** Interactive API documentation (Development)
- **Webhook Support:** Public webhook endpoints for workflow execution

---

## ✨ Features

### Workflow Management
- ✅ Workflow CRUD (Create, Read, Update, Delete)
- ✅ Workflow Publishing & Versioning
- ✅ Public Workflow Marketplace
- ✅ Workflow Export/Import (JSON)
- ✅ Node Testing with Context
- ✅ Workflow Execution (proxied to execution-service)

### Admin Functions
- ✅ User Management
- ✅ Tenant Management
- ✅ Statistics & Analytics
- ✅ Audit Logs (GDPR-compliant)
- ✅ Support Consent Management

### Gateway Functionality
- ✅ Request routing to other services
- ✅ Service Discovery (local, Docker, Azure)
- ✅ Load Balancing (via Kong Gateway in Production)

### Security
- ✅ JWT Authentication
- ✅ Service-to-Service Authentication (Service Keys)
- ✅ Rate Limiting
- ✅ Security Headers (Helmet)
- ✅ CORS Configuration
- ✅ Request ID for tracing

---

## 🔧 Environment Variables

### Required Variables

```bash
# Port (Default: 5000)
PORT=5000
# or
API_SERVICE_PORT=5000

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/monshyflow

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Service URLs (optional, automatically detected)
AUTH_SERVICE_URL=http://localhost:5002
EXECUTION_SERVICE_URL=http://localhost:5004
SECRETS_SERVICE_URL=http://localhost:5003
SCHEDULER_SERVICE_URL=http://localhost:5005

# Internal Service Key (for service-to-service communication)
INTERNAL_SERVICE_KEY=your-secret-service-key-change-in-production

# API URL (for Swagger)
API_URL=http://localhost:5000

# Node Environment
NODE_ENV=development  # or production
```

### Optional Variables

```bash
# Azure Container Apps
AZURE_CONTAINER_APPS_ENVIRONMENT=your-environment-name

# Docker Detection
DOTNET_RUNNING_IN_CONTAINER=true
COMPOSE_PROJECT_NAME=monshyflow
HOSTNAME=monshyflow-api-service

# Logging
LOG_LEVEL=info  # debug, info, warn, error
```

### Service Discovery

The service automatically detects the environment:

- **Local:** `http://127.0.0.1:{PORT}`
- **Docker Compose:** `http://{service-name}:80`
- **Azure Container Apps:** `http://{service-name}:80`

Or set explicitly via Environment Variables:
- `AUTH_SERVICE_URL`
- `EXECUTION_SERVICE_URL`
- `SECRETS_SERVICE_URL`
- `SCHEDULER_SERVICE_URL`

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
# In the api-service directory
cd packages/api-service
pnpm dev

# Or from root
pnpm --filter @monshy/api-service dev
```

### Production Build

```bash
cd packages/api-service
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
  "service": "api-service",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### Workflow Endpoints

#### Get workflows

```http
GET /api/workflows
Authorization: Bearer {token}
```

#### Create workflow

```http
POST /api/workflows
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Workflow",
  "description": "Workflow description",
  "nodes": [],
  "edges": []
}
```

#### Update workflow

```http
PUT /api/workflows/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Workflow",
  "nodes": [...],
  "edges": [...]
}
```

#### Delete workflow

```http
DELETE /api/workflows/:id
Authorization: Bearer {token}
```

#### Execute workflow

```http
POST /api/workflows/:workflowId/execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "input": {
    "userPrompt": "Hello"
  }
}
```

#### Export workflow

```http
GET /api/workflows/:id/export
Authorization: Bearer {token}
```

#### Import workflow

```http
POST /api/workflows/import
Authorization: Bearer {token}
Content-Type: application/json

{
  "workflow": { ... }
}
```

#### Test node (with context)

```http
POST /api/workflows/:workflowId/nodes/:nodeId/test-with-context
Authorization: Bearer {token}
Content-Type: application/json

{
  "userPrompt": "Test input"
}
```

---

### Public Workflow Endpoints

#### Get public workflows

```http
GET /api/workflows/public
Authorization: Bearer {token}
```

#### Get public workflow

```http
GET /api/workflows/public/:id
Authorization: Bearer {token}
```

#### Clone public workflow

```http
POST /api/workflows/public/:id/clone
Authorization: Bearer {token}
```

#### Star workflow

```http
POST /api/workflows/public/:id/star
Authorization: Bearer {token}
```

#### Get comments

```http
GET /api/workflows/public/:id/comments
Authorization: Bearer {token}
```

#### Add comment

```http
POST /api/workflows/public/:id/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Great workflow!"
}
```

---

### Admin Endpoints

#### Statistics

```http
GET /api/admin/statistics
Authorization: Bearer {token}
```

#### Users

```http
GET /api/admin/users
POST /api/admin/users
GET /api/admin/users/:id
PUT /api/admin/users/:id
DELETE /api/admin/users/:id
```

#### Tenants

```http
GET /api/admin/tenants
POST /api/admin/tenants
GET /api/admin/tenants/:id
PUT /api/admin/tenants/:id
DELETE /api/admin/tenants/:id
```

---

### Webhook Endpoints

#### Workflow Webhook (public, no auth)

```http
POST /api/webhooks/:workflowId
Content-Type: application/json

{
  "input": {
    "data": "value"
  }
}
```

**Note:** Webhooks are publicly accessible. The workflow must have `isActive: true`.

---

### Internal Endpoints (Service-to-Service)

#### Get workflow (Internal)

```http
GET /api/internal/workflows/:workflowId
X-Service-Key: {INTERNAL_SERVICE_KEY}
```

---

## 🔐 Authentication

### JWT Authentication

Most endpoints require JWT Authentication:

```http
Authorization: Bearer {jwt-token}
```

The token is issued by the `auth-service` and contains:
- `userId`
- `tenantId`
- `role`
- `exp` (Expiration)

### Service-to-Service Authentication

For internal service-to-service communication:

```http
X-Service-Key: {INTERNAL_SERVICE_KEY}
```

---

## 📝 Request/Response Examples

### Create workflow

**Request:**
```http
POST /api/workflows
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Customer Support Bot",
  "description": "Automated customer support workflow",
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "position": { "x": 100, "y": 100 }
    }
  ],
  "edges": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Customer Support Bot",
    "description": "Automated customer support workflow",
    "tenantId": "507f191e810c19729de860ea",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Execute workflow

**Request:**
```http
POST /api/workflows/507f1f77bcf86cd799439011/execute
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "input": {
    "userPrompt": "I need help with my order"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "507f1f77bcf86cd799439012",
    "status": "completed",
    "output": {
      "response": "I can help you with your order..."
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Workflow not found",
  "requestId": "req-1234567890"
}
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
  "service": "api-service",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Status Codes:**
- `200` - Service is healthy
- `500` - Service has issues

---

## 🛠️ Development

### Swagger UI (Development only)

In development mode, Swagger UI is available:

```
http://localhost:5000/swagger
```

Swagger JSON:
```
http://localhost:5000/swagger.json
```

### Logging

The service uses **Pino** for structured logging:

```typescript
import { logger } from '@monshy/core';

logger.info({ userId: '123' }, 'User logged in');
logger.error({ err: error }, 'Failed to process request');
```

### Testing

```bash
# Run tests
pnpm test

# Tests with coverage
pnpm test --coverage
```

### Code Structure

```
api-service/
├── src/
│   ├── controllers/      # Request Handler
│   ├── services/         # Business Logic
│   ├── repositories/     # Data Access
│   ├── middleware/       # Express Middleware
│   ├── routes/           # Route Definitions
│   ├── config/           # Configuration
│   └── gateway/          # Gateway Documentation
├── dist/                 # Compiled JavaScript
└── package.json
```

---

## 🚢 Deployment

### Docker

```bash
# Build
docker build -t monshyflow-api-service -f packages/api-service/Dockerfile .

# Run
docker run -p 5000:80 \
  -e MONGODB_URI=mongodb://mongo:27017/monshyflow \
  -e FRONTEND_URL=https://app.monshyflow.com \
  -e INTERNAL_SERVICE_KEY=your-key \
  monshyflow-api-service
```

### Docker Compose

The service is part of `docker-compose.yml` in the root directory.

### Azure Container Apps

The service is configured for Azure Container Apps:

- **Port:** 80 (intern)
- **Health Check:** `/health`
- **Service Discovery:** Automatically via internal names

### Environment-specific Configuration

- **Development:** `NODE_ENV=development` (Swagger UI active)
- **Production:** `NODE_ENV=production` (Swagger UI disabled)

---

## 🔗 Further Information

- **Gateway Details:** See [`src/gateway/README.md`](./src/gateway/README.md)
- **Swagger Config:** See [`src/config/swagger.ts`](./src/config/swagger.ts)
- **Packages Overview:** See [`../README.md`](../README.md)

---

## 📄 License

See root repository for license information.

