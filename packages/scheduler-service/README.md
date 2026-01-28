# ⏰ Scheduler Service

The **Scheduler Service** manages scheduled workflow executions based on cron expressions. It regularly checks for due workflows and triggers their execution via the Execution Service.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Cron Expressions](#-cron-expressions)
- [Environment Variables](#-environment-variables)
- [Setup & Installation](#-setup--installation)
- [API-Endpoints](#-api-endpoints)
- [Request/Response Examples](#-requestresponse-examples)
- [Scheduling Flow](#-scheduling-flow)
- [Health Checks](#-health-checks)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Overview

The Scheduler Service is an **Express.js-based HTTP service** that runs on port **5005** (configurable). It provides:

- **Cron-based Scheduling:** Workflows can be scheduled with cron expressions
- **Automatic Execution:** Checks every 1 minute for due workflows
- **Timezone Support:** Supports various timezones
- **Workflow Management:** Register, unregister, and status query for scheduled workflows
- **Cron Validation:** Validates cron expressions before saving

---

## ✨ Features

### Scheduling
- ✅ Cron Expression Parsing (via `cron-parser`)
- ✅ Timezone Support
- ✅ Automatic workflow execution
- ✅ Next run time calculation
- ✅ Enable/Disable Scheduling
- ✅ Workflow Status Tracking

### Workflow Management
- ✅ Register workflow
- ✅ Unregister workflow
- ✅ Get status
- ✅ List all scheduled workflows
- ✅ Automatic loading on startup

### Security
- ✅ JWT Authentication
- ✅ Rate Limiting
- ✅ Security Headers (Helmet)
- ✅ CORS Configuration
- ✅ Request ID for tracing

---

## 📅 Cron Expressions

### Format

Cron expressions follow the standard format:

```
┌───────────── Minute (0 - 59)
│ ┌───────────── Hour (0 - 23)
│ │ ┌───────────── Day of month (1 - 31)
│ │ │ ┌───────────── Month (1 - 12)
│ │ │ │ ┌───────────── Day of week (0 - 6) (Sunday = 0)
│ │ │ │ │
* * * * *
```

### Examples

| Cron Expression | Description |
|----------------|--------------|
| `0 * * * *` | Every hour (minute 0) |
| `0 0 * * *` | Daily at midnight |
| `0 9 * * 1-5` | Weekdays at 9:00 AM |
| `*/15 * * * *` | Every 15 minutes |
| `0 0 1 * *` | First day of every month at midnight |
| `0 0 * * 0` | Every Sunday at midnight |
| `0 9,17 * * *` | Daily at 9:00 AM and 5:00 PM |

### Timezone Support

Cron expressions can be used with different timezones:

```json
{
  "cronExpression": "0 9 * * *",
  "timezone": "Europe/Berlin"
}
```

Supported timezones:
- `UTC` (Standard)
- `Europe/Berlin`
- `America/New_York`
- `Asia/Tokyo`
- Alle IANA Timezone Names

---

## 🔧 Environment Variables

### Required Variables

```bash
# Port (Default: 5005)
PORT=5005

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/monshyflow

# Execution Service URL
EXECUTION_SERVICE_URL=http://localhost:5004

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Auth Service URL (for token validation)
AUTH_SERVICE_URL=http://localhost:5002

# Node Environment
NODE_ENV=development  # or production
```

### Optional Variables

```bash
# Azure Container Apps
AZURE_CONTAINER_APPS_ENVIRONMENT=your-environment-name

# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Scheduler Check Interval (optional, default: 60000ms = 1 minute)
SCHEDULER_CHECK_INTERVAL_MS=60000
```

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- MongoDB (local or remote)
- Execution Service must be running

### Installation

```bash
# In the root directory
pnpm install

# Build packages
pnpm build:packages
```

### Start Development

```bash
# In the scheduler-service directory
cd packages/scheduler-service
pnpm dev

# Or from root
pnpm --filter @monshy/scheduler-service dev
```

### Production Build

```bash
cd packages/scheduler-service
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
  "service": "scheduler-service",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### Protected Endpoints (JWT Authentication required)

#### Register workflow

```http
POST /api/scheduler/workflows/:workflowId/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "cronExpression": "0 9 * * *",
  "timezone": "Europe/Berlin",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow scheduled"
}
```

**Validation:**
- `cronExpression`: Required, must be valid
- `timezone`: Optional, default: `UTC`
- `enabled`: Optional, default: `true`

---

#### Unregister workflow

```http
POST /api/scheduler/workflows/:workflowId/unregister
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow unscheduled"
}
```

---

#### Get workflow status

```http
GET /api/scheduler/workflows/:workflowId/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflowId": "507f1f77bcf86cd799439011",
    "cronExpression": "0 9 * * *",
    "timezone": "Europe/Berlin",
    "enabled": true,
    "lastRunAt": "2024-01-01T08:00:00.000Z",
    "nextRunAt": "2024-01-02T08:00:00.000Z",
    "runCount": 5
  }
}
```

---

#### Get all scheduled workflows

```http
GET /api/scheduler/workflows
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "workflowId": "507f1f77bcf86cd799439011",
      "cronExpression": "0 9 * * *",
      "timezone": "Europe/Berlin",
      "enabled": true,
      "lastRunAt": "2024-01-01T08:00:00.000Z",
      "nextRunAt": "2024-01-02T08:00:00.000Z",
      "runCount": 5
    }
  ]
}
```

---

#### Validate cron expression

```http
POST /api/scheduler/validate-cron
Authorization: Bearer {token}
Content-Type: application/json

