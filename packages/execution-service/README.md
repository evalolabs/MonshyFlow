# ⚙️ Execution Service

Der **Execution Service** ist der Kern der MonshyFlow-Plattform. Er führt Workflows aus, verarbeitet Node-Operationen und integriert verschiedene Services wie OpenAI Agents, MCP (Model Context Protocol), Web Search und mehr.

---

## 📋 Inhaltsverzeichnis

- [Übersicht](#-übersicht)
- [Features](#-features)
- [Environment Variables](#-environment-variables)
- [Setup & Installation](#-setup--installation)
- [API-Endpoints](#-api-endpoints)
- [Request/Response-Beispiele](#-requestresponse-beispiele)
- [Architektur](#-architektur)
- [Health Checks](#-health-checks)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Übersicht

Der Execution Service ist ein **Express.js-basierter HTTP-Service**, der auf Port **5004** läuft (Standard, konfigurierbar via `PORT` Environment Variable). 

**Port-Konfiguration:**
- **Standard-Port:** Port 5004 (siehe `src/config/config.ts`: `process.env.PORT || 5004`)
- **Docker Compose:** Port 5004 (siehe `docker-compose.yml`: `PORT=5004`)
- **Andere Services erwarten:** Port 5004 (siehe `api-service` und `scheduler-service` Config)

**Hinweis:** Der Service läuft konsistent auf Port 5004, sowohl lokal als auch in Docker.

Er bietet:

- **Workflow Execution:** Vollständige Workflow-Ausführung mit Node-Processing
- **Node Execution:** Einzelne Node-Ausführung für Testing
- **Agent SDK Integration:** OpenAI Agents für intelligente Workflows
- **MCP Support:** Model Context Protocol für erweiterte Funktionalität
- **Web Search:** Integration verschiedener Web-Search-Provider
- **OpenAI Integration:** Files API, Vector Stores, Assistants
- **Schema Validation:** Node-Schema-Validierung
- **Real-time Events:** SSE (Server-Sent Events) für Live-Updates

---

## ✨ Features

### Workflow Execution
- ✅ Vollständige Workflow-Ausführung
- ✅ Node-by-Node Processing
- ✅ Expression Resolution (Variablen, Secrets)
- ✅ Error Handling & Retry Logic
- ✅ Background Execution (via RabbitMQ)
- ✅ Run History & Status Tracking

### Node Types
- ✅ LLM Nodes (OpenAI, etc.)
- ✅ HTTP Request Nodes
- ✅ Code Execution Nodes
- ✅ Transform Nodes
- ✅ Email Nodes
- ✅ Variable Nodes
- ✅ Conditional Nodes (If/Else, While, ForEach)
- ✅ Custom Nodes (via Registry)

### Integrations
- ✅ **OpenAI Agents SDK:** Intelligente Agent-basierte Workflows
- ✅ **MCP (Model Context Protocol):** 20+ integrierte MCP Handler
- ✅ **Web Search:** Serper, OpenAI Web Search
- ✅ **Email:** Nodemailer Integration
- ✅ **OpenAI Files API:** File Upload/Management
- ✅ **OpenAI Vector Stores:** RAG (Retrieval-Augmented Generation)

### Services
- ✅ **Redis:** Caching & State Management
- ✅ **RabbitMQ:** Message Queue für Background Jobs
- ✅ **MongoDB:** Run Storage & Execution History
- ✅ **Cleanup Service:** Automatische Datenbereinigung

---

## 🔧 Environment Variables

### Erforderliche Variablen

```bash
# Port (Standard: 5004)
PORT=5004

# MongoDB Connection String
MONGODB_URL=mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin

# Redis Connection String
REDIS_URL=redis://localhost:6379

# RabbitMQ Connection String
RABBITMQ_URL=amqp://localhost:5672

# Secrets Service URL (für API Keys)
SECRETS_SERVICE_URL=http://localhost:5003
# oder
SECRETS_SERVICE_URL=http://secrets-service:80

# Internal Service Key (für Service-to-Service Kommunikation)
INTERNAL_SERVICE_KEY=internal-service-key-change-in-production

# Node Environment
NODE_ENV=development  # oder production
```

### Optionale Variablen

```bash
# OpenAI API Key (Fallback, wird normalerweise aus Secrets geladen)
OPENAI_API_KEY=sk-...

# Agent Service URL
AGENT_SERVICE_URL=http://localhost:5000

# Cleanup Configuration
EXECUTION_RETENTION_DAYS=30
CLEANUP_RETENTION_DAYS=30
CLEANUP_INTERVAL_MS=86400000  # 24 Stunden
CLEANUP_RUN_ON_STARTUP=true

# Webhook Secret
WEBHOOK_SECRET=change-me-in-production

# Azure Container Apps
AZURE_CONTAINER_APPS_ENVIRONMENT=your-environment-name
```

---

## 🚀 Setup & Installation

### Voraussetzungen

- Node.js >= 20.0.0
- MongoDB (lokal oder Remote)
- Redis (lokal oder Remote)
- RabbitMQ (lokal oder Remote)

### Installation

```bash
# Im Root-Verzeichnis
pnpm install

# Packages bauen
pnpm build:packages
```

### Development starten

```bash
# Im execution-service Verzeichnis
cd packages/execution-service
pnpm dev

# Oder vom Root
pnpm --filter execution-service dev
```

### Production Build

```bash
cd packages/execution-service
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
  "version": "2.0.0",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "rabbitmq": "connected"
  }
}
```

---

### Workflow Execution (v1 API - Professional)

#### Workflow Run erstellen und starten

```http
POST /v1/workflows/:workflowId/runs
Content-Type: application/json

{
  "input": {
    "userPrompt": "Hello, world!"
  },
  "options": {
    "stream": false,
    "background": false,
    "store": true
  },
  "metadata": {
    "source": "api",
    "userId": "507f1f77bcf86cd799439011"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "507f1f77bcf86cd799439012",
    "workflowId": "507f1f77bcf86cd799439011",
    "status": "running",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Options:**
- `stream`: boolean - SSE Events streamen (Standard: false)
- `background`: boolean - Im Hintergrund ausführen (Standard: false)
- `store`: boolean - Run in Datenbank speichern (Standard: true)

---

#### Workflow Runs abrufen

```http
GET /v1/workflows/:workflowId/runs
```

**Query Parameters:**
- `limit`: number - Anzahl der Runs (Standard: 10)
- `offset`: number - Offset für Pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "runId": "507f1f77bcf86cd799439012",
      "status": "completed",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "completedAt": "2024-01-01T12:00:05.000Z",
      "output": {
        "result": "Hello, world!"
      }
    }
  ]
}
```

---

#### Run Status abrufen

```http
GET /v1/runs/:runId/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "507f1f77bcf86cd799439012",
    "status": "completed",
    "progress": 100,
    "currentNode": null,
    "output": {
      "result": "Hello, world!"
    },
    "error": null,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "completedAt": "2024-01-01T12:00:05.000Z"
  }
}
```

**Status Werte:**
- `pending` - Wartet auf Ausführung
- `running` - Läuft gerade
- `completed` - Erfolgreich abgeschlossen
- `failed` - Fehlgeschlagen
- `cancelled` - Abgebrochen

---

#### Run abbrechen

```http
POST /v1/runs/:runId/cancel
```

**Response:**
```json
{
  "success": true,
  "message": "Run cancelled"
}
```

---

### Legacy Execution API

#### Workflow ausführen

```http
POST /api/execute/:workflowId
Content-Type: application/json

{
  "input": {
    "userPrompt": "Hello, world!"
  }
}
```

---

#### Node testen (mit Context)

```http
POST /api/execute/test-node-with-context
Content-Type: application/json

{
  "workflow": { ... },
  "nodeId": "node-1",
  "input": {
    "userPrompt": "Test"
  },
  "secrets": {
    "OPENAI_API_KEY": "sk-..."
  }
}
```

---

#### Node ausführen

```http
POST /api/execute/node
Content-Type: application/json

{
  "node": {
    "id": "node-1",
    "type": "llm",
    "data": { ... }
  },
  "input": { ... }
}
```

---

### Schema API

#### Node Schema abrufen

```http
GET /api/schemas/:nodeType/:version
GET /api/schemas/:nodeType/:version/:resource
GET /api/schemas/:nodeType/:version/:resource/:operation
```

**Beispiele:**
- `/api/schemas/email/1.0`
- `/api/schemas/httpRequest/1.0/request`
- `/api/schemas/httpRequest/1.0/request/get`

**Response:**
```json
{
  "nodeType": "email",
  "version": "1.0",
  "schema": {
    "type": "object",
    "properties": {
      "to": { "type": "string" },
      "subject": { "type": "string" },
      "body": { "type": "string" }
    },
    "required": ["to", "subject", "body"]
  }
}
```

---

#### Alle Node Types abrufen

```http
GET /api/schemas/nodes
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "llm",
      "name": "LLM",
      "version": "1.0"
    },
    {
      "type": "http-request",
      "name": "HTTP Request",
      "version": "1.0"
    }
  ]
}
```

---

### Schema Validation

```http
POST /api/validate-schema
Content-Type: application/json

{
  "schema": { ... },
  "data": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "valid": true
}
```

Oder bei Fehlern:
```json
{
  "success": false,
  "valid": false,
  "errors": [
    {
      "path": "to",
      "message": "Required field missing"
    }
  ]
}
```

---

### Events Stream (SSE)

```http
GET /api/events/stream
```

**Response:** Server-Sent Events Stream

```
event: run.started
data: {"runId": "123", "status": "running"}

event: node.started
data: {"runId": "123", "nodeId": "node-1", "nodeType": "llm"}

event: node.completed
data: {"runId": "123", "nodeId": "node-1", "output": {...}}

event: run.completed
data: {"runId": "123", "status": "completed", "output": {...}}
```

---

### Functions API

#### Verfügbare Functions abrufen

```http
GET /api/functions
```

**Response:**
```json
[
  {
    "name": "send_email",
    "description": "Send an email",
    "parameters": {
      "type": "object",
      "properties": {
        "to": { "type": "string" },
        "subject": { "type": "string" },
        "body": { "type": "string" }
      }
    }
  }
]
```

---

### MCP Handlers API

#### Verfügbare MCP Handler abrufen

```http
GET /api/mcp-handlers
```

**Response:**
```json
[
  {
    "id": "gmail",
    "name": "Gmail",
    "description": "Gmail MCP Handler",
    "defaultConfig": {},
    "metadata": {}
  }
]
```

**Verfügbare MCP Handler:**
- Gmail, Outlook Email
- Google Calendar, Outlook Calendar
- Google Drive, Dropbox, SharePoint
- Stripe, PayPal, Square, Plaid
- HubSpot, Intercom, Shopify
- Box, Teams, Pipedream, Zapier
- Und mehr...

---

### Web Search Handlers API

#### Verfügbare Web Search Handler abrufen

```http
GET /api/web-search-handlers
```

**Response:**
```json
[
  {
    "id": "serper",
    "name": "Serper",
    "description": "Serper Web Search",
    "defaultConfig": {},
    "metadata": {}
  }
]
```

---

### Node Processors API

#### Verfügbare Node Processors abrufen

```http
GET /api/node-processors
```

**Response:**
```json
[
  {
    "type": "llm",
    "name": "LLM Processor",
    "description": "Processes LLM nodes"
  }
]
```

---

### Tool Creators API

#### Verfügbare Tool Creators abrufen

```http
GET /api/tool-creators
```

**Response:**
```json
[
  {
    "type": "function",
    "name": "Function Tool",
    "description": "Creates function tools"
  }
]
```

---

### OpenAI Files API

#### File hochladen

```http
POST /api/openai/files/upload
Content-Type: application/json

{
  "fileName": "document.pdf",
  "fileContent": "base64-encoded-content",
  "purpose": "assistants",
  "tenantId": "507f191e810c19729de860ea"
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file-abc123",
    "object": "file",
    "bytes": 12345,
    "created_at": 1704112000,
    "filename": "document.pdf",
    "purpose": "assistants"
  }
}
```

---

#### File Information abrufen

```http
POST /api/openai/files/info
Content-Type: application/json

{
  "fileIds": ["file-abc123", "file-def456"],
  "tenantId": "507f191e810c19729de860ea"
}
```

---

#### File löschen

```http
DELETE /api/openai/files/:fileId
Content-Type: application/json

{
  "tenantId": "507f191e810c19729de860ea"
}
```

---

### OpenAI Vector Stores API

#### Vector Store erstellen

```http
POST /api/openai/vector-stores/create
Content-Type: application/json

{
  "name": "My Vector Store",
  "tenantId": "507f191e810c19729de860ea"
}
```

---

#### Files zu Vector Store hinzufügen

```http
POST /api/openai/vector-stores/:vectorStoreId/files
Content-Type: application/json

{
  "fileIds": ["file-abc123"],
  "tenantId": "507f191e810c19729de860ea"
}
```

---

#### Files in Vector Store auflisten

```http
GET /api/openai/vector-stores/:vectorStoreId/files?tenantId=507f191e810c19729de860ea&limit=100
```

---

#### Vector Store Information abrufen

```http
GET /api/openai/vector-stores/:vectorStoreId?tenantId=507f191e810c19729de860ea
```

---

#### File aus Vector Store entfernen

```http
DELETE /api/openai/vector-stores/:vectorStoreId/files/:fileId?tenantId=507f191e810c19729de860ea
```

---

#### Vector Store löschen

```http
DELETE /api/openai/vector-stores/:vectorStoreId
Content-Type: application/json

{
  "tenantId": "507f191e810c19729de860ea"
}
```

---

### Admin Endpoints

#### Cleanup manuell auslösen

```http
POST /api/admin/cleanup
Content-Type: application/json

{
  "retentionDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed",
  "deleted": {
    "executions": 150,
    "runs": 200
  },
  "retentionDays": 30
}
```

---

## 📝 Request/Response-Beispiele

### Workflow ausführen

**Request:**
```http
POST /v1/workflows/507f1f77bcf86cd799439011/runs
Content-Type: application/json

{
  "input": {
    "userPrompt": "Summarize this document",
    "document": "base64-encoded-document"
  },
  "options": {
    "stream": false,
    "background": false,
    "store": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "507f1f77bcf86cd799439012",
    "workflowId": "507f1f77bcf86cd799439011",
    "status": "running",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Run Status abrufen

**Request:**
```http
GET /v1/runs/507f1f77bcf86cd799439012/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "507f1f77bcf86cd799439012",
    "status": "completed",
    "progress": 100,
    "currentNode": null,
    "output": {
      "summary": "This document discusses..."
    },
    "error": null,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "completedAt": "2024-01-01T12:00:05.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Workflow execution failed",
  "details": {
    "nodeId": "node-1",
    "nodeType": "llm",
    "error": "OpenAI API error: Rate limit exceeded"
  }
}
```

---

## 🏗️ Architektur

### Service-Kommunikation

```
API Service / Frontend
  ↓ HTTP POST /v1/workflows/:id/runs
Execution Service
  ↓ Workflow Processing
  ├── Node Execution
  ├── Expression Resolution
  ├── Secret Loading (via Secrets Service)
  └── Result Storage
  ↓ Response / SSE Events
Client
```

### Storage & Queues

- **MongoDB:** Run History, Execution Storage
- **Redis:** Caching, State Management
- **RabbitMQ:** Background Job Queue

### Node Processing Flow

```
1. Workflow empfangen
2. Start Node identifizieren
3. Für jeden Node:
   a. Input validieren
   b. Expressions auflösen
   c. Secrets laden
   d. Node ausführen
   e. Output speichern
   f. Nächsten Node bestimmen
4. Workflow abschließen
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
  "version": "2.0.0",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "rabbitmq": "connected"
  }
}
```

**Status Codes:**
- `200` - Service ist gesund, alle Services verbunden
- `500` - Service hat Probleme

---

## 🛠️ Development

### Logging

Der Service nutzt **Console Logging** (kann auf Pino migriert werden):

```typescript
console.log('🚀 Starting Execution Service...');
console.error('❌ Failed to start server:', error);
```

### Testing

```bash
# Tests ausführen (wenn vorhanden)
pnpm test
```

### Code Structure

```
execution-service/
├── src/
│   ├── config/              # Configuration
│   ├── controllers/         # Request Handler
│   │   ├── executionController.ts
│   │   ├── workflowRunController.ts
│   │   ├── schemaController.ts
│   │   └── eventsController.ts
│   ├── services/            # Business Logic
│   │   ├── executionService.ts
│   │   ├── workflowService.ts
│   │   ├── queueService.ts
│   │   ├── redisService.ts
│   │   ├── cleanupService.ts
│   │   └── ...
│   ├── routes/              # Route Definitions
│   │   ├── workflowRunRoutes.ts
│   │   ├── executionRoutes.ts
│   │   └── schemaRoutes.ts
│   ├── nodes/               # Node Processors
│   ├── functions/           # Function Handlers
│   ├── mcp/                 # MCP Handlers
│   ├── webSearch/           # Web Search Handlers
│   ├── tools/               # Tool Creators
│   ├── models/              # Data Models
│   └── shared/              # Shared Utilities
├── dist/                    # Compiled JavaScript
└── package.json
```

---

## 🚢 Deployment

### Docker

```bash
# Build
docker build -t monshyflow-execution-service -f packages/execution-service/Dockerfile .

# Run
docker run -p 5004:5004 \
  -e MONGODB_URL=mongodb://mongo:27017/MonshyFlow \
  -e REDIS_URL=redis://redis:6379 \
  -e RABBITMQ_URL=amqp://rabbitmq:5672 \
  -e SECRETS_SERVICE_URL=http://secrets-service:80 \
  -e INTERNAL_SERVICE_KEY=your-service-key \
  monshyflow-execution-service
```

### Docker Compose

Der Service ist Teil der `docker-compose.yml` im Root-Verzeichnis.

### Azure Container Apps

Der Service ist für Azure Container Apps konfiguriert:

- **Port:** 5004 (intern)
- **Health Check:** `/health`
- **Service Discovery:** Automatisch über interne Namen

### Graceful Shutdown

Der Service unterstützt graceful shutdown:
- Bei `SIGINT` werden alle Verbindungen geschlossen
- Laufende Workflows werden nicht unterbrochen
- Cleanup Service wird gestoppt

### ⚠️ Production Checklist

- [ ] `MONGODB_URL` korrekt konfiguriert
- [ ] `REDIS_URL` korrekt konfiguriert
- [ ] `RABBITMQ_URL` korrekt konfiguriert
- [ ] `SECRETS_SERVICE_URL` korrekt konfiguriert
- [ ] `INTERNAL_SERVICE_KEY` stark und zufällig
- [ ] `NODE_ENV=production`
- [ ] `EXECUTION_RETENTION_DAYS` angemessen gesetzt
- [ ] `CLEANUP_INTERVAL_MS` konfiguriert
- [ ] Monitoring für fehlgeschlagene Executions
- [ ] Redis & RabbitMQ High Availability

---

## 🔗 Weitere Informationen

- **Agent SDK:** Siehe [`AGENTS_SDK_README.md`](./AGENTS_SDK_README.md)
- **Packages Overview:** Siehe [`../README.md`](../README.md)
- **OpenAI Agents SDK:** [github.com/openai/agents](https://github.com/openai/agents)
- **MCP Documentation:** [modelcontextprotocol.io](https://modelcontextprotocol.io/)

---

## 📄 Lizenz

Siehe Root-Repository für Lizenzinformationen.

