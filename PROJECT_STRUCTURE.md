# 📁 MonshyFlow - Aktuelle Projektstruktur

**Stand: Nach Cleanup - Node.js-Only Architektur**

---

## 🏗️ Monorepo-Übersicht

```
MonshyFlow/
├── 📦 packages/                    # Shared Packages & Microservices
│   ├── core/                       # @monshy/core - Shared Utilities
│   ├── database/                   # @monshy/database - MongoDB Models
│   ├── auth/                       # @monshy/auth - JWT & API Keys
│   ├── api-service/                # 🌐 API Service (Workflow + Gateway)
│   ├── auth-service/               # 🔐 Auth Service
│   ├── secrets-service/            # 🔒 Secrets Service
│   ├── scheduler-service/          # ⏰ Scheduler Service
│   └── execution-service/          # ⚙️ Execution Service
│
├── 🎨 frontend/                    # React Frontend (Vite + TypeScript)
│
├── 📚 Dokumentation/
│   ├── ARCHITECTURE.md             # Vollständige Architektur
│   ├── SERVICES_OVERVIEW.md        # Service-Übersicht
│   ├── SECURITY.md                 # Security Best Practices
│   └── README.md                   # Haupt-README
│
├── ☁️ azure-deployment/           # Azure Deployment Scripts
├── 📖 DeveloperRoom/               # Entwickler-Dokumentation
├── 📄 Documentation/               # API & Integration Docs
│
├── 🐳 docker-compose.yml          # Docker Compose Konfiguration
├── 📋 package.json                 # Root Package (pnpm Workspace)
├── 📋 pnpm-workspace.yaml          # Workspace Konfiguration
└── ⚙️ tsconfig.base.json           # Base TypeScript Config
```

---

## 📦 Packages (Shared Libraries)

### `@monshy/core`
**Zweck:** Shared Utilities, Types, Errors, Logger, Validation, Security Middleware

**Struktur:**
```
packages/core/
├── src/
│   ├── types/          # Shared TypeScript Types
│   ├── errors/         # Custom Error Classes
│   ├── logger/         # Pino Logger Configuration
│   ├── validation/     # Zod Validation Middleware
│   ├── middleware/     # Security Headers, Rate Limiting
│   ├── utils/          # Utility Functions
│   └── constants/      # Constants
└── package.json
```

### `@monshy/database`
**Zweck:** MongoDB/Cosmos DB Models & Connection

**Struktur:**
```
packages/database/
├── src/
│   ├── models/         # Mongoose Models
│   │   ├── Workflow.ts
│   │   ├── User.ts
│   │   ├── Tenant.ts
│   │   ├── ApiKey.ts
│   │   └── Secret.ts
│   ├── connection.ts   # MongoDB Connection Logic
│   └── repositories/   # Repository Pattern (optional)
└── package.json
```

### `@monshy/auth`
**Zweck:** Authentication Utilities (JWT, API Keys)

**Struktur:**
```
packages/auth/
├── src/
│   ├── jwt/            # JWT Token Generation/Verification
│   ├── apiKey/          # API Key Generation/Hashing
│   └── types/          # Auth Types
└── package.json
```

---

## 🚀 Microservices

### 1. **API Service** (`packages/api-service`)
**Port:** 5001 (local) / 80 (Docker/Azure)  
**Zweck:** 
- Workflow Management (CRUD)
- API Gateway (Routing zu anderen Services)

**Struktur:**
```
packages/api-service/
├── src/
│   ├── controllers/     # WorkflowController
│   ├── services/        # WorkflowService
│   ├── repositories/    # WorkflowRepository
│   ├── routes/         # Express Routes (Workflow + Gateway)
│   ├── gateway/        # Gateway Dokumentation
│   ├── middleware/     # Auth, Security, Logging
│   └── index.ts        # Entry Point
├── Dockerfile          # Multi-Stage Build
└── package.json
```

**Features:**
- ✅ Workflow CRUD Operations
- ✅ Gateway Routing (http-proxy-middleware)
- ✅ Security Middleware (Rate Limiting, Headers, CORS)
- ✅ Request ID Tracking

---

### 2. **Auth Service** (`packages/auth-service`)
**Port:** 5002 (local) / 80 (Docker/Azure)  
**Zweck:** User Authentication, JWT, API Key Management

**Struktur:**
```
packages/auth-service/
├── src/
│   ├── controllers/     # AuthController, ApiKeyController
│   ├── services/        # AuthService, JwtService, ApiKeyService
│   ├── repositories/   # UserRepository, TenantRepository, ApiKeyRepository
│   ├── routes/         # Auth Routes
│   └── index.ts
├── Dockerfile          # Multi-Stage Build (bcrypt native)
└── package.json
```

**Features:**
- ✅ User Login/Register
- ✅ JWT Token Generation/Validation
- ✅ API Key Management
- ✅ Tenant Management

---

### 3. **Secrets Service** (`packages/secrets-service`)
**Port:** 5003 (local) / 80 (Docker/Azure)  
**Zweck:** Sichere Speicherung von Secrets (API Keys, Passwords, Tokens)

