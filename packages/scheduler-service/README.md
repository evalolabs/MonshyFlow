# ⏰ Scheduler Service

Der **Scheduler Service** verwaltet geplante Workflow-Ausführungen basierend auf Cron-Expressions. Er prüft regelmäßig nach fälligen Workflows und triggert deren Ausführung über den Execution Service.

---

## 📋 Inhaltsverzeichnis

- [Übersicht](#-übersicht)
- [Features](#-features)
- [Cron Expressions](#-cron-expressions)
- [Environment Variables](#-environment-variables)
- [Setup & Installation](#-setup--installation)
- [API-Endpoints](#-api-endpoints)
- [Request/Response-Beispiele](#-requestresponse-beispiele)
- [Scheduling Flow](#-scheduling-flow)
- [Health Checks](#-health-checks)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Übersicht

Der Scheduler Service ist ein **Express.js-basierter HTTP-Service**, der auf Port **5005** läuft (konfigurierbar). Er bietet:

- **Cron-basiertes Scheduling:** Workflows können mit Cron-Expressions geplant werden
- **Automatische Ausführung:** Prüft alle 1 Minute nach fälligen Workflows
- **Timezone Support:** Unterstützt verschiedene Zeitzonen
- **Workflow Management:** Registrieren, Abmelden und Status-Abfrage von geplanten Workflows
- **Cron Validation:** Validiert Cron-Expressions vor dem Speichern

---

## ✨ Features

### Scheduling
- ✅ Cron Expression Parsing (via `cron-parser`)
- ✅ Timezone Support
- ✅ Automatische Workflow-Ausführung
- ✅ Next Run Time Berechnung
- ✅ Enable/Disable Scheduling
- ✅ Workflow Status Tracking

### Workflow Management
- ✅ Workflow Registrieren
- ✅ Workflow Abmelden
- ✅ Status abrufen
- ✅ Alle geplanten Workflows auflisten
- ✅ Automatisches Laden beim Start

### Security
- ✅ JWT Authentication
- ✅ Rate Limiting
- ✅ Security Headers (Helmet)
- ✅ CORS Configuration
- ✅ Request ID für Tracing

---

## 📅 Cron Expressions

### Format

Cron-Expressions folgen dem Standard-Format:

```
┌───────────── Minute (0 - 59)
│ ┌───────────── Stunde (0 - 23)
│ │ ┌───────────── Tag des Monats (1 - 31)
│ │ │ ┌───────────── Monat (1 - 12)
│ │ │ │ ┌───────────── Wochentag (0 - 6) (Sonntag = 0)
│ │ │ │ │
* * * * *
```

### Beispiele

| Cron Expression | Beschreibung |
|----------------|--------------|
| `0 * * * *` | Jede Stunde (Minute 0) |
| `0 0 * * *` | Täglich um Mitternacht |
| `0 9 * * 1-5` | Werktags um 9:00 Uhr |
| `*/15 * * * *` | Alle 15 Minuten |
| `0 0 1 * *` | Am 1. jedes Monats um Mitternacht |
| `0 0 * * 0` | Jeden Sonntag um Mitternacht |
| `0 9,17 * * *` | Täglich um 9:00 und 17:00 Uhr |

### Timezone Support

Cron-Expressions können mit verschiedenen Zeitzonen verwendet werden:

```json
{
  "cronExpression": "0 9 * * *",
  "timezone": "Europe/Berlin"
}
```

Unterstützte Zeitzonen:
- `UTC` (Standard)
- `Europe/Berlin`
- `America/New_York`
- `Asia/Tokyo`
- Alle IANA Timezone Names

---

## 🔧 Environment Variables

### Erforderliche Variablen

```bash
# Port (Standard: 5005)
PORT=5005

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/monshyflow

# Execution Service URL
EXECUTION_SERVICE_URL=http://localhost:5004

# Frontend URL (für CORS)
FRONTEND_URL=http://localhost:5173

# Auth Service URL (für Token-Validierung)
AUTH_SERVICE_URL=http://localhost:5002

# Node Environment
NODE_ENV=development  # oder production
```

### Optionale Variablen

```bash
# Azure Container Apps
AZURE_CONTAINER_APPS_ENVIRONMENT=your-environment-name

# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Scheduler Check Interval (optional, Standard: 60000ms = 1 Minute)
SCHEDULER_CHECK_INTERVAL_MS=60000
```

---

## 🚀 Setup & Installation

### Voraussetzungen

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- MongoDB (lokal oder Remote)
- Execution Service muss laufen

### Installation

```bash
# Im Root-Verzeichnis
pnpm install

# Packages bauen
pnpm build:packages
```

### Development starten

```bash
# Im scheduler-service Verzeichnis
cd packages/scheduler-service
pnpm dev

# Oder vom Root
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

### Protected Endpoints (JWT Authentication erforderlich)

#### Workflow registrieren

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

**Validierung:**
- `cronExpression`: Erforderlich, muss gültig sein
- `timezone`: Optional, Standard: `UTC`
- `enabled`: Optional, Standard: `true`

---

#### Workflow abmelden

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

#### Workflow Status abrufen

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

#### Alle geplanten Workflows abrufen

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

#### Cron Expression validieren

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

#### Next Run Time berechnen

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

## 📝 Request/Response-Beispiele

### Workflow registrieren

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

### Workflow Status abrufen

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

### Cron Expression validieren

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

### 1. Workflow registrieren

```
Client
  ↓ POST /api/scheduler/workflows/:id/register
Scheduler Service
  ↓ Validierung (Cron Expression)
  ↓ Next Run Time berechnen
  ↓ In Memory Map speichern
  ↓ In Database speichern
  ↓ Response
```

### 2. Automatische Ausführung

```
Scheduler Service (jede Minute)
  ↓ Prüfe alle geplanten Workflows
  ↓ Für jeden Workflow:
    - Ist nextRunAt <= jetzt?
    - Ist enabled = true?
  ↓ Wenn ja:
    - Workflow über Execution Service ausführen
    - lastRunAt aktualisieren
    - nextRunAt neu berechnen
    - runCount erhöhen
```

### 3. Workflow Ausführung

```
Scheduler Service
  ↓ HTTP POST zu Execution Service
Execution Service
  ↓ Workflow ausführen
  ↓ Response
Scheduler Service
  ↓ Status aktualisieren
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
- `200` - Service ist gesund
- `500` - Service hat Probleme

---

## 🛠️ Development

### Logging

Der Service nutzt **Pino** für strukturiertes Logging:

```typescript
import { logger } from '@monshy/core';

logger.info({ workflowId: '123', cronExpression: '0 9 * * *' }, 'Workflow scheduled');
logger.error({ err: error, workflowId: '123' }, 'Failed to execute scheduled workflow');
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

Der Service prüft standardmäßig **alle 1 Minute** (60000ms) nach fälligen Workflows. Dies kann über `SCHEDULER_CHECK_INTERVAL_MS` angepasst werden.

**Hinweis:** Ein kürzeres Intervall erhöht die Genauigkeit, aber auch die Last auf die Datenbank.

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

Der Service ist Teil der `docker-compose.yml` im Root-Verzeichnis.

### Azure Container Apps

Der Service ist für Azure Container Apps konfiguriert:

- **Port:** 80 (intern)
- **Health Check:** `/health`
- **Service Discovery:** Automatisch über interne Namen

### Graceful Shutdown

Der Service unterstützt graceful shutdown:
- Bei `SIGTERM` wird der Scheduler gestoppt
- Laufende Workflow-Ausführungen werden nicht unterbrochen
- Service beendet sich sauber

### ⚠️ Production Checklist

- [ ] `EXECUTION_SERVICE_URL` korrekt konfiguriert
- [ ] `AUTH_SERVICE_URL` korrekt konfiguriert
- [ ] `NODE_ENV=production`
- [ ] Rate Limiting aktiviert
- [ ] Security Headers aktiviert
- [ ] CORS korrekt konfiguriert
- [ ] Scheduler Check Interval angemessen (Standard: 1 Minute)
- [ ] Monitoring für fehlgeschlagene Workflow-Ausführungen

---

## 🔗 Weitere Informationen

- **Cron Parser:** [node-cron-parser](https://github.com/harrisiirak/cron-parser)
- **Execution Service:** Siehe `execution-service` README
- **Packages Overview:** Siehe [`../README.md`](../README.md)

---

## 📄 Lizenz

Siehe Root-Repository für Lizenzinformationen.

