# 🗄️ @monshy/database

Das **@monshy/database** Package verwaltet MongoDB-Verbindungen, Mongoose-Models und Datenzugriff für die MonshyFlow-Plattform. Es bietet eine zentrale Datenbank-Schicht für alle Services.

---

## 📋 Inhaltsverzeichnis

- [Übersicht](#-übersicht)
- [Installation](#-installation)
- [API-Dokumentation](#-api-dokumentation)
- [Models](#-models)
- [Verwendungsbeispiele](#-verwendungsbeispiele)
- [Environment Variables](#-environment-variables)
- [Dependencies](#-dependencies)
- [Development](#-development)

---

## 🎯 Übersicht

`@monshy/database` ist ein **Shared Package** (Library), das folgende Funktionalitäten bereitstellt:

- **Connection Management:** MongoDB-Verbindungsverwaltung
- **Mongoose Models:** Alle Datenbank-Models (User, Workflow, Tenant, etc.)
- **TypeScript Interfaces:** Type-safe Model-Definitionen
- **Azure Cosmos DB Support:** Kompatibilität mit Azure Cosmos DB (MongoDB API)

**Dependencies:**
- `@monshy/core` - Basis-Utilities
- `mongoose` ^8.19.1 - MongoDB ODM

**Unterstützte Datenbanken:**
- MongoDB (lokal oder Remote)
- Azure Cosmos DB (MongoDB API)

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
    "@monshy/database": "workspace:*"
  }
}
```

```typescript
import { connectDatabase, User, Workflow } from '@monshy/database';
```

---

## 📚 API-Dokumentation

### Connection Management

#### connectDatabase

Stellt eine Verbindung zur MongoDB her.

```typescript
import { connectDatabase } from '@monshy/database';

// Beim Service-Start
await connectDatabase();
// ✅ MongoDB connected
```

**Features:**
- Automatische Verbindungsprüfung (verhindert doppelte Verbindungen)
- Azure Cosmos DB Kompatibilität
- Automatische Retry-Logik
- Logging der Verbindungsart

**Environment Variables:**
- `MONGODB_URL` - MongoDB Connection String
- `MongoDbSettings__ConnectionString` - Alternative (für .NET Kompatibilität)

**Standard Connection Strings:**
- **Production:** `mongodb://admin:admin123@MonshyFlow-mongodb:27017/MonshyFlow?authSource=admin`
- **Development:** `mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin`

**Azure Cosmos DB:**
- Automatische Erkennung (enthält `cosmos.azure.com`)
- `retryWrites: false` wird automatisch gesetzt (Cosmos DB Anforderung)

---

#### disconnectDatabase

Trennt die Verbindung zur MongoDB.

```typescript
import { disconnectDatabase } from '@monshy/database';

// Beim Service-Shutdown
await disconnectDatabase();
// MongoDB disconnected
```

**Verwendung:**
- Graceful Shutdown
- Testing (Cleanup)
- Service-Restart

---

### Models

Alle Models werden als Mongoose Models exportiert und können direkt verwendet werden.

#### User

```typescript
import { User, IUser } from '@monshy/database';

// User erstellen
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

// User finden
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

// Workflow erstellen
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

// Workflow finden
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
  // ... weitere Felder
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

// Tenant erstellen
const tenant = new Tenant({
  name: 'My Company',
  domain: 'mycompany.com',
  isActive: true
});
await tenant.save();

// Tenant finden
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

// API Key erstellen
const apiKey = new ApiKey({
  keyHash: 'hashed-api-key',
  name: 'Production API Key',
  description: 'API Key for production use',
  tenantId: '507f191e810c19729de860ea',
  isActive: true,
  expiresAt: new Date('2025-12-31')
});
await apiKey.save();

// API Key finden
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

// Secret erstellen
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

// Secret finden
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

// Audit Log erstellen
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

// Audit Logs abrufen
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

// Kommentar erstellen
const comment = new WorkflowComment({
  workflowId: '507f1f77bcf86cd799439011',
  userId: '507f1f77bcf86cd799439012',
  text: 'Great workflow!',
  tenantId: '507f191e810c19729de860ea'
});
await comment.save();

// Kommentare abrufen
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

// Support Consent erstellen
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

## 💡 Verwendungsbeispiele

### Service-Start mit Database Connection

```typescript
import { connectDatabase } from '@monshy/database';
import { logger } from '@monshy/core';

async function start() {
  try {
    // Database verbinden
    await connectDatabase();
    
    // Service starten
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

// User erstellen
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

// User finden
async function getUserByEmail(email: string): Promise<IUser | null> {
  return await User.findOne({ email: email.toLowerCase() });
}

// User aktualisieren
async function updateUser(userId: string, updates: Partial<IUser>) {
  return await User.findByIdAndUpdate(userId, updates, { new: true });
}

// User deaktivieren
async function deactivateUser(userId: string) {
  return await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
}
```

### Workflow Management

```typescript
import { Workflow, IWorkflow } from '@monshy/database';

// Workflow erstellen
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

// Workflow veröffentlichen
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

// Workflows nach Tenant abrufen
async function getWorkflowsByTenant(tenantId: string) {
  return await Workflow.find({ tenantId, isActive: true })
    .sort({ updatedAt: -1 });
}

// Veröffentlichte Workflows abrufen
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

// Populate (wenn Referenzen vorhanden)
// Beispiel: Workflow mit User-Info
const workflow = await Workflow.findById(workflowId)
  .populate('userId', 'email firstName lastName');
```

### Graceful Shutdown

```typescript
import { disconnectDatabase } from '@monshy/database';
import { logger } from '@monshy/core';

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Database trennen
  await disconnectDatabase();
  
  // Service beenden
  process.exit(0);
});
```

---

## 🔧 Environment Variables

### MongoDB Connection

```bash
# MongoDB Connection String
MONGODB_URL=mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin

# Alternative (für .NET Kompatibilität)
MongoDbSettings__ConnectionString=mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin

# Azure Cosmos DB Beispiel
MONGODB_URL=mongodb://account:key@account.mongo.cosmos.azure.com:10255/MonshyFlow?ssl=true&replicaSet=globaldb
```

### Connection String Format

```
mongodb://[username:password@]host[:port]/[database][?options]
```

**Beispiele:**
- Lokal: `mongodb://localhost:27017/MonshyFlow`
- Mit Auth: `mongodb://admin:password@localhost:27017/MonshyFlow?authSource=admin`
- Azure Cosmos DB: `mongodb://account:key@account.mongo.cosmos.azure.com:10255/MonshyFlow?ssl=true`

---

## 📦 Dependencies

### Runtime Dependencies

- `@monshy/core` workspace:* - Basis-Utilities
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
│   ├── repositories/      # Repository Pattern (zur Zeit leer)
│   │   └── index.ts
│   ├── utils/             # Utilities
│   │   └── logger.ts
│   └── index.ts           # Main Export
├── dist/                   # Compiled JavaScript
└── package.json
```

---

## 🔗 Weitere Informationen

- **Mongoose Documentation:** [mongoosejs.com](https://mongoosejs.com/)
- **MongoDB Documentation:** [docs.mongodb.com](https://docs.mongodb.com/)
- **Azure Cosmos DB:** [docs.microsoft.com/azure/cosmos-db](https://docs.microsoft.com/azure/cosmos-db/)
- **Packages Overview:** Siehe [`../README.md`](../README.md)

---

## 📄 Lizenz

Siehe Root-Repository für Lizenzinformationen.

