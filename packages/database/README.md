# 🗄️ @monshy/database

The **@monshy/database** package manages MongoDB connections, Mongoose models, and data access for the MonshyFlow platform. It provides a central database layer for all services.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [Models](#-models)
- [Usage Examples](#-usage-examples)
- [Environment Variables](#-environment-variables)
- [Dependencies](#-dependencies)
- [Development](#-development)

---

## 🎯 Overview

`@monshy/database` is a **Shared Package** (Library) that provides the following functionalities:

- **Connection Management:** MongoDB connection management
- **Mongoose Models:** All database models (User, Workflow, Tenant, etc.)
- **TypeScript Interfaces:** Type-safe model definitions
- **Azure Cosmos DB Support:** Compatibility with Azure Cosmos DB (MongoDB API)

**Dependencies:**
- `@monshy/core` - Base utilities
- `mongoose` ^8.19.1 - MongoDB ODM

**Supported Databases:**
- MongoDB (local or remote)
- Azure Cosmos DB (MongoDB API)

---

## 📦 Installation

The package is part of the monorepo and is automatically installed via workspaces:

```bash
# In the root directory
pnpm install
```

### Using in a Service

```json
{
  "dependencies": {
    "@monshy/database": "workspace:*"
  }
}
```

```typescript
import { connectDatabase, User, Workflow } from '@monshy/database';
```

---

## 📚 API Documentation

### Connection Management

#### connectDatabase

Establishes a connection to MongoDB.

```typescript
import { connectDatabase } from '@monshy/database';

// On service startup
await connectDatabase();
// ✅ MongoDB connected
```

**Features:**
- Automatic connection check (prevents duplicate connections)
- Azure Cosmos DB compatibility
- Automatic retry logic
- Connection type logging

**Environment Variables:**
- `MONGODB_URL` - MongoDB connection string
- `MongoDbSettings__ConnectionString` - Alternative (for .NET compatibility)

**Standard Connection Strings:**
- **Production:** `mongodb://admin:admin123@MonshyFlow-mongodb:27017/MonshyFlow?authSource=admin`
- **Development:** `mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin`

**Azure Cosmos DB:**
- Automatic detection (contains `cosmos.azure.com`)
- `retryWrites: false` is automatically set (Cosmos DB requirement)

---

#### disconnectDatabase

Disconnects from MongoDB.

```typescript
import { disconnectDatabase } from '@monshy/database';

// On service shutdown
await disconnectDatabase();
// MongoDB disconnected
```

**Usage:**
- Graceful shutdown
- Testing (cleanup)
- Service restart

---

### Models

All models are exported as Mongoose models and can be used directly.

#### User

```typescript
import { User, IUser } from '@monshy/database';

// Create user
const user = new User({
  email: 'user@example.com',
  passwordHash: 'hashed-password',
  firstName: 'John',
  lastName: 'Doe',
  tenantId: '507f191e810c19729de860ea',
  roles: ['user'],
  isActive: true
});
await user.save();

// Find user
const foundUser = await User.findById(userId);
const userByEmail = await User.findOne({ email: 'user@example.com' });
const usersByTenant = await User.find({ tenantId: tenantId });
```

**Interface:**
```typescript
interface IUser {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `email` (unique)
- `tenantId`
- `tenantId + email` (compound)

---

#### Workflow

```typescript
import { Workflow, IWorkflow } from '@monshy/database';

// Create workflow
const workflow = new Workflow({
  name: 'My Workflow',
  description: 'Workflow description',
  version: 1,
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 100, y: 100 }
    }
  ],
  edges: [],
  userId: '507f1f77bcf86cd799439011',
  tenantId: '507f191e810c19729de860ea',
  isPublished: false,
  isActive: true
});
await workflow.save();

// Find workflow
const foundWorkflow = await Workflow.findById(workflowId);
const workflowsByTenant = await Workflow.find({ tenantId: tenantId });
const publishedWorkflows = await Workflow.find({ isPublished: true });
```

**Interface:**
```typescript
interface IWorkflow {
  name: string;
  description?: string;
  version: number;
  nodes: INode[];
  edges: IEdge[];
  userId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  publishedAt?: Date;
  isActive: boolean;
  scheduleConfig?: IScheduleConfig;
  variables?: Record<string, any>;
  // ... additional fields
}
```

**Indexes:**
- `tenantId`
- `userId`
- `isPublished`
- `isActive`

---

#### Tenant

```typescript
import { Tenant, ITenant } from '@monshy/database';

// Create tenant
const tenant = new Tenant({
  name: 'My Company',
  domain: 'mycompany.com',
  isActive: true
});
await tenant.save();

// Find tenant
const foundTenant = await Tenant.findById(tenantId);
const tenantByDomain = await Tenant.findOne({ domain: 'mycompany.com' });
```

**Interface:**
```typescript
interface ITenant {
  name: string;
  domain?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `domain` (unique, sparse)

---

#### ApiKey

```typescript
import { ApiKey, IApiKey } from '@monshy/database';

// Create API key
const apiKey = new ApiKey({
  keyHash: 'hashed-api-key',
  name: 'Production API Key',
  description: 'API Key for production use',
  tenantId: '507f191e810c19729de860ea',
  isActive: true,
  expiresAt: new Date('2025-12-31')
});
await apiKey.save();

// Find API key
const foundApiKey = await ApiKey.findById(apiKeyId);
const apiKeysByTenant = await ApiKey.find({ tenantId: tenantId, isActive: true });
```

**Interface:**
```typescript
interface IApiKey {
  keyHash: string;
  name: string;
  description?: string;
  tenantId: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

#### Secret

```typescript
import { Secret, ISecret } from '@monshy/database';

// Create secret
const secret = new Secret({
  name: 'openai-api-key',
  description: 'OpenAI API Key',
  encryptedValue: 'encrypted-value',
  salt: 'salt-value',
  secretType: 'api-key',
  provider: 'openai',
  tenantId: '507f191e810c19729de860ea',
  isActive: true
});
await secret.save();

// Find secret
const foundSecret = await Secret.findById(secretId);
const secretsByTenant = await Secret.find({ tenantId: tenantId });
const secretByName = await Secret.findOne({ 
  tenantId: tenantId, 
  name: 'openai-api-key' 
});
```

**Interface:**
```typescript
interface ISecret {
  name: string;
  description?: string;
  encryptedValue: string;
  salt: string;
  secretType: string;
  provider?: string;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

#### AuditLog

```typescript
import { AuditLog, IAuditLog } from '@monshy/database';

// Create audit log
const auditLog = new AuditLog({
  action: 'workflow.created',
  resource: 'workflow',
  resourceId: '507f1f77bcf86cd799439011',
  tenantId: '507f191e810c19729de860ea',
  userId: '507f1f77bcf86cd799439012',
  metadata: {
    workflowName: 'My Workflow'
  }
});
await auditLog.save();

// Retrieve audit logs
const logsByTenant = await AuditLog.find({ tenantId: tenantId })
  .sort({ createdAt: -1 })
  .limit(100);
```

**Interface:**
```typescript
interface IAuditLog {
  action: string;
  resource: string;
  resourceId: string;
  tenantId: string;
  userId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

---

#### WorkflowComment

```typescript
import { WorkflowComment, IWorkflowComment } from '@monshy/database';

// Create comment
const comment = new WorkflowComment({
  workflowId: '507f1f77bcf86cd799439011',
  userId: '507f1f77bcf86cd799439012',
  text: 'Great workflow!',
  tenantId: '507f191e810c19729de860ea'
});
await comment.save();

// Retrieve comments
const comments = await WorkflowComment.find({ workflowId: workflowId })
  .sort({ createdAt: -1 });
```

**Interface:**
```typescript
interface IWorkflowComment {
  workflowId: string;
  userId: string;
  text: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

#### SupportConsent

```typescript
import { SupportConsent, ISupportConsent } from '@monshy/database';

// Create support consent
const consent = new SupportConsent({
  tenantId: '507f191e810c19729de860ea',
  grantedBy: '507f1f77bcf86cd799439012',
  expiresAt: new Date('2024-12-31'),
  isActive: true
});
await consent.save();
```

**Interface:**
```typescript
interface ISupportConsent {
  tenantId: string;
  grantedBy: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 💡 Usage Examples

### Service Startup with Database Connection

```typescript
import { connectDatabase } from '@monshy/database';
import { logger } from '@monshy/core';

async function start() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start service
    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Service started');
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start service');
    process.exit(1);
  }
}

start();
```

### User Management

```typescript
import { User, IUser } from '@monshy/database';
import bcrypt from 'bcrypt';

// Create user
async function createUser(email: string, password: string, tenantId: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = new User({
    email,
    passwordHash,
    tenantId,
    roles: ['user'],
    isActive: true
  });
  
  await user.save();
  return user;
}

// Find user
async function getUserByEmail(email: string): Promise<IUser | null> {
  return await User.findOne({ email: email.toLowerCase() });
}

// Update user
async function updateUser(userId: string, updates: Partial<IUser>) {
  return await User.findByIdAndUpdate(userId, updates, { new: true });
}

// Deactivate user
async function deactivateUser(userId: string) {
  return await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
}
```

### Workflow Management

```typescript
import { Workflow, IWorkflow } from '@monshy/database';

// Create workflow
async function createWorkflow(data: {
  name: string;
  description?: string;
  userId: string;
  tenantId: string;
  nodes: any[];
  edges: any[];
}) {
  const workflow = new Workflow({
    ...data,
    version: 1,
    isPublished: false,
    isActive: true
  });
  
  await workflow.save();
  return workflow;
}

// Publish workflow
async function publishWorkflow(workflowId: string) {
  return await Workflow.findByIdAndUpdate(
    workflowId,
    { 
      isPublished: true, 
      publishedAt: new Date() 
    },
    { new: true }
  );
}

// Get workflows by tenant
async function getWorkflowsByTenant(tenantId: string) {
  return await Workflow.find({ tenantId, isActive: true })
    .sort({ updatedAt: -1 });
}

// Get published workflows
async function getPublishedWorkflows(limit: number = 10) {
  return await Workflow.find({ isPublished: true, isActive: true })
    .sort({ publishedAt: -1 })
    .limit(limit);
}
```

### Query Patterns

```typescript
import { User, Workflow } from '@monshy/database';

// Pagination
async function getUsersPaginated(tenantId: string, page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize;
  
  const [items, total] = await Promise.all([
    User.find({ tenantId })
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }),
    User.countDocuments({ tenantId })
  ]);
  
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

// Aggregation
async function getWorkflowStats(tenantId: string) {
  const stats = await Workflow.aggregate([
    { $match: { tenantId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        published: { $sum: { $cond: ['$isPublished', 1, 0] } },
        active: { $sum: { $cond: ['$isActive', 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || { total: 0, published: 0, active: 0 };
}

// Populate (when references exist)
// Example: Workflow with user info
const workflow = await Workflow.findById(workflowId)
  .populate('userId', 'email firstName lastName');
```

### Graceful Shutdown

```typescript
import { disconnectDatabase } from '@monshy/database';
import { logger } from '@monshy/core';

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Disconnect database
  await disconnectDatabase();
  
  // Terminate service
  process.exit(0);
});
```

---

## 🔧 Environment Variables

### MongoDB Connection

```bash
# MongoDB Connection String
MONGODB_URL=mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin

# Alternative (for .NET compatibility)
MongoDbSettings__ConnectionString=mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin

# Azure Cosmos DB example
MONGODB_URL=mongodb://account:key@account.mongo.cosmos.azure.com:10255/MonshyFlow?ssl=true&replicaSet=globaldb
```

### Connection String Format

```
mongodb://[username:password@]host[:port]/[database][?options]
```

**Examples:**
- Local: `mongodb://localhost:27017/MonshyFlow`
- With Auth: `mongodb://admin:password@localhost:27017/MonshyFlow?authSource=admin`
- Azure Cosmos DB: `mongodb://account:key@account.mongo.cosmos.azure.com:10255/MonshyFlow?ssl=true`

---

## 📦 Dependencies

### Runtime Dependencies

- `@monshy/core` workspace:* - Base utilities
- `mongoose` ^8.19.1 - MongoDB ODM

### Dev Dependencies

- `typescript` ^5.9.3
- `@types/node` ^24.7.1

---

## 🛠️ Development

### Build

```bash
cd packages/database
pnpm build
```

### Watch Mode

```bash
cd packages/database
pnpm dev
```

### Clean

```bash
cd packages/database
pnpm clean
```

### Code Structure

```
database/
├── src/
│   ├── connection.ts      # Connection Management
│   ├── models/            # Mongoose Models
│   │   ├── User.ts
│   │   ├── Workflow.ts
│   │   ├── Tenant.ts
│   │   ├── ApiKey.ts
│   │   ├── Secret.ts
│   │   ├── AuditLog.ts
│   │   ├── WorkflowComment.ts
│   │   ├── SupportConsent.ts
│   │   └── index.ts
│   ├── repositories/      # Repository Pattern (currently empty)
│   │   └── index.ts
│   ├── utils/             # Utilities
│   │   └── logger.ts
│   └── index.ts           # Main Export
├── dist/                   # Compiled JavaScript
└── package.json
```

---

## 🔗 Further Information

- **Mongoose Documentation:** [mongoosejs.com](https://mongoosejs.com/)
- **MongoDB Documentation:** [docs.mongodb.com](https://docs.mongodb.com/)
- **Azure Cosmos DB:** [docs.microsoft.com/azure/cosmos-db](https://docs.microsoft.com/azure/cosmos-db/)
- **Packages Overview:** See [`../README.md`](../README.md)

---

## 📄 License

See root repository for license information.