{
  "cronExpression": "0 9 * * *"
}
```

**Response (valid):**
```json
{
  "success": true,
  "valid": true
}
```

**Response (invalid):**
```json
{
  "success": false,
  "valid": false,
  "error": "Invalid cron expression: ..."
}
```

---

#### Calculate next run time

```http
POST /api/scheduler/next-run-time
Authorization: Bearer {token}
Content-Type: application/json

{
  "cronExpression": "0 9 * * *",
  "timezone": "Europe/Berlin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nextRunAt": "2024-01-02T08:00:00.000Z"
  }
}
```

---

## 📝 Request/Response Examples

### Register workflow

**Request:**
```http
POST /api/scheduler/workflows/507f1f77bcf86cd799439011/register
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "cronExpression": "0 9 * * 1-5",
  "timezone": "Europe/Berlin",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow scheduled"
}
```

### Get workflow status

**Request:**
```http
GET /api/scheduler/workflows/507f1f77bcf86cd799439011/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflowId": "507f1f77bcf86cd799439011",
    "cronExpression": "0 9 * * 1-5",
    "timezone": "Europe/Berlin",
    "enabled": true,
    "lastRunAt": "2024-01-01T08:00:00.000Z",
    "nextRunAt": "2024-01-02T08:00:00.000Z",
    "runCount": 12
  }
}
```

### Validate cron expression

**Request:**
```http
POST /api/scheduler/validate-cron
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "cronExpression": "*/15 * * * *"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true
}
```

### Error Response

```json
{
  "success": false,
  "error": "Invalid cron expression: Unexpected end of expression"
}
```

---

## 🔄 Scheduling Flow

### 1. Register Workflow

```
Client
  ↓ POST /api/scheduler/workflows/:id/register
Scheduler Service
  ↓ Validation (Cron Expression)
  ↓ Calculate next run time
  ↓ Store in memory map
  ↓ Store in database
  ↓ Response
```

### 2. Automatic Execution

```
Scheduler Service (every minute)
  ↓ Check all scheduled workflows
  ↓ For each workflow:
    - Is nextRunAt <= now?
    - Is enabled = true?
  ↓ If yes:
    - Execute workflow via Execution Service
    - Update lastRunAt
    - Recalculate nextRunAt
    - Increment runCount
```

### 3. Workflow Execution

```
Scheduler Service
  ↓ HTTP POST to Execution Service
Execution Service
  ↓ Execute workflow
  ↓ Response
Scheduler Service
  ↓ Update status
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
  "service": "scheduler-service",
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

logger.info({ workflowId: '123', cronExpression: '0 9 * * *' }, 'Workflow scheduled');
logger.error({ err: error, workflowId: '123' }, 'Failed to execute scheduled workflow');
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
scheduler-service/
├── src/
│   ├── controllers/      # Request Handler
│   │   └── SchedulerController.ts
│   ├── services/         # Business Logic
│   │   └── SchedulerService.ts
│   ├── repositories/     # Data Access
│   ├── middleware/       # Express Middleware
│   └── routes/           # Route Definitions
├── dist/                 # Compiled JavaScript
└── package.json
```

### Scheduler Check Interval

The service checks **every 1 minute** (60000ms) for due workflows by default. This can be adjusted via `SCHEDULER_CHECK_INTERVAL_MS`.

**Note:** A shorter interval increases accuracy but also the load on the database.

---

## 🚢 Deployment

### Docker

```bash
# Build
docker build -t monshyflow-scheduler-service -f packages/scheduler-service/Dockerfile .

# Run
docker run -p 5005:80 \
  -e MONGODB_URI=mongodb://mongo:27017/monshyflow \
  -e EXECUTION_SERVICE_URL=http://execution-service:80 \
  -e AUTH_SERVICE_URL=http://auth-service:80 \
  -e FRONTEND_URL=https://app.monshyflow.com \
  monshyflow-scheduler-service
```

### Docker Compose

The service is part of `docker-compose.yml` in the root directory.

### Azure Container Apps

The service is configured for Azure Container Apps:

- **Port:** 80 (intern)
- **Health Check:** `/health`
- **Service Discovery:** Automatically via internal names

### Graceful Shutdown

The service supports graceful shutdown:
- On `SIGTERM`, the scheduler is stopped
- Running workflow executions are not interrupted
- Service shuts down cleanly

### ⚠️ Production Checklist

- [ ] `EXECUTION_SERVICE_URL` correctly configured
- [ ] `AUTH_SERVICE_URL` correctly configured
- [ ] `NODE_ENV=production`
- [ ] Rate limiting enabled
- [ ] Security headers enabled
- [ ] CORS correctly configured
- [ ] Scheduler check interval appropriate (default: 1 minute)
- [ ] Monitoring for failed workflow executions

---

## 🔗 Further Information

- **Cron Parser:** [node-cron-parser](https://github.com/harrisiirak/cron-parser)
- **Execution Service:** See `execution-service` README
- **Packages Overview:** See [`../README.md`](../README.md)

---

## 📄 License

See root repository for license information.