**Struktur:**
```
packages/secrets-service/
├── src/
│   ├── controllers/     # SecretsController, InternalSecretsController
│   ├── services/        # SecretsService, EncryptionService
│   ├── repositories/   # SecretRepository
│   ├── routes/         # Secrets Routes
│   └── index.ts
├── Dockerfile
└── package.json
```

**Features:**
- ✅ Encryption/Decryption von Secrets
- ✅ Tenant-spezifische Secrets
- ✅ Internal API für Execution Service

---

### 4. **Scheduler Service** (`packages/scheduler-service`)
**Port:** 5005 (local) / 80 (Docker/Azure)  
**Zweck:** Workflow Scheduling (Cron-basiert)

**Struktur:**
```
packages/scheduler-service/
├── src/
│   ├── controllers/     # SchedulerController
│   ├── services/       # SchedulerService (node-cron)
│   ├── repositories/   # WorkflowRepository
│   ├── routes/         # Scheduler Routes
│   └── index.ts
├── Dockerfile
└── package.json
```

**Features:**
- ✅ Cron Expression Parsing
- ✅ Timezone Support
- ✅ Workflow Execution Scheduling

---

### 5. **Execution Service** (`packages/execution-service/`)
**Port:** 5004 (local & Docker)  
**Zweck:** Workflow Execution Engine

**Struktur:**
```
packages/execution-service/
├── src/
│   ├── controllers/     # Execution Controllers
│   ├── services/       # Execution Logic
│   ├── nodes/          # Node Processors
│   ├── tools/          # Tool Integrations
│   ├── mcp/            # MCP Integrations
│   └── index.ts
├── Dockerfile
└── package.json
```

**Features:**
- ✅ Workflow Execution
- ✅ Node Processing
- ✅ AI Model Integration
- ✅ Tool Registry

---

## 🎨 Frontend (`frontend/`)

**Technologie:** React + TypeScript + Vite

**Struktur:**
```
frontend/
├── src/
│   ├── components/     # React Components
│   ├── pages/          # Page Components
│   ├── services/       # API Clients
│   ├── contexts/       # React Contexts
│   ├── hooks/          # Custom Hooks
│   └── utils/          # Utilities
├── public/             # Static Assets
└── package.json
```

---

## 🔧 Konfigurationsdateien

### Root-Level
- `package.json` - Root Package (pnpm Workspace)
- `pnpm-workspace.yaml` - Workspace Definition
- `tsconfig.base.json` - Base TypeScript Config
- `docker-compose.yml` - Docker Compose Setup
- `.npmrc` - pnpm Configuration

### Service-Level
Jeder Service hat:
- `package.json` - Service Dependencies
- `tsconfig.json` - TypeScript Config (extends base)
- `Dockerfile` - Multi-Stage Build

---

## 🗄️ Datenbank

**MongoDB/Cosmos DB** - Database: `MonshyFlow`

**Collections:**
- `workflows` - Workflow Definitions
- `users` - User Accounts
- `tenants` - Tenant Information
- `apikeys` - API Keys
- `secrets` - Encrypted Secrets

---

## 🌐 Service-Kommunikation

```
Frontend (Port 5173)
    ↓
API Service (Port 5001) ← Gateway integriert
    ├──→ Auth Service (Port 5002)
    ├──→ Secrets Service (Port 5003)
    ├──→ Execution Service (Port 5004)
    └──→ Scheduler Service (Port 5005)
```

**Alle Services kommunizieren über:**
- HTTP/REST (intern)
- MongoDB (Datenbank)
- Redis (Caching)
- RabbitMQ (Message Queue)

---

## 📊 Technologie-Stack

### Backend
- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.9+
- **Framework:** Express.js 5.x
- **Database:** MongoDB 7.0 / Cosmos DB (MongoDB API)
- **Cache:** Redis 7
- **Queue:** RabbitMQ 3.13
- **Package Manager:** pnpm 8+
- **DI:** TSyringe
- **Validation:** Zod
- **Logging:** Pino

### Frontend
- **Framework:** React 18+
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS

### DevOps
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Cloud:** Azure Container Apps
- **CI/CD:** (Azure DevOps / GitHub Actions)

---

## 🚀 Starten der Services

### Lokal (Development)
```bash
# Alle Services
pnpm dev

# Einzelner Service
pnpm --filter @monshy/api-service dev
```

### Docker
```bash
# Alle Services
docker-compose up -d

# Einzelner Service
docker-compose up -d api-service
```

---

## 📝 Wichtige Dateien

- **`ARCHITECTURE.md`** - Vollständige Architektur-Dokumentation
- **`SERVICES_OVERVIEW.md`** - Service-Übersicht & URLs
- **`SECURITY.md`** - Security Best Practices
- **`README.md`** - Haupt-README

---

**Version:** 1.0.0 (Production Ready)  
**Letzte Aktualisierung:** 2024

