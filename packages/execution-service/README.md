# ⚙️ Execution Service

The **Execution Service** is the core of the MonshyFlow platform. It executes workflows, processes node operations, and integrates various services such as OpenAI Agents, MCP (Model Context Protocol), Web Search, and more.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Environment Variables](#-environment-variables)
- [Setup & Installation](#-setup--installation)
- [API-Endpoints](#-api-endpoints)
- [Request/Response Examples](#-requestresponse-examples)
- [Architecture](#-architecture)
- [Health Checks](#-health-checks)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Overview

The Execution Service is an **Express.js-based HTTP service** that runs on port **5004** (default, configurable via `PORT` environment variable). 

**Port Configuration:**
- **Default Port:** Port 5004 (see `src/config/config.ts`: `process.env.PORT || 5004`)
- **Docker Compose:** Port 5004 (see `docker-compose.yml`: `PORT=5004`)
- **Other Services Expect:** Port 5004 (see `api-service` and `scheduler-service` Config)

**Note:** The service runs consistently on port 5004, both locally and in Docker.

It provides:

- **Workflow Execution:** Complete workflow execution with node processing
- **Node Execution:** Single node execution for testing
- **Agent SDK Integration:** OpenAI Agents for intelligent workflows
- **MCP Support:** Model Context Protocol for extended functionality
- **Web Search:** Integration of various web search providers
- **OpenAI Integration:** Files API, Vector Stores, Assistants
- **Schema Validation:** Node schema validation
- **Real-time Events:** SSE (Server-Sent Events) for live updates

---

## ✨ Features

### Workflow Execution
- ✅ Complete workflow execution
- ✅ Node-by-Node Processing
- ✅ Expression Resolution (Variables, Secrets)
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
- ✅ **OpenAI Agents SDK:** Intelligent agent-based workflows
- ✅ **MCP (Model Context Protocol):** 20+ integrated MCP handlers
- ✅ **Web Search:** Serper, OpenAI Web Search
- ✅ **Email:** Nodemailer Integration
- ✅ **OpenAI Files API:** File Upload/Management
- ✅ **OpenAI Vector Stores:** RAG (Retrieval-Augmented Generation)

### Services
- ✅ **Redis:** Caching & State Management
- ✅ **RabbitMQ:** Message Queue for background jobs
- ✅ **MongoDB:** Run Storage & Execution History
- ✅ **Cleanup Service:** Automatic data cleanup

---

## 🔧 Environment Variables

### Required Variables

```bash
# Port (Default: 5004)
PORT=5004

# MongoDB Connection String
MONGODB_URL=mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin

# Redis Connection String
REDIS_URL=redis://localhost:6379

# RabbitMQ Connection String
RABBITMQ_URL=amqp://localhost:5672

# Secrets Service URL (for API Keys)
SECRETS_SERVICE_URL=http://localhost:5003
# or
SECRETS_SERVICE_URL=http://secrets-service:80

# Internal Service Key (for service-to-service communication)
INTERNAL_SERVICE_KEY=internal-service-key-change-in-production

# Node Environment
NODE_ENV=development  # or production
```

### Optional Variables

```bash
# OpenAI API Key (Fallback, normally loaded from Secrets)
OPENAI_API_KEY=sk-...

# Agent Service URL
AGENT_SERVICE_URL=http://localhost:5000

# Cleanup Configuration
EXECUTION_RETENTION_DAYS=30
CLEANUP_RETENTION_DAYS=30
CLEANUP_INTERVAL_MS=86400000  # 24 hours
CLEANUP_RUN_ON_STARTUP=true

# Webhook Secret
WEBHOOK_SECRET=change-me-in-production

# Azure Container Apps
AZURE_CONTAINER_APPS_ENVIRONMENT=your-environment-name
```

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js >= 20.0.0
- MongoDB (local or remote)
- Redis (local or remote)
- RabbitMQ (local or remote)

### Installation

```bash
# In the root directory
pnpm install

# Build packages
pnpm build:packages
```

### Start Development

```bash
# In the execution-service directory
cd packages/execution-service
pnpm dev

# Or from root
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

#### Create and start workflow run

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
- `stream`: boolean - Stream SSE events (default: false)
- `background`: boolean - Execute in background (default: false)
- `store`: boolean - Store run in database (default: true)

---

#### Get workflow runs

```http
GET /v1/workflows/:workflowId/runs
```

**Query Parameters:**
- `limit`: number - Number of runs (default: 10)
- `offset`: number - Offset for pagination

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

#### Get run status

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

**Status Values:**
- `pending` - Waiting for execution
- `running` - Currently running
- `completed` - Successfully completed
- `failed` - Failed
- `cancelled` - Cancelled

---

#### Cancel run

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

#### Execute workflow

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

#### Test node (with context)

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

#### Execute node

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

#### Get node schema

```http
GET /api/schemas/:nodeType/:version
GET /api/schemas/:nodeType/:version/:resource
GET /api/schemas/:nodeType/:version/:resource/:operation
```

**Examples:**
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

#### Get all node types

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

Or on errors:
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

#### Get available functions

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

#### Get available MCP handlers

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

**Available MCP Handlers:**
- Gmail, Outlook Email
- Google Calendar, Outlook Calendar
- Google Drive, Dropbox, SharePoint
- Stripe, PayPal, Square, Plaid
- HubSpot, Intercom, Shopify
- Box, Teams, Pipedream, Zapier
- And more...

---

### Web Search Handlers API

#### Get available web search handlers

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

#### Get available node processors

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

#### Get available tool creators

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

#### Upload file

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

#### Get file information

```http
POST /api/openai/files/info
Content-Type: application/json

{
  "fileIds": ["file-abc123", "file-def456"],
  "tenantId": "507f191e810c19729de860ea"
}
```

---

#### Delete file

```http
DELETE /api/openai/files/:fileId
Content-Type: application/json

{
  "tenantId": "507f191e810c19729de860ea"
}
```

---

### OpenAI Vector Stores API

#### Create vector store

```http
POST /api/openai/vector-stores/create
Content-Type: application/json

{
  "name": "My Vector Store",
  "tenantId": "507f191e810c19729de860ea"
}
```

---

#### Add files to vector store

```http
POST /api/openai/vector-stores/:vectorStoreId/files
Content-Type: application/json

{
  "fileIds": ["file-abc123"],
  "tenantId": "507f191e810c19729de860ea"
}
```

---

#### List files in vector store

```http
GET /api/openai/vector-stores/:vectorStoreId/files?tenantId=507f191e810c19729de860ea&limit=100
```

---

#### Get vector store information

```http
GET /api/openai/vector-stores/:vectorStoreId?tenantId=507f191e810c19729de860ea
```

---

#### Remove file from vector store

```http
DELETE /api/openai/vector-stores/:vectorStoreId/files/:fileId?tenantId=507f191e810c19729de860ea
```

---

#### Delete vector store

```http
DELETE /api/openai/vector-stores/:vectorStoreId
Content-Type: application/json

{
  "tenantId": "507f191e810c19729de860ea"
}
```

---

### Admin Endpoints

#### Trigger cleanup manually

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

## 📝 Request/Response Examples

### Execute workflow

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

### Get run status

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
1. Receive workflow
2. Identify start node
3. For each node:
   a. Validate input
   b. Resolve expressions
   c. Load secrets
   d. Execute node
   e. Store output
   f. Determine next node
4. Complete workflow
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
- `200` - Service is healthy, all services connected
- `500` - Service has issues

---

## 🛠️ Development

### Logging

The service uses **Console Logging** (can be migrated to Pino):

```typescript
console.log('🚀 Starting Execution Service...');
console.error('❌ Failed to start server:', error);
```

### Testing

```bash
# Run tests (if available)
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

The service is part of `docker-compose.yml` in the root directory.

### Azure Container Apps

The service is configured for Azure Container Apps:

- **Port:** 5004 (intern)
- **Health Check:** `/health`
- **Service Discovery:** Automatically via internal names

### Graceful Shutdown

The service supports graceful shutdown:
- On `SIGINT`, all connections are closed
- Running workflows are not interrupted
- Cleanup service is stopped

### ⚠️ Production Checklist

- [ ] `MONGODB_URL` correctly configured
- [ ] `REDIS_URL` correctly configured
- [ ] `RABBITMQ_URL` correctly configured
- [ ] `SECRETS_SERVICE_URL` correctly configured
- [ ] `INTERNAL_SERVICE_KEY` strong and random
- [ ] `NODE_ENV=production`
- [ ] `EXECUTION_RETENTION_DAYS` appropriately set
- [ ] `CLEANUP_INTERVAL_MS` configured
- [ ] Monitoring for failed executions
- [ ] Redis & RabbitMQ High Availability

---

## 🔗 Further Information

- **Agent SDK:** See [`AGENTS_SDK_README.md`](./AGENTS_SDK_README.md)
- **Packages Overview:** See [`../README.md`](../README.md)
- **OpenAI Agents SDK:** [github.com/openai/agents](https://github.com/openai/agents)
- **MCP Documentation:** [modelcontextprotocol.io](https://modelcontextprotocol.io/)

---

## 📄 License

See root repository for license information.

