# 📦 Packages Overview

Dieses Verzeichnis enthält alle Shared Packages und Services für die neue Node.js-Only-Architektur.

---

## 🔧 Shared Packages

### `@monshy/core`
Basis-Utilities, Types, Errors und Constants. Wird von allen anderen Packages verwendet.

**Keine externen Dependencies** (außer TypeScript)

### `@monshy/database`
MongoDB Models, Repositories und Connection Management.

**Dependencies:** `@monshy/core`, `mongoose`

### `@monshy/auth`
JWT und API Key Utilities, Auth Middleware.

**Dependencies:** `@monshy/core`, `jsonwebtoken`, `bcrypt`

---

## 🚀 Services

### `@monshy/gateway`
API Gateway - Routet Requests zu den verschiedenen Services.

**Dependencies:** `@monshy/core`, `@monshy/auth`, `express`, `http-proxy-middleware`

### `@monshy/workflow-service`
Workflow Management Service - CRUD Operations für Workflows.

**Dependencies:** `@monshy/core`, `@monshy/database`, `@monshy/auth`, `express`, `tsyringe`

### `@monshy/auth-service` (⏳ Pending)
Authentication & Authorization Service.

### `@monshy/secrets-service` (⏳ Pending)
Secrets Management Service.

### `@monshy/scheduler-service` (⏳ Pending)
Workflow Scheduling Service mit BullMQ.

---

## 📝 Entwicklung

### Neues Package erstellen

```bash
mkdir packages/my-package
cd packages/my-package
pnpm init
```

### Package verwenden

```typescript
import { AppError } from '@monshy/core';
import { connectDatabase } from '@monshy/database';
import { generateToken } from '@monshy/auth';
```

---

## 🔗 Weitere Informationen

Siehe `ARCHITECTURE_NEW.md` für vollständige Architektur-Dokumentation.

