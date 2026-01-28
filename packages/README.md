# 📦 Packages Overview

Dieses Verzeichnis enthält alle **Shared Packages** und **Microservices** für die MonshyFlow-Plattform. Die Architektur basiert auf einem **Monorepo** mit **pnpm Workspaces** und folgt dem **Microservices-Pattern** mit getrennten, unabhängig deploybaren Services.

---

## 📋 Inhaltsverzeichnis

- [Shared Packages](#-shared-packages)
- [Services](#-services)
- [Quick Start](#-quick-start)
- [Entwicklung](#-entwicklung)
- [Architektur](#-architektur)

---

## 🔧 Shared Packages

Shared Packages sind wiederverwendbare Libraries, die von mehreren Services genutzt werden. Sie werden als npm Packages mit `workspace:*` Dependencies verwaltet.

### `@monshy/core`

**Basis-Utilities Package** - Enthält gemeinsame Funktionalitäten für alle Services.

**Funktionen:**
- Logger (Pino-basiert)
- Error Classes (`AppError`, `ValidationError`, etc.)
- Validation Utilities (Zod)
- Security Middleware (Helmet, Rate Limiting)
- Type Definitions
- Constants

**Dependencies:**
- `zod` - Schema Validation
- `pino` / `pino-pretty` - Logging
- `express-rate-limit` - Rate Limiting
- `helmet` - Security Headers

**Verwendung:**
```typescript
import { logger } from '@monshy/core';
import { AppError } from '@monshy/core';
import { securityHeaders } from '@monshy/core';
```

---

### `@monshy/database`

**Database Package** - MongoDB Models, Repositories und Connection Management.

**Funktionen:**
- Mongoose Models (Workflow, User, Tenant, etc.)
- Database Connection Management
- Repository Pattern Implementation
- Database Utilities

**Dependencies:**
- `@monshy/core` - Shared Utilities
- `mongoose` - MongoDB ODM

**Verwendung:**
```typescript
import { connectDatabase } from '@monshy/database';
import { Workflow, User } from '@monshy/database';
```

---

### `@monshy/auth`

**Authentication Package** - JWT und API Key Utilities, Auth Middleware.

**Funktionen:**
- JWT Token Generation & Verification
- API Key Management
- Authentication Middleware
- Password Hashing (bcrypt)

**Dependencies:**
- `@monshy/core` - Shared Utilities
- `jsonwebtoken` - JWT Handling
- `bcrypt` - Password Hashing

**Verwendung:**
```typescript
import { generateToken, verifyToken } from '@monshy/auth';
import { authenticate } from '@monshy/auth';
```

---

## 🚀 Services

Services sind eigenständige HTTP-Services (Express.js), die auf verschiedenen Ports laufen und über HTTP kommunizieren.

### `@monshy/api-service` (Port: 5000)

**API Service** - Zentraler Service für Gateway-Funktionalität und Workflow Management.

**Funktionen:**
- **API Gateway:** Routet Requests zu den verschiedenen Services (http-proxy-middleware)
- **Workflow Management:** CRUD Operations für Workflows
- **Swagger UI:** API-Dokumentation unter `/api-docs`
- **Admin Functions:** Tenant Management, Audit Logs, OAuth2

**Dependencies:**
- `@monshy/core`, `@monshy/database`, `@monshy/auth`
- `express`, `tsyringe` (Dependency Injection)
- `http-proxy-middleware` (Gateway)
- `swagger-ui-express` (API Docs)

**Endpoints:**
- `/api/workflows/*` - Workflow Management
- `/api/admin/*` - Admin Functions
- `/api-docs` - Swagger UI

---

### `@monshy/auth-service` (Port: 5002)

**Authentication & Authorization Service** - Verwaltet Benutzerauthentifizierung und Autorisierung.

**Funktionen:**
- User Registration & Login
- JWT Token Management
- API Key Management
- Password Reset

**Dependencies:**
- `@monshy/core`, `@monshy/database`, `@monshy/auth`
- `express`, `tsyringe`

**Endpoints:**
- `/api/auth/register` - User Registration
- `/api/auth/login` - User Login
- `/api/auth/api-keys/*` - API Key Management

---

### `execution-service` (Port: 5004)

**Workflow Execution Service** - Führt Workflows aus und verarbeitet Node-Operationen.

**Funktionen:**
- Node Execution (LLM, HTTP, Code, Transform, etc.)
- Agent SDK Integration (OpenAI Agents)
- MCP (Model Context Protocol) Support
- Web Search Integration
- Email Sending

**Dependencies:**
- `@monshy/core`
- `mongoose` (direkt, nicht über @monshy/database)
- `express`, `openai`, `axios`
- `redis` (Caching)
- `amqplib` (Message Queue)

**Endpoints:**
- `/api/execute/*` - Workflow Execution
- `/api/nodes/*` - Node Operations

---

### `@monshy/scheduler-service` (Port: 5005)

**Workflow Scheduling Service** - Plant und verwaltet geplante Workflows.

**Funktionen:**
- Cron-basierte Scheduling
- Workflow Trigger Management
- Scheduled Execution Coordination

**Dependencies:**
- `@monshy/core`, `@monshy/database`, `@monshy/auth`
- `express`, `tsyringe`
- `cron-parser` - Cron Expression Parsing

**Endpoints:**
- `/api/scheduler/workflows/*` - Schedule Management

---

### `@monshy/secrets-service` (Port: 5003)

**Secrets Management Service** - Verwaltet verschlüsselte Secrets für Workflows.

**Funktionen:**
- Secure Secret Storage
- Encryption/Decryption
- Secret Rotation

**Dependencies:**
- `@monshy/core`, `@monshy/database`, `@monshy/auth`
- `express`, `tsyringe`
- `bcrypt` - Encryption

**Endpoints:**
- `/api/secrets/*` - Secret Management

---

## 🚀 Quick Start

### Voraussetzungen

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- MongoDB (lokal oder Remote)

### Installation

```bash
# Dependencies installieren
pnpm install

# Alle Packages bauen
pnpm build:packages
```

### Services starten

```bash
# Alle Services im Development-Modus starten
pnpm dev

# Oder einzelne Services
cd packages/api-service && pnpm dev
cd packages/auth-service && pnpm dev
```

### Testing

```bash
# Alle Tests ausführen
pnpm test

# Tests für ein spezifisches Package
cd packages/api-service && pnpm test
```

---

## 📝 Entwicklung

### Neues Package erstellen

```bash
# Package-Verzeichnis erstellen
mkdir packages/my-package
cd packages/my-package

# package.json initialisieren
pnpm init

# Workspace-Dependency hinzufügen (in package.json)
{
  "name": "@monshy/my-package",
  "dependencies": {
    "@monshy/core": "workspace:*"
  }
}
```

### Package verwenden

```typescript
// In einem Service
import { AppError } from '@monshy/core';
import { connectDatabase } from '@monshy/database';
import { generateToken } from '@monshy/auth';
```

### Build-Prozess

```bash
# Alle Packages bauen
pnpm build:packages

# Einzelnes Package bauen
cd packages/core && pnpm build
```

---

## 🏗️ Architektur

### Monorepo-Struktur

```
packages/
├── core/           # Shared Utilities
├── database/       # Database Models
├── auth/           # Auth Utilities
├── api-service/    # API Gateway + Workflow Management
├── auth-service/   # Authentication Service
├── execution-service/  # Workflow Execution
├── scheduler-service/  # Scheduling
└── secrets-service/   # Secrets Management
```

### Service-Kommunikation

- **HTTP/REST:** Services kommunizieren über HTTP
- **Message Queue:** Für asynchrone Operationen (RabbitMQ/AMQP)
- **Database:** Shared MongoDB über `@monshy/database`

### Dependency Graph

```
Services
  ├── @monshy/core (Basis)
  ├── @monshy/database (Models)
  └── @monshy/auth (Auth Utils)
```

---

## 🔗 Weitere Informationen

- **Gateway Details:** Siehe [`api-service/src/gateway/README.md`](./api-service/src/gateway/README.md)
- **Service Ports (extern, lokal):** 
  - API Service: `:5000` (über Kong Gateway)
  - Auth Service: `:5002`
  - Execution Service: `:5004`
  - Scheduler Service: `:5005`
  - Secrets Service: `:5003`
  
**Hinweis:** In Docker/Production laufen Services intern auf Port 80 (außer execution-service auf 5004) und werden über Service Discovery erreicht.

---

## 📄 Lizenz

Siehe Root-Repository für Lizenzinformationen.
