# 📍 Services Übersicht - Wo finde ich was?

## 🗂️ Verzeichnisstruktur

### Node.js Services

```
packages/
├── api-service/          # 🌐 API Service (Port 5001)
│   ├── src/
│   │   ├── index.ts      # Main Entry Point
│   │   ├── controllers/   # WorkflowController
│   │   ├── services/     # WorkflowService
│   │   ├── repositories/ # WorkflowRepository
│   │   └── routes/       # Routes + Gateway
│   └── Dockerfile
│
├── auth-service/         # 🔐 Auth Service (Port 5002)
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/  # AuthController, ApiKeyController
│   │   ├── services/     # AuthService, JwtService, ApiKeyService
│   │   └── repositories/ # UserRepository, TenantRepository, ApiKeyRepository
│   └── Dockerfile
│
├── secrets-service/      # 🔒 Secrets Service (Port 5003)
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/  # SecretsController, InternalSecretsController
│   │   ├── services/     # SecretsService, EncryptionService
│   │   └── repositories/ # SecretRepository
│   └── Dockerfile
│
├── scheduler-service/    # ⏰ Scheduler Service (Port 5005)
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/  # SchedulerController
│   │   ├── services/     # SchedulerService
│   │   └── repositories/ # WorkflowRepository
│   └── Dockerfile
│
├── execution-service/    # ⚙️ Execution Service (Port 5004)
│   ├── src/
│   │   ├── index.ts
│   │   ├── services/
│   │   ├── controllers/
│   │   └── routes/
│   └── Dockerfile
│
└── core/                 # 📦 Shared Core Package
    └── src/
        ├── logger.ts
        ├── middleware/
        └── validation/
```

---

## 🚀 Services starten

### Option 1: Mit pnpm (Development)

```bash
# Alle Services starten
pnpm dev

# Einzelner Service
pnpm --filter @monshy/api-service dev
pnpm --filter @monshy/auth-service dev
pnpm --filter @monshy/secrets-service dev
pnpm --filter @monshy/scheduler-service dev
```

### Option 2: Mit Docker Compose

```bash
# Alle Services starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f api-service
docker-compose logs -f auth-service
docker-compose logs -f secrets-service
docker-compose logs -f scheduler-service
docker-compose logs -f execution-service
```

---

## 📊 Service Ports & URLs

| Service | Port (Lokal) | Port (Docker) | Health Check |
|---------|--------------|---------------|--------------|
| **API Service** | 5001 | 80 | http://localhost:5001/health |
| **Auth Service** | 5002 | 80 | http://localhost:5002/health |
| **Secrets Service** | 5003 | 80 | http://localhost:5003/health |
| **Execution Service** | 5004 | 5004 | http://localhost:5004/health |
| **Scheduler Service** | 5005 | 80 | http://localhost:5005/health |

---

## 🧪 Services testen

### 1. Health Checks

```bash
# Alle Services prüfen
curl http://localhost:5001/health  # API Service
curl http://localhost:5002/health  # Auth Service
curl http://localhost:5003/health # Secrets Service
curl http://localhost:5004/health # Execution Service
curl http://localhost:5005/health # Scheduler Service
```

### 2. API Service testen

```bash
# Workflows abrufen (benötigt Auth)
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/workflows
```

### 3. Auth Service testen

```bash
# User registrieren
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 📁 Wichtige Dateien

### Service Entry Points

- `packages/api-service/src/index.ts` - API Service Main
- `packages/auth-service/src/index.ts` - Auth Service Main
- `packages/secrets-service/src/index.ts` - Secrets Service Main
- `packages/scheduler-service/src/index.ts` - Scheduler Service Main
- `execution-service/src/index.ts` - Execution Service Main

### Konfiguration

- `docker-compose.yml` - Alle Services konfiguriert
- `packages/api-service/src/config/index.ts` - API Service Config
- `packages/database/src/connection.ts` - MongoDB Connection

### Models

- `packages/database/src/models/` - Alle MongoDB Models
  - `Workflow.ts`
  - `User.ts`
  - `Tenant.ts`
  - `ApiKey.ts`
  - `Secret.ts`

---

## 🔍 Services im Code finden

### API Service
- **Routes:** `packages/api-service/src/routes/index.ts`
- **Controller:** `packages/api-service/src/controllers/WorkflowController.ts`
- **Service:** `packages/api-service/src/services/WorkflowService.ts`
- **Repository:** `packages/api-service/src/repositories/WorkflowRepository.ts`

### Auth Service
- **Routes:** `packages/auth-service/src/routes/index.ts`
- **Controllers:** `packages/auth-service/src/controllers/`
- **Services:** `packages/auth-service/src/services/`

### Secrets Service
- **Routes:** `packages/secrets-service/src/routes/index.ts`
- **Controllers:** `packages/secrets-service/src/controllers/`
- **Services:** `packages/secrets-service/src/services/`

### Scheduler Service
- **Routes:** `packages/scheduler-service/src/routes/index.ts`
- **Controller:** `packages/scheduler-service/src/controllers/SchedulerController.ts`
- **Service:** `packages/scheduler-service/src/services/SchedulerService.ts`

---

## 🐳 Docker Container

Nach `docker-compose up -d`:

```bash
# Container anzeigen
docker ps

# Sollte zeigen:
# - monshyflow-api-service
# - monshyflow-auth-service
# - monshyflow-secrets-service
# - monshyflow-scheduler-service
# - agentbuilder-execution-service
# - MonshyFlow-mongodb
```

---

## 📝 Nächste Schritte

1. **Services starten:** `docker-compose up -d`
2. **Health Checks testen:** Siehe oben
3. **API testen:** Siehe Beispiele oben
4. **Logs prüfen:** `docker-compose logs -f <service-name>`

