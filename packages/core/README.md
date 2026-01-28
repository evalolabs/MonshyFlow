# 🔧 @monshy/core

Das **@monshy/core** Package ist die Basis-Bibliothek für alle MonshyFlow-Services. Es enthält gemeinsame Utilities, Types, Error Classes, Logger und Middleware, die von allen anderen Packages verwendet werden.

---

## 📋 Inhaltsverzeichnis

- [Übersicht](#-übersicht)
- [Installation](#-installation)
- [API-Dokumentation](#-api-dokumentation)
- [Verwendungsbeispiele](#-verwendungsbeispiele)
- [Dependencies](#-dependencies)
- [Development](#-development)

---

## 🎯 Übersicht

`@monshy/core` ist ein **Shared Package** (Library), das folgende Funktionalitäten bereitstellt:

- **Logger:** Strukturiertes Logging mit Pino
- **Error Classes:** Standardisierte Error-Typen
- **Types:** Gemeinsame TypeScript-Typen
- **Constants:** HTTP Status Codes, Rollen, etc.
- **Utils:** Hilfsfunktionen
- **Validation:** Zod-basierte Validierung
- **Middleware:** Security Headers, Rate Limiting

**Wichtig:** Dieses Package hat **keine externen Runtime-Dependencies** außer:
- `zod` - Schema Validation
- `pino` / `pino-pretty` - Logging
- `express-rate-limit` - Rate Limiting
- `helmet` - Security Headers

---

## 📦 Installation

Das Package ist Teil des Monorepos und wird automatisch über Workspaces installiert:

```bash
# Im Root-Verzeichnis
pnpm install
```

### In einem Service verwenden

```json
{
  "dependencies": {
    "@monshy/core": "workspace:*"
  }
}
```

```typescript
import { logger } from '@monshy/core';
import { AppError } from '@monshy/core';
```

---

## 📚 API-Dokumentation

### Logger

Strukturiertes Logging mit Pino.

```typescript
import { logger } from '@monshy/core';

// Info Log
logger.info({ userId: '123', action: 'login' }, 'User logged in');

// Error Log
logger.error({ err: error, userId: '123' }, 'Failed to process request');

// Debug Log
logger.debug({ workflowId: '456' }, 'Processing workflow');

// Warn Log
logger.warn({ apiKey: 'xxx' }, 'API Key expired');
```

**Features:**
- Strukturiertes JSON-Logging (Production)
- Pretty-printed Logs (Development)
- Log-Level konfigurierbar via `LOG_LEVEL` Environment Variable
- ISO Timestamps

---

### Error Classes

Standardisierte Error-Klassen für konsistente Fehlerbehandlung.

#### AppError (Base Class)

```typescript
import { AppError } from '@monshy/core';

throw new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
```

#### NotFoundError

```typescript
import { NotFoundError } from '@monshy/core';

throw new NotFoundError('Workflow', workflowId);
// Error: "Workflow with id 123 not found"
// Status Code: 404
```

#### ValidationError

```typescript
import { ValidationError } from '@monshy/core';

throw new ValidationError('Invalid input', {
  email: ['Email is required'],
  password: ['Password must be at least 8 characters']
});
// Status Code: 400
```

#### UnauthorizedError

```typescript
import { UnauthorizedError } from '@monshy/core';

throw new UnauthorizedError('Invalid token');
// Status Code: 401
```

#### ForbiddenError

```typescript
import { ForbiddenError } from '@monshy/core';

throw new ForbiddenError('Insufficient permissions');
// Status Code: 403
```

#### ConflictError

```typescript
import { ConflictError } from '@monshy/core';

throw new ConflictError('Email already exists');
// Status Code: 409
```

---

### Types

Gemeinsame TypeScript-Typen für alle Services.

#### ApiResponse

```typescript
import { ApiResponse } from '@monshy/core';

const response: ApiResponse<User> = {
  success: true,
  data: {
    id: '123',
    email: 'user@example.com'
  }
};

const errorResponse: ApiResponse = {
  success: false,
  error: 'User not found'
};
```

#### PaginatedResponse

```typescript
import { PaginatedResponse } from '@monshy/core';

const paginated: PaginatedResponse<Workflow> = {
  items: [workflow1, workflow2],
  total: 100,
  page: 1,
  pageSize: 10,
  totalPages: 10
};
```

#### TenantContext

```typescript
import { TenantContext } from '@monshy/core';

const context: TenantContext = {
  tenantId: '507f191e810c19729de860ea',
  userId: '507f1f77bcf86cd799439011',
  userRole: 'admin'
};
```

#### AuthContext

```typescript
import { AuthContext } from '@monshy/core';

const authContext: AuthContext = {
  tenantId: '507f191e810c19729de860ea',
  userId: '507f1f77bcf86cd799439011',
  userRole: 'admin',
  authMethod: 'JWT',
  permissions: ['read:workflows', 'write:workflows']
};
```

---

### Constants

Vordefinierte Konstanten für konsistente Verwendung.

#### HTTP_STATUS

```typescript
import { HTTP_STATUS } from '@monshy/core';

res.status(HTTP_STATUS.OK).json(data);
res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Not found' });
res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'Unauthorized' });
```

**Verfügbare Status Codes:**
- `HTTP_STATUS.OK` (200)
- `HTTP_STATUS.CREATED` (201)
- `HTTP_STATUS.NO_CONTENT` (204)
- `HTTP_STATUS.BAD_REQUEST` (400)
- `HTTP_STATUS.UNAUTHORIZED` (401)
- `HTTP_STATUS.FORBIDDEN` (403)
- `HTTP_STATUS.NOT_FOUND` (404)
- `HTTP_STATUS.CONFLICT` (409)
- `HTTP_STATUS.INTERNAL_SERVER_ERROR` (500)

#### ROLES

```typescript
import { ROLES } from '@monshy/core';

if (user.role === ROLES.SUPERADMIN) {
  // Superadmin logic
}

// Verfügbare Rollen:
// ROLES.SUPERADMIN
// ROLES.ADMIN
// ROLES.USER
// ROLES.SUPPORT
```

#### AUTH_METHODS

```typescript
import { AUTH_METHODS } from '@monshy/core';

if (authMethod === AUTH_METHODS.JWT) {
  // JWT authentication
}

// Verfügbare Methoden:
// AUTH_METHODS.JWT
// AUTH_METHODS.API_KEY
```

---

### Utils

Hilfsfunktionen für häufige Aufgaben.

#### sleep

```typescript
import { sleep } from '@monshy/core';

// Warte 1 Sekunde
await sleep(1000);

// Warte 5 Sekunden
await sleep(5000);
```

#### generateId

```typescript
import { generateId } from '@monshy/core';

const id = generateId();
// Beispiel: "1704112000-abc123def"
```

#### sanitizeObject

```typescript
import { sanitizeObject } from '@monshy/core';

const user = {
  id: '123',
  email: 'user@example.com',
  password: 'secret',
  token: 'abc123'
};

// Entferne sensible Felder
const sanitized = sanitizeObject(user, ['password', 'token']);
// { id: '123', email: 'user@example.com' }
```

#### isObject

```typescript
import { isObject } from '@monshy/core';

if (isObject(value)) {
  // value ist ein Objekt (nicht null, nicht Array)
  console.log(value.property);
}
```

---

### Validation

Zod-basierte Validierung für Request Bodies.

#### ValidationMiddleware

```typescript
import { ValidationMiddleware } from '@monshy/core';
import { z } from 'zod';

// Schema definieren
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

// Middleware verwenden
app.post('/api/users', ValidationMiddleware(createUserSchema), (req, res) => {
  // req.body ist jetzt validiert und typisiert
  const { email, password } = req.body;
  // ...
});
```

**Error Handling:**

Bei Validierungsfehlern wird automatisch ein `ValidationError` geworfen:

```json
{
  "success": false,
  "error": "Validation failed",
  "fields": {
    "email": ["Invalid email"],
    "password": ["String must contain at least 8 character(s)"]
  }
}
```

---

### Middleware

Security und Rate Limiting Middleware.

#### securityHeaders

```typescript
import { securityHeaders } from '@monshy/core';
import express from 'express';

const app = express();

// Security Headers hinzufügen
app.use(securityHeaders);
```

**Enthält:**
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Und mehr...

#### apiLimiter

```typescript
import { apiLimiter } from '@monshy/core';

// Rate Limiting für alle API-Routes
app.use('/api', apiLimiter);
```

**Konfiguration:**
- **Development:** Deaktiviert (Kong Gateway übernimmt)
- **Production:** 1000 Requests pro 15 Minuten (Defense-in-depth)
- Health Checks werden automatisch übersprungen

#### authLimiter

```typescript
import { authLimiter } from '@monshy/core';

// Strikteres Rate Limiting für Auth-Endpoints
app.use('/api/auth', authLimiter);
```

**Konfiguration:**
- **Development:** Deaktiviert
- **Production:** 10 Requests pro 15 Minuten

---

## 💡 Verwendungsbeispiele

### Komplettes Beispiel: Express Service

```typescript
import express from 'express';
import {
  logger,
  AppError,
  NotFoundError,
  HTTP_STATUS,
  securityHeaders,
  apiLimiter,
  ValidationMiddleware
} from '@monshy/core';
import { z } from 'zod';

const app = express();

// Security Headers
app.use(securityHeaders);

// Rate Limiting
app.use('/api', apiLimiter);

// Body Parsing
app.use(express.json());

// Validation Schema
const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

// Route mit Validierung
app.post(
  '/api/workflows',
  ValidationMiddleware(createWorkflowSchema),
  async (req, res, next) => {
    try {
      const { name, description } = req.body;
      
      logger.info({ name }, 'Creating workflow');
      
      // Business Logic...
      const workflow = { id: '123', name, description };
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: workflow
      });
    } catch (error) {
      next(error);
    }
  }
);

// Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof AppError) {
    logger.error({ err, statusCode: err.statusCode }, 'Application error');
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  } else {
    logger.error({ err }, 'Unexpected error');
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

### Error Handling Pattern

```typescript
import { NotFoundError, ValidationError, logger } from '@monshy/core';

async function getWorkflow(id: string) {
  const workflow = await workflowRepo.findById(id);
  
  if (!workflow) {
    throw new NotFoundError('Workflow', id);
  }
  
  return workflow;
}

async function createWorkflow(data: { name: string; description?: string }) {
  if (!data.name) {
    throw new ValidationError('Name is required', {
      name: ['Name is required']
    });
  }
  
  // ...
}
```

### Logging Pattern

```typescript
import { logger } from '@monshy/core';

// Strukturiertes Logging
logger.info(
  { userId: '123', workflowId: '456', action: 'execute' },
  'Workflow execution started'
);

// Error Logging
try {
  await executeWorkflow();
} catch (error) {
  logger.error(
    { err: error, workflowId: '456', userId: '123' },
    'Workflow execution failed'
  );
  throw error;
}

// Debug Logging
logger.debug(
  { step: 'validation', workflowId: '456' },
  'Validating workflow nodes'
);
```

---

## 📦 Dependencies

### Runtime Dependencies

- `zod` ^3.25.76 - Schema Validation
- `pino` ^9.6.0 - Logging
- `pino-pretty` ^13.0.0 - Pretty Logging (Development)
- `express-rate-limit` ^7.4.1 - Rate Limiting
- `helmet` ^8.0.0 - Security Headers

### Dev Dependencies

- `typescript` ^5.9.3
- `@types/node` ^24.7.1
- `@types/express` ^5.0.3

---

## 🛠️ Development

### Build

```bash
cd packages/core
pnpm build
```

### Watch Mode

```bash
cd packages/core
pnpm dev
```

### Clean

```bash
cd packages/core
pnpm clean
```

### Code Structure

```
core/
├── src/
│   ├── constants/      # HTTP_STATUS, ROLES, etc.
│   ├── errors/         # Error Classes
│   ├── logger/         # Pino Logger
│   ├── middleware/     # Security & Rate Limiting
│   ├── types/          # TypeScript Types
│   ├── utils/          # Utility Functions
│   ├── validation/     # Zod Validation
│   └── index.ts        # Main Export
├── dist/               # Compiled JavaScript
└── package.json
```

---

## 🔗 Weitere Informationen

- **Packages Overview:** Siehe [`../README.md`](../README.md)
- **Pino Documentation:** [getpino.io](https://getpino.io/)
- **Zod Documentation:** [zod.dev](https://zod.dev/)
- **Helmet Documentation:** [helmetjs.github.io](https://helmetjs.github.io/)

---

## 📄 Lizenz

Siehe Root-Repository für Lizenzinformationen.

