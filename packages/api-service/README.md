# 🚀 API Service

Der **API Service** ist der zentrale Service der MonshyFlow-Plattform. Er kombiniert **API Gateway-Funktionalität** mit **Workflow Management** und bietet eine zentrale Schnittstelle für alle Client-Anfragen.

---

## 📋 Inhaltsverzeichnis

- [Übersicht](#-übersicht)
- [Features](#-features)
- [Environment Variables](#-environment-variables)
- [Setup & Installation](#-setup--installation)
- [API-Endpoints](#-api-endpoints)
- [Authentication](#-authentication)
- [Request/Response-Beispiele](#-requestresponse-beispiele)
- [Health Checks](#-health-checks)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Übersicht

Der API Service ist ein **Express.js-basierter HTTP-Service**, der auf Port **5000** läuft (konfigurierbar). Er bietet:

- **Workflow Management:** CRUD-Operationen für Workflows
- **API Gateway:** Routing zu anderen Services (auth-service, execution-service, etc.)
- **Admin Functions:** Tenant Management, User Management, Audit Logs
- **Swagger UI:** Interaktive API-Dokumentation (Development)
- **Webhook Support:** Öffentliche Webhook-Endpoints für Workflow-Execution

---

## ✨ Features

### Workflow Management
- ✅ Workflow CRUD (Create, Read, Update, Delete)
- ✅ Workflow Publishing & Versioning
- ✅ Public Workflow Marketplace
- ✅ Workflow Export/Import (JSON)
- ✅ Node Testing mit Context
- ✅ Workflow Execution (proxied to execution-service)

### Admin Functions
- ✅ User Management
- ✅ Tenant Management
- ✅ Statistics & Analytics
- ✅ Audit Logs (DSGVO-konform)
- ✅ Support Consent Management

### Gateway-Funktionalität
- ✅ Request Routing zu anderen Services
- ✅ Service Discovery (lokal, Docker, Azure)
- ✅ Load Balancing (über Kong Gateway in Production)

### Security
- ✅ JWT Authentication
- ✅ Service-to-Service Authentication (Service Keys)
- ✅ Rate Limiting
- ✅ Security Headers (Helmet)
- ✅ CORS Configuration
- ✅ Request ID für Tracing

---

## 🔧 Environment Variables

### Erforderliche Variablen

```bash
# Port (Standard: 5000)
PORT=5000
# oder
API_SERVICE_PORT=5000

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/monshyflow

# Frontend URL (für CORS)
FRONTEND_URL=http://localhost:5173

# Service URLs (optional, wird automatisch erkannt)
AUTH_SERVICE_URL=http://localhost:5002
EXECUTION_SERVICE_URL=http://localhost:5004
SECRETS_SERVICE_URL=http://localhost:5003
SCHEDULER_SERVICE_URL=http://localhost:5005

# Internal Service Key (für Service-to-Service Kommunikation)
INTERNAL_SERVICE_KEY=your-secret-service-key-change-in-production

# API URL (für Swagger)
API_URL=http://localhost:5000

# Node Environment
NODE_ENV=development  # oder production
```

### Optionale Variablen

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

Der Service erkennt automatisch die Umgebung:

- **Lokal:** `http://127.0.0.1:{PORT}`
- **Docker Compose:** `http://{service-name}:80`
- **Azure Container Apps:** `http://{service-name}:80`

Oder setze explizit via Environment Variables:
- `AUTH_SERVICE_URL`
- `EXECUTION_SERVICE_URL`
- `SECRETS_SERVICE_URL`
- `SCHEDULER_SERVICE_URL`

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
# Im api-service Verzeichnis
cd packages/api-service
pnpm dev

# Oder vom Root
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

#### Workflows abrufen

```http
GET /api/workflows
Authorization: Bearer {token}
```

#### Workflow erstellen

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

#### Workflow aktualisieren

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

#### Workflow löschen

```http
DELETE /api/workflows/:id
Authorization: Bearer {token}
```

#### Workflow ausführen

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

#### Workflow exportieren

```http
GET /api/workflows/:id/export
Authorization: Bearer {token}
```

#### Workflow importieren

```http
POST /api/workflows/import
Authorization: Bearer {token}
Content-Type: application/json

{
  "workflow": { ... }
}
```

#### Node testen (mit Context)

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

#### Public Workflows abrufen

```http
GET /api/workflows/public
Authorization: Bearer {token}
```

#### Public Workflow abrufen

```http
GET /api/workflows/public/:id
Authorization: Bearer {token}
```

#### Public Workflow klonen

```http
POST /api/workflows/public/:id/clone
Authorization: Bearer {token}
```

#### Workflow starren

```http
POST /api/workflows/public/:id/star
Authorization: Bearer {token}
```

#### Kommentare abrufen

```http
GET /api/workflows/public/:id/comments
Authorization: Bearer {token}
```

#### Kommentar hinzufügen

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

#### Workflow Webhook (öffentlich, keine Auth)

```http
POST /api/webhooks/:workflowId
Content-Type: application/json

{
  "input": {
    "data": "value"
  }
}
```

**Hinweis:** Webhooks sind öffentlich zugänglich. Der Workflow muss `isActive: true` sein.

---

### Internal Endpoints (Service-to-Service)

#### Workflow abrufen (Internal)

```http
GET /api/internal/workflows/:workflowId
X-Service-Key: {INTERNAL_SERVICE_KEY}
```

---

## 🔐 Authentication

### JWT Authentication

Die meisten Endpoints benötigen JWT Authentication:

```http
Authorization: Bearer {jwt-token}
```

Der Token wird vom `auth-service` ausgestellt und enthält:
- `userId`
- `tenantId`
- `role`
- `exp` (Expiration)

### Service-to-Service Authentication

Für interne Service-Kommunikation:

```http
X-Service-Key: {INTERNAL_SERVICE_KEY}
```

---

## 📝 Request/Response-Beispiele

### Workflow erstellen

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

### Workflow ausführen

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
- `200` - Service ist gesund
- `500` - Service hat Probleme

---

## 🛠️ Development

### Swagger UI (nur Development)

Im Development-Modus ist Swagger UI verfügbar:

```
http://localhost:5000/swagger
```

Swagger JSON:
```
http://localhost:5000/swagger.json
```

### Logging

Der Service nutzt **Pino** für strukturiertes Logging:

```typescript
import { logger } from '@monshy/core';

logger.info({ userId: '123' }, 'User logged in');
logger.error({ err: error }, 'Failed to process request');
```

### Testing

```bash
# Tests ausführen
pnpm test

# Tests mit Coverage
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

Der Service ist Teil der `docker-compose.yml` im Root-Verzeichnis.

### Azure Container Apps

Der Service ist für Azure Container Apps konfiguriert:

- **Port:** 80 (intern)
- **Health Check:** `/health`
- **Service Discovery:** Automatisch über interne Namen

### Environment-spezifische Konfiguration

- **Development:** `NODE_ENV=development` (Swagger UI aktiv)
- **Production:** `NODE_ENV=production` (Swagger UI deaktiviert)

---

## 🔗 Weitere Informationen

- **Gateway Details:** Siehe [`src/gateway/README.md`](./src/gateway/README.md)
- **Swagger Config:** Siehe [`src/config/swagger.ts`](./src/config/swagger.ts)
- **Packages Overview:** Siehe [`../README.md`](../README.md)

---

## 📄 Lizenz

Siehe Root-Repository für Lizenzinformationen.

