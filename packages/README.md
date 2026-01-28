# 📦 Packages Overview

This directory contains all **Shared Packages** and **Microservices** for the MonshyFlow platform. The architecture is based on a **Monorepo** with **pnpm Workspaces** and follows the **Microservices Pattern** with separate, independently deployable services.

---

## 📋 Table of Contents

- [Shared Packages](#-shared-packages)
- [Services](#-services)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Architecture](#-architecture)

---

## 🔧 Shared Packages

Shared Packages are reusable libraries used by multiple services. They are managed as npm packages with `workspace:*` dependencies.

### `@monshy/core`

**Base Utilities Package** - Contains common functionality for all services.

**Functions:**
- Logger (Pino-based)
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

**Usage:**
```typescript
import { logger } from '@monshy/core';
import { AppError } from '@monshy/core';
import { securityHeaders } from '@monshy/core';
```

---

### `@monshy/database`

**Database Package** - MongoDB Models, Repositories and Connection Management.

**Functions:**
- Mongoose Models (Workflow, User, Tenant, etc.)
- Database Connection Management
- Repository Pattern Implementation
- Database Utilities

**Dependencies:**
- `@monshy/core` - Shared Utilities
- `mongoose` - MongoDB ODM

**Usage:**
```typescript
import { connectDatabase } from '@monshy/database';
import { Workflow, User } from '@monshy/database';
```

---

### `@monshy/auth`

**Authentication Package** - JWT and API Key Utilities, Auth Middleware.

**Functions:**
- JWT Token Generation & Verification
- API Key Management
- Authentication Middleware
- Password Hashing (bcrypt)

**Dependencies:**
- `@monshy/core` - Shared Utilities
- `jsonwebtoken` - JWT Handling
- `bcrypt` - Password Hashing

**Usage:**
```typescript
import { generateToken, verifyToken } from '@monshy/auth';
import { authenticate } from '@monshy/auth';
```

---

## 🚀 Services

Services are standalone HTTP services (Express.js) that run on different ports and communicate via HTTP.

### `@monshy/api-service` (Port: 5000)

**API Service** - Central service for Gateway functionality and Workflow Management.

**Functions:**
- **API Gateway:** Routes requests to various services (http-proxy-middleware)
- **Workflow Management:** CRUD operations for workflows
- **Swagger UI:** API documentation at `/api-docs`
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

**Authentication & Authorization Service** - Manages user authentication and authorization.

**Functions:**
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

**Workflow Execution Service** - Executes workflows and processes node operations.

**Functions:**
- Node Execution (LLM, HTTP, Code, Transform, etc.)
- Agent SDK Integration (OpenAI Agents)
- MCP (Model Context Protocol) Support
- Web Search Integration
- Email Sending

**Dependencies:**
- `@monshy/core`
- `mongoose` (direct, not via @monshy/database)
- `express`, `openai`, `axios`
- `redis` (Caching)
- `amqplib` (Message Queue)

**Endpoints:**
- `/api/execute/*` - Workflow Execution
- `/api/nodes/*` - Node Operations

---

### `@monshy/scheduler-service` (Port: 5005)

**Workflow Scheduling Service** - Schedules and manages scheduled workflows.

**Functions:**
- Cron-based Scheduling
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

**Secrets Management Service** - Manages encrypted secrets for workflows.

**Functions:**
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

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- MongoDB (local or remote)

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build:packages
```

### Start Services

```bash
# Start all services in development mode
pnpm dev

# Or individual services
cd packages/api-service && pnpm dev
cd packages/auth-service && pnpm dev
```

### Testing

```bash
# Run all tests
pnpm test

# Tests for a specific package
cd packages/api-service && pnpm test
```

---

## 📝 Development

### Create New Package

```bash
# Create package directory
mkdir packages/my-package
cd packages/my-package

# Initialize package.json
pnpm init

# Add workspace dependency (in package.json)
{
  "name": "@monshy/my-package",
  "dependencies": {
    "@monshy/core": "workspace:*"
  }
}
```

### Use Package

```typescript
// In a service
import { AppError } from '@monshy/core';
import { connectDatabase } from '@monshy/database';
import { generateToken } from '@monshy/auth';
```

### Build Process

```bash
# Build all packages
pnpm build:packages

# Build individual package
cd packages/core && pnpm build
```

---

## 🏗️ Architecture

### Monorepo Structure

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

### Service Communication

- **HTTP/REST:** Services communicate via HTTP
- **Message Queue:** For asynchronous operations (RabbitMQ/AMQP)
- **Database:** Shared MongoDB via `@monshy/database`

### Dependency Graph

```
Services
  ├── @monshy/core (Base)
  ├── @monshy/database (Models)
  └── @monshy/auth (Auth Utils)
```

---

## 🔗 Further Information

- **Gateway Details:** See [`api-service/src/gateway/README.md`](./api-service/src/gateway/README.md)
- **Service Ports (external, local):** 
  - API Service: `:5000` (via Kong Gateway)
  - Auth Service: `:5002`
  - Execution Service: `:5004`
  - Scheduler Service: `:5005`
  - Secrets Service: `:5003`
  
**Note:** In Docker/Production, services run internally on port 80 (except execution-service on 5004) and are reached via Service Discovery.

---

## 📄 License

See root repository for license information.
