# 🏗️ MonshyFlow - Produktions-Architektur

**Finale, produktionsreife Node.js-Only-Architektur für Azure Container Apps**

---

## 📋 Übersicht

MonshyFlow ist eine professionelle Workflow-Automation-Plattform mit:
- ✅ **Einheitlicher Node.js/TypeScript Stack**
- ✅ **Azure-optimiert** - Container Apps, Cosmos DB, Redis
- ✅ **Kostenoptimiert** - Gateway integriert, keine redundanten Services
- ✅ **Produktionsreif** - Sicherheit, Logging, Monitoring
- ✅ **Entwicklerfreundlich** - TypeScript, Hot Reload, klare Struktur

---

## 🎯 Architektur-Prinzipien

1. **Monorepo mit pnpm Workspaces** - Einheitliche Dependency-Verwaltung
2. **Shared Packages** - Wiederverwendbarer Code, keine Duplikation
3. **Clean Architecture** - Controllers → Services → Repositories
4. **Dependency Injection** - TSyringe für lose Kopplung
5. **TypeScript überall** - Type Safety und bessere DX
6. **Azure-First** - Optimiert für Azure Container Apps

---

## 📁 Projektstruktur

```
monshyflow/
├── packages/                          # Shared Packages & Services
│   ├── core/                         # Core Utilities & Types
│   │   ├── src/
│   │   │   ├── types/               # Shared Types
│   │   │   ├── errors/              # Custom Error Classes
│   │   │   ├── utils/               # Utilities
│   │   │   ├── constants/           # Constants
│   │   │   ├── logger/             # Pino Logger
│   │   │   └── validation/         # Zod Schemas
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── database/                    # Database Layer
│   │   ├── src/
│   │   │   ├── models/              # Mongoose Models
│   │   │   ├── repositories/        # Repository Pattern
│   │   │   └── connection.ts        # MongoDB/Cosmos DB Connection
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── auth/                        # Authentication Package
│   │   ├── src/
│   │   │   ├── jwt/                 # JWT Utilities
│   │   │   ├── apiKey/              # API Key Utilities
│   │   │   └── middleware/          # Auth Middleware
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api-service/                 # Hauptservice (Workflow + Gateway)
│   │   ├── src/
│   │   │   ├── controllers/         # HTTP Controllers
│   │   │   ├── services/            # Business Logic
│   │   │   ├── repositories/        # Data Access
│   │   │   ├── routes/              # Express Routes
│   │   │   ├── gateway/             # Gateway Routes (integriert)
│   │   │   ├── middleware/          # Security, Rate Limiting, etc.
│   │   │   └── index.ts             # Entry Point
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── auth-service/                # Authentication Service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── secrets-service/             # Secrets Management
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── scheduler-service/           # Workflow Scheduling
│       ├── src/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── jobs/                # RabbitMQ Job Processors
│       │   ├── routes/
│       │   └── index.ts
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
├── services/                         # Legacy Services
│   └── execution-service/           # ✅ Bereits in Node.js
│
├── shared/                           # Shared Registry
│   └── registry.json                # Node/Tool Registry
│
├── frontend/                         # React Frontend
│
├── docker-compose.yml                # Docker Compose (Development)
├── pnpm-workspace.yaml               # pnpm Workspace Config
├── package.json                      # Root package.json
├── tsconfig.base.json                # Base TypeScript Config
└── .npmrc                            # pnpm Configuration
```

---

## 🚀 Services

### 1. API Service (Workflow + Gateway integriert)

**Port:** 80 (Azure) / 5001 (Lokal)  
**Kosten:** 1 Container App (Gateway spart Kosten!)

**Features:**
- Workflow CRUD Operations
- **Gateway Routing** zu anderen Services (http-proxy-middleware - kostenlos!)
- Rate Limiting
- Security Headers
- Request Logging

**Warum integriert?**
- ✅ **Kostenersparnis** - Kein separater Gateway Container
- ✅ **Kostenlos** - http-proxy-middleware statt Kong (~$100+/Monat)
- ✅ **Einfacher** - Ein Service weniger zu deployen
- ✅ **Performance** - Keine zusätzliche Network-Hop
- ✅ **Vollständig funktional** - Alle Gateway-Features vorhanden

**Gateway ist wichtig, aber kostenlos implementiert!**

### 2. Auth Service

**Port:** 80 (Azure) / 5002 (Lokal)  
**Features:**
- User Management
- JWT Token Generation
- API Key Management
- Tenant Management

### 3. Secrets Service

**Port:** 80 (Azure) / 5003 (Lokal)  
**Features:**
- Secrets CRUD
- Encryption/Decryption
- Azure Key Vault Integration

### 4. Execution Service

