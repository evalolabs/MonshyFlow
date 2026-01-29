# 🔧 @monshy/core

The **`@monshy/core`** package is the base library for all MonshyFlow services. It contains shared utilities, types, error classes, logger, and middleware used by all other packages.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [Usage Examples](#-usage-examples)
- [Dependencies](#-dependencies)
- [Development](#-development)

---

## 🎯 Overview

`@monshy/core` is a **shared package (library)** that provides:

- **Logger:** Structured logging with Pino
- **Error Classes:** Standardized error types
- **Types:** Shared TypeScript types
- **Constants:** HTTP status codes, roles, etc.
- **Utils:** Helper functions
- **Validation:** Zod-based validation
- **Middleware:** Security headers, rate limiting

**Important:** This package has **no external runtime dependencies** except:
- `zod` – schema validation
- `pino` / `pino-pretty` – logging
- `express-rate-limit` – rate limiting
- `helmet` – security headers

---

## 📦 Installation

The package is part of the monorepo and is installed automatically via workspaces:

```bash
# In the repository root
pnpm install
```

### Use in a service

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

## 📚 API Documentation

### Logger

Structured logging with Pino.

```typescript
import { logger } from '@monshy/core';

// Info log
logger.info({ userId: '123', action: 'login' }, 'User logged in');

// Error log
logger.error({ err: error, userId: '123' }, 'Failed to process request');

// Debug log
logger.debug({ workflowId: '456' }, 'Processing workflow');

// Warn log
logger.warn({ apiKey: 'xxx' }, 'API key expired');
```

**Features:**
- Structured JSON logging (production)
- Pretty-printed logs (development)
- Log level configurable via `LOG_LEVEL` environment variable
- ISO timestamps

---

### Error Classes

Standardized error classes for consistent error handling.

#### AppError (base class)

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

Shared TypeScript types for all services.

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

Predefined constants for consistent usage.

#### HTTP_STATUS

```typescript
import { HTTP_STATUS } from '@monshy/core';

res.status(HTTP_STATUS.OK).json(data);
res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Not found' });
res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'Unauthorized' });
```

**Available status codes:**
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

// Available roles:
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

// Available methods:
// AUTH_METHODS.JWT
// AUTH_METHODS.API_KEY
```

---

### Utils

Helper functions for common tasks.

#### sleep

```typescript
import { sleep } from '@monshy/core';

// Wait 1 second
await sleep(1000);

// Wait 5 seconds
await sleep(5000);
```

#### generateId

```typescript
import { generateId } from '@monshy/core';

const id = generateId();
// Example: "1704112000-abc123def"
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

// Remove sensitive fields
const sanitized = sanitizeObject(user, ['password', 'token']);
// { id: '123', email: 'user@example.com' }
```

#### isObject

```typescript
import { isObject } from '@monshy/core';

if (isObject(value)) {
  // value is an object (not null, not an array)
  console.log(value.property);
}
```

---

### Validation

Zod-based validation for request bodies.

#### ValidationMiddleware

```typescript
import { ValidationMiddleware } from '@monshy/core';
import { z } from 'zod';

// Define schema
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

// Use middleware
app.post('/api/users', ValidationMiddleware(createUserSchema), (req, res) => {
  // req.body is now validated and typed
  const { email, password } = req.body;
  // ...
});
```

**Error Handling:**

On validation errors, a `ValidationError` is thrown automatically:

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

Security and rate limiting middleware.

#### securityHeaders

```typescript
import { securityHeaders } from '@monshy/core';
import express from 'express';

const app = express();

// Add security headers
app.use(securityHeaders);
```

**Includes:**
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- And more...

#### apiLimiter

```typescript
import { apiLimiter } from '@monshy/core';

// Rate limiting for all API routes
app.use('/api', apiLimiter);
```

**Configuration:**
- **Development:** Disabled (Kong gateway handles it)
- **Production:** 1000 requests per 15 minutes (defense-in-depth)
- Health checks are automatically skipped

#### authLimiter

```typescript
import { authLimiter } from '@monshy/core';

// Stricter rate limiting for auth endpoints
app.use('/api/auth', authLimiter);
```

**Configuration:**
- **Development:** Disabled
- **Production:** 10 requests per 15 minutes

---

## 💡 Usage Examples

### Complete example: Express service

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

// Security headers
app.use(securityHeaders);

// Rate limiting
app.use('/api', apiLimiter);

// Body parsing
app.use(express.json());

// Validation schema
const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

// Route with validation
app.post(
  '/api/workflows',
  ValidationMiddleware(createWorkflowSchema),
  async (req, res, next) => {
    try {
      const { name, description } = req.body;
      
      logger.info({ name }, 'Creating workflow');
      
      // Business logic...
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

// Error handler
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

### Error handling pattern

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

### Logging pattern

```typescript
import { logger } from '@monshy/core';

// Structured logging
logger.info(
  { userId: '123', workflowId: '456', action: 'execute' },
  'Workflow execution started'
);

// Error logging
try {
  await executeWorkflow();
} catch (error) {
  logger.error(
    { err: error, workflowId: '456', userId: '123' },
    'Workflow execution failed'
  );
  throw error;
}

// Debug logging
logger.debug(
  { step: 'validation', workflowId: '456' },
  'Validating workflow nodes'
);
```

---

## 📦 Dependencies

### Runtime Dependencies

- `zod` ^3.25.76 – schema validation
- `pino` ^9.6.0 – logging
- `pino-pretty` ^13.0.0 – pretty logging (development)
- `express-rate-limit` ^7.4.1 – rate limiting
- `helmet` ^8.0.0 – security headers

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
│   ├── errors/         # Error classes
│   ├── logger/         # Pino logger
│   ├── middleware/     # Security & rate limiting
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── validation/     # Zod validation
│   └── index.ts        # Main export
├── dist/               # Compiled JavaScript
└── package.json
```

---

## 🔗 Further Information

- **Packages Overview:** See [`../README.md`](../README.md)
- **Pino Documentation:** [getpino.io](https://getpino.io/)
- **Zod Documentation:** [zod.dev](https://zod.dev/)
- **Helmet Documentation:** [helmetjs.github.io](https://helmetjs.github.io/)

---

## 📄 License

See root repository for license information.