**Port:** 80 (Azure) / 5004 (Lokal)  
**Status:** ✅ Bereits vorhanden  
**Features:**
- Workflow Execution
- Node Processors
- Tool Creators

### 5. Scheduler Service

**Port:** 80 (Azure) / 5005 (Lokal)  
**Features:**
- Workflow Scheduling (RabbitMQ)
- Cron Expression Parsing
- Job Management

---

## 🔒 Sicherheit

### Implementierte Features

1. **Input Validation (Zod)**
   ```typescript
   import { ValidationMiddleware } from '@monshy/core';
   app.post('/api/workflows', ValidationMiddleware(CreateWorkflowSchema), ...);
   ```

2. **Rate Limiting**
   ```typescript
   import { apiLimiter, authLimiter } from '@monshy/core';
   app.use('/api', apiLimiter);
   app.use('/api/auth', authLimiter);
   ```

3. **Security Headers (Helmet)**
   ```typescript
   import { securityHeaders } from '@monshy/core';
   app.use(securityHeaders);
   ```

4. **CORS Konfiguration**
   ```typescript
   // Nur erlaubte Origins
   app.use(cors({ origin: allowedOrigins, credentials: true }));
   ```

5. **JWT & API Key Authentication**
   ```typescript
   import { authMiddleware } from '@monshy/auth';
   app.use('/api/workflows', authMiddleware);
   ```

---

## 📊 Monitoring & Logging

### Strukturiertes Logging (Pino)

```typescript
import { logger } from '@monshy/core';

logger.info({ workflowId: '123' }, 'Workflow created');
logger.error({ err }, 'Failed to create workflow');
```

### Health Checks

Jeder Service hat `/health` Endpoint:
```typescript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'api-service',
    timestamp: new Date().toISOString()
  });
});
```

---

## ☁️ Azure Deployment

### Container Apps

| Service | Container App Name | Ingress | Kosten |
|---------|-------------------|---------|--------|
| API Service | `api-service` | External | ~$10/Monat |
| Auth Service | `auth-service` | Internal | ~$10/Monat |
| Secrets Service | `secrets-service` | Internal | ~$10/Monat |
| Execution Service | `execution-service` | Internal | ~$10/Monat |
| Scheduler Service | `scheduler-service` | Internal | ~$10/Monat |

**Gesamt:** ~$50/Monat (ohne Gateway-Service!)

### Service Discovery

```typescript
// Automatisch: Azure Container Apps erkennt interne Namen
const authUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:80';
```

### Database & Cache

- **Cosmos DB (MongoDB API)** - ~$25/Monat
- **Azure Cache for Redis** - ~$15/Monat
- **Azure Key Vault** - ~$0.03/Monat

**Gesamt:** ~$90/Monat (inkl. alle Services)

---

## 🛠️ Entwicklung

### Lokale Entwicklung

```bash
# Dependencies installieren
pnpm install

# Alle Services starten
pnpm dev

# Einzelnen Service starten
pnpm --filter @monshy/api-service dev
```

### Build

```bash
# Alles bauen
pnpm build

# Einzelnes Package
pnpm --filter @monshy/core build
```

### Testing

```bash
# Alle Tests
pnpm test

# Einzelner Service
pnpm --filter @monshy/api-service test
```

---

## 📦 Shared Packages

### `@monshy/core`
- Types, Errors, Utils
- Logger (Pino)
- Validation (Zod)
- Rate Limiting
- Security Headers

### `@monshy/database`
- Mongoose Models
- Repository Pattern
- Cosmos DB Support

### `@monshy/auth`
- JWT & API Key Utilities
- Auth Middleware
- Token Validation

---

## ✅ Best Practices

1. **Immer Shared Packages verwenden** - Keine Duplikation
2. **Input Validation** - Zod Schemas für alle Inputs
3. **Strukturiertes Logging** - Pino für alle Logs
4. **Error Handling** - Custom Error Classes
5. **Type Safety** - TypeScript überall
6. **Clean Architecture** - Controllers → Services → Repositories

---

## 🎯 Vorteile dieser Architektur

1. **Kostenoptimiert** - Gateway integriert, keine redundanten Services
2. **Azure-optimiert** - Perfekt für Container Apps
3. **Sicher** - Input Validation, Rate Limiting, Security Headers
4. **Wartbar** - Clean Architecture, Shared Packages, TypeScript
5. **Entwicklerfreundlich** - TypeScript, Hot Reload, klare Struktur
6. **Skalierbar** - Jeder Service kann unabhängig skaliert werden

---

## 📚 Weitere Dokumentation

- `DEVELOPMENT.md` - Entwickler-Guide
- `DEPLOYMENT.md` - Deployment-Guide für Azure
- `SECURITY.md` - Security Best Practices

---

**Version:** 1.0.0 (Production Ready)  
**Letzte Aktualisierung:** 2024

