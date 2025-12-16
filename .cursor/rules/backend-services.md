# Backend Services - Development Rules

**Kritische Regeln für die Weiterentwicklung der Backend-Services**

---

## 🎯 Überblick

Das Backend verwendet eine **Clean Architecture** mit **Dependency Injection** (TSyringe) und **Shared Packages** für wiederverwendbaren Code. Diese Rules stellen sicher, dass die Architektur konsistent bleibt und das System stabil funktioniert.

**Kernprinzipien:**
1. **Clean Architecture** - Controllers → Services → Repositories
2. **Dependency Injection** - TSyringe für lose Kopplung
3. **Shared Packages** - Wiederverwendbarer Code (@monshy/core, @monshy/database, @monshy/auth)
4. **Type Safety** - TypeScript überall, Zod für Validation
5. **Error Handling** - Custom Error Classes
6. **Logging** - Strukturiertes Logging mit Pino
7. **Security** - Rate Limiting, Security Headers, Auth Middleware

---

## 🏗️ Architektur-Übersicht

### Service-Struktur

```
Service (z.B. api-service)
├── src/
│   ├── controllers/        # HTTP Controllers (dünn, delegieren an Services)
│   ├── services/           # Business Logic
│   ├── repositories/       # Data Access Layer
│   ├── routes/            # Express Routes
│   ├── middleware/        # Auth, Error Handling, Logging
│   ├── services/container.ts  # Dependency Injection Container
│   └── index.ts           # Entry Point
```

### Shared Packages

- **@monshy/core** - Logger, Validation, Errors, Utils, Security Middleware
- **@monshy/database** - Mongoose Models, Repositories, Connection
- **@monshy/auth** - JWT, API Keys, Auth Middleware

---

## ⚠️ KRITISCHE REGELN - NIE VERLETZEN

> **🔴 PRIORITÄT 1 - System-Breaking:** Diese Regeln müssen IMMER eingehalten werden. Verletzung führt zu System-Fehlern oder Sicherheitslücken.

### 1. Clean Architecture - Schichten-Trennung

**❌ NIE:**
```typescript
// Controller macht Business Logic
@injectable()
export class WorkflowController {
  async createWorkflow(req: Request, res: Response) {
    // FALSCH: Business Logic im Controller
    const workflow = await WorkflowModel.create(req.body);
    if (workflow.tenantId !== req.user.tenantId) {
      throw new Error('Forbidden');
    }
    res.json(workflow);
  }
}

// Service macht Database Calls direkt
@injectable()
export class WorkflowService {
  async create(data: CreateWorkflowDto) {
    // FALSCH: Direkter Database Call
    return await WorkflowModel.create(data);
  }
}
```

**✅ IMMER:**
```typescript
// Controller: Nur HTTP-Handling
@injectable()
export class WorkflowController {
  constructor(
    @inject('WorkflowService') private workflowService: WorkflowService
  ) {}

  async createWorkflow(req: Request, res: Response) {
    const workflow = await this.workflowService.create({
      ...req.body,
      tenantId: req.user.tenantId,
      userId: req.user.id,
    });
    res.json({ success: true, data: workflow });
  }
}

// Service: Business Logic
@injectable()
export class WorkflowService {
  constructor(
    @inject('WorkflowRepository') private workflowRepo: WorkflowRepository
  ) {}

  async create(data: CreateWorkflowDto) {
    // Business Logic hier
    if (!data.userId) {
      throw new ValidationError('userId is required');
    }
    return this.workflowRepo.create(data);
  }
}

// Repository: Data Access
@injectable()
export class WorkflowRepository {
  async create(data: CreateWorkflowDto) {
    return WorkflowModel.create(data);
  }
}
```

**Warum:** Klare Trennung ermöglicht Testbarkeit, Wartbarkeit und Wiederverwendbarkeit.

---

### 2. Dependency Injection - TSyringe

**❌ NIE:**
```typescript
// Direkte Instanziierung
export class WorkflowService {
  private workflowRepo = new WorkflowRepository(); // FALSCH!
}

// Container nicht verwenden
const service = new WorkflowService(); // FALSCH!
```

**✅ IMMER:**
```typescript
// @injectable() Decorator
@injectable()
export class WorkflowService {
  constructor(
    @inject('WorkflowRepository') private workflowRepo: WorkflowRepository
  ) {}
}

// Container registrieren
// services/container.ts
container.register('WorkflowRepository', { useClass: WorkflowRepository });
container.register('WorkflowService', { useClass: WorkflowService });

// Container verwenden
const service = container.resolve(WorkflowService);
```

**Warum:** Dependency Injection ermöglicht lose Kopplung, Testbarkeit und einfache Mocking.

---

### 3. Shared Packages verwenden

**❌ NIE:**
```typescript
// Logger in jedem Service neu erstellen
import pino from 'pino';
const logger = pino({...}); // FALSCH!

// Validation ohne Zod
if (!data.email || !data.email.includes('@')) {
  throw new Error('Invalid email'); // FALSCH!
}

// Custom Error ohne Shared Error Classes
throw new Error('Not found'); // FALSCH!
```

**✅ IMMER:**
```typescript
// Logger aus @monshy/core
import { logger } from '@monshy/core';
logger.info({ workflowId }, 'Workflow created');

// Validation mit Zod (aus @monshy/core)
import { ValidationMiddleware } from '@monshy/core';
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});
router.post('/', ValidationMiddleware(schema), controller.create);

// Custom Errors
import { NotFoundError, ValidationError } from '@monshy/core';
if (!workflow) {
  throw new NotFoundError('Workflow', id);
}
```

**Warum:** Shared Packages verhindern Code-Duplikation und sorgen für Konsistenz.

---

### 4. Input Validation - Zod

**❌ NIE:**
```typescript
// Keine Validation
async createWorkflow(req: Request, res: Response) {
  const workflow = await this.service.create(req.body); // FALSCH!
}

// Manuelle Validation
if (!req.body.name || req.body.name.length < 1) {
  throw new Error('Name required'); // FALSCH!
}
```

**✅ IMMER:**
```typescript
// Zod Schema definieren
const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  tenantId: z.string(),
  userId: z.string(),
});

// Validation Middleware verwenden
router.post(
  '/',
  ValidationMiddleware(CreateWorkflowSchema),
  controller.createWorkflow
);

// Im Service: Zusätzliche Business-Validation
async create(data: CreateWorkflowDto) {
  if (!data.userId) {
    throw new ValidationError('userId is required');
  }
  // ...
}
```

**Warum:** Zod stellt sicher, dass Inputs korrekt validiert werden, bevor sie verarbeitet werden.

---

### 5. Error Handling - Custom Error Classes

**❌ NIE:**
```typescript
// Generic Errors
throw new Error('Not found'); // FALSCH!
throw new Error('Validation failed'); // FALSCH!

// Keine Status Codes
res.status(500).json({ error: 'Something went wrong' }); // FALSCH!
```

**✅ IMMER:**
```typescript
// Custom Error Classes aus @monshy/core
import { NotFoundError, ValidationError, UnauthorizedError } from '@monshy/core';

// Im Service
if (!workflow) {
  throw new NotFoundError('Workflow', id);
}

if (!data.userId) {
  throw new ValidationError('userId is required');
}

if (workflow.tenantId !== user.tenantId) {
  throw new UnauthorizedError('Access denied');
```

**Warum:** Custom Errors haben Status Codes und werden von Error Handler Middleware korrekt behandelt.

---

### 6. Logging - Strukturiertes Logging

**❌ NIE:**
```typescript
// console.log
console.log('Workflow created', workflowId); // FALSCH!

// Unstrukturiertes Logging
logger.info(`Workflow ${workflowId} created by user ${userId}`); // FALSCH!
```

**✅ IMMER:**
```typescript
// Strukturiertes Logging mit Pino
import { logger } from '@monshy/core';

logger.info({ workflowId, userId, tenantId }, 'Workflow created');
logger.error({ error, workflowId }, 'Failed to create workflow');
logger.warn({ workflowId, reason }, 'Workflow creation delayed');
```

**Warum:** Strukturiertes Logging ermöglicht besseres Monitoring, Debugging und Log-Analyse.

---

### 7. Node Data - Immer Object

**❌ NIE:**
```typescript
// Node.data als String speichern
node.data = JSON.stringify({ label: 'test' }); // FALSCH!

// Node.data nicht prüfen
const label = node.data.label; // FALSCH! (kann String sein)
```

**✅ IMMER:**
```typescript
// Node.data ist IMMER Object
// Beim Laden: String → Object konvertieren
if (typeof node.data === 'string') {
  node.data = JSON.parse(node.data);
}

// Beim Speichern: Sicherstellen, dass es Object ist
const sanitizedNode = {
  ...node,
  data: typeof node.data === 'object' && !Array.isArray(node.data)
    ? node.data
    : {},
};

// Im Service
const existingData = node.data && typeof node.data === 'object' 
  ? node.data 
  : {};
```

**Warum:** Backend erwartet Object, nicht String. String führt zu `InvalidCastException`.

---

### 8. Multi-Tenant - Tenant Isolation

**❌ NIE:**
```typescript
// Tenant nicht prüfen
async getWorkflow(id: string) {
  return this.workflowRepo.findById(id); // FALSCH!
}

// Tenant aus Request ignorieren
const workflow = await this.service.create(req.body); // FALSCH!
```

**✅ IMMER:**
```typescript
// Tenant immer prüfen
async getWorkflow(id: string, tenantId: string) {
  const workflow = await this.workflowRepo.findById(id);
  if (!workflow || workflow.tenantId !== tenantId) {
    throw new NotFoundError('Workflow', id);
  }
  return workflow;
}

// Tenant aus Request setzen
const workflow = await this.service.create({
  ...req.body,
  tenantId: req.user.tenantId, // Aus Auth Middleware
  userId: req.user.id,
});
```

**Warum:** Multi-Tenant-Systeme müssen Tenant-Isolation garantieren.

---

## 📦 Shared Packages

### @monshy/core

**Enthält:**
- `logger` - Pino Logger
- `validation` - Zod Validation Middleware
- `errors` - Custom Error Classes
- `utils` - Utility Functions
- `middleware` - Rate Limiter, Security Headers

**Verwendung:**
```typescript
import { logger, ValidationMiddleware, NotFoundError } from '@monshy/core';
```

### @monshy/database

**Enthält:**
- `models` - Mongoose Models
- `repositories` - Repository Pattern Base Classes
- `connection` - MongoDB Connection

**Verwendung:**
```typescript
import { WorkflowModel, UserModel } from '@monshy/database';
```

### @monshy/auth

**Enthält:**
- `jwt` - JWT Utilities
- `apiKey` - API Key Utilities
- `middleware` - Auth Middleware

**Verwendung:**
```typescript
import { verifyJwt, verifyApiKey } from '@monshy/auth';
```

---

## 🔧 Execution Service - Spezielle Regeln

### Node Processor System

**❌ NIE:**
```typescript
// Node Processor manuell aufrufen
if (node.type === 'llm') {
  const result = await processLLMNode(node); // FALSCH!
}

// Node Processor nicht registrieren
// FALSCH: Processor existiert, aber nicht registriert
```

**✅ IMMER:**
```typescript
// Node Processor über Registry verwenden
import { getNodeProcessor } from '../nodes';

const processor = getNodeProcessor(node.type);
if (!processor) {
  throw new Error(`No processor found for node type: ${node.type}`);
}

const result = await processor.process(node, context);
```

**Registrierung:**
```typescript
// nodes/myNewNodeProcessor.ts
import { registerNodeProcessor } from '../nodes';

export async function myNewNodeProcessor(node: Node, context: ExecutionContext) {
  // Processor Logic
}

registerNodeProcessor('my-new-node', myNewNodeProcessor);
```

**Warum:** Registry-System ermöglicht automatische Discovery und einfache Erweiterung.

---

### Tool System

**❌ NIE:**
```typescript
// Tool manuell erstellen
const tool = {
  type: 'function',
  function: {
    name: 'myTool',
    // ...
  }
}; // FALSCH!

// Tool nicht aus Registry laden
```

**✅ IMMER:**
```typescript
// Tool über Registry erstellen
import { getToolCreator } from '../tools';

const toolCreator = getToolCreator(toolType);
if (!toolCreator) {
  throw new Error(`No tool creator found for type: ${toolType}`);
}

const tool = await toolCreator.create(toolConfig, context);
```

**Warum:** Registry-System ist Single Source of Truth für Tools.

---

### Expression Resolution

**❌ NIE:**
```typescript
// Expressions nicht auflösen
const value = node.data.prompt; // FALSCH! (kann Expression sein)

// Expression Resolution manuell
const resolved = eval(expression); // FALSCH! (unsicher)
```

**✅ IMMER:**
```typescript
// Expression Resolution Service verwenden
import { ExpressionResolutionService } from './expressionResolutionService';

const expressionService = new ExpressionResolutionService();
const resolved = await expressionService.resolve(
  node.data.prompt, // Kann Expression sein: {{previousNode.output}}
  context // Enthält previousOutputs, variables, etc.
);
```

**Warum:** Expression Resolution ist komplex und muss sicher sein.

---

### Execution Trace Updates

**❌ NIE:**
```typescript
// Trace direkt in MongoDB schreiben
await ExecutionModel.updateOne(
  { _id: executionId },
  { $push: { trace: traceEntry } }
); // FALSCH! (Race Conditions)

// Trace ohne Queue
execution.trace.push(traceEntry);
await execution.save(); // FALSCH! (Race Conditions)
```

**✅ IMMER:**
```typescript
// Trace über Queue-System (siehe executionService.ts)
private async addTraceEntry(executionId: string, traceEntry: any, execution: Execution) {
  // Queue-basiertes Update (verhindert Race Conditions)
  if (!this.traceEntryQueue.has(executionId)) {
    this.traceEntryQueue.set(executionId, []);
  }
  this.traceEntryQueue.get(executionId)!.push(traceEntry);

  // Debounced MongoDB Update (500ms)
  const timeout = setTimeout(async () => {
    await this.processTraceUpdateQueue(executionId, execution);
  }, 500);
  this.traceUpdateQueue.set(executionId, timeout);
}
```

**Warum:** Queue-System verhindert Race Conditions bei gleichzeitigen Trace-Updates.

---

## 🗄️ Database Patterns

### Mongoose Models

**❌ NIE:**
```typescript
// Model direkt im Service verwenden
import { WorkflowModel } from '@monshy/database';
const workflow = await WorkflowModel.findById(id); // FALSCH!

// Mongoose Document direkt zurückgeben
return await WorkflowModel.findById(id); // FALSCH! (enthält Mongoose-Metadaten)
```

**✅ IMMER:**
```typescript
// Repository Pattern verwenden
@injectable()
export class WorkflowRepository {
  async findById(id: string) {
    const workflow = await WorkflowModel.findById(id);
    return workflow?.toObject(); // Plain Object zurückgeben
  }
}

// Im Service
const workflow = await this.workflowRepo.findById(id);
```

**Warum:** Repository Pattern abstrahiert Database-Zugriff und ermöglicht einfaches Testing.

---

### Tenant Isolation in Queries

**❌ NIE:**
```typescript
// Tenant nicht in Query
const workflows = await WorkflowModel.find({}); // FALSCH!

// Tenant nur im Service prüfen
const workflow = await WorkflowModel.findById(id);
if (workflow.tenantId !== tenantId) { // FALSCH! (unsicher)
  throw new Error('Forbidden');
}
```

**✅ IMMER:**
```typescript
// Tenant immer in Query
const workflows = await WorkflowModel.find({ tenantId });

// Im Repository
async findByTenantId(tenantId: string) {
  return WorkflowModel.find({ tenantId }).lean();
}
```

**Warum:** Tenant-Isolation muss auf Database-Ebene garantiert werden.

---

## 🔒 Security

### Authentication Middleware

**❌ NIE:**
```typescript
// Auth nicht prüfen
router.post('/workflows', controller.create); // FALSCH!

// Auth manuell prüfen
if (!req.headers.authorization) {
  throw new Error('Unauthorized'); // FALSCH!
}
```

**✅ IMMER:**
```typescript
// Auth Middleware verwenden
import { authMiddleware } from '@monshy/auth';

router.post('/workflows', authMiddleware, controller.create);

// Oder Service-spezifisch
import { authMiddleware } from '../middleware/authMiddleware';
router.use(authMiddleware);
```

**Warum:** Auth Middleware stellt sicher, dass alle Requests authentifiziert sind.

---

### Rate Limiting

**❌ NIE:**
```typescript
// Kein Rate Limiting
router.post('/workflows', controller.create); // FALSCH!
```

**✅ IMMER:**
```typescript
// Rate Limiter aus @monshy/core
import { rateLimiter } from '@monshy/core';

router.post('/workflows', rateLimiter, controller.create);
```

**Warum:** Rate Limiting verhindert Abuse und DDoS-Angriffe.

---

### Security Headers

**❌ NIE:**
```typescript
// Keine Security Headers
app.use(express.json()); // FALSCH!
```

**✅ IMMER:**
```typescript
// Security Headers aus @monshy/core
import { securityHeaders } from '@monshy/core';

app.use(securityHeaders);
```

**Warum:** Security Headers schützen vor XSS, Clickjacking, etc.

---

## 🧪 Testing

> **🟡 PRIORITÄT 2 - Qualität:** Tests sollten für kritische Pfade geschrieben werden.

### Dependency Injection für Tests

**✅ RICHTIG:**
```typescript
// Mock Dependencies
container.register('WorkflowRepository', {
  useValue: {
    findById: jest.fn().mockResolvedValue(mockWorkflow),
  },
});

// Service testen
const service = container.resolve(WorkflowService);
const result = await service.getById('id');
expect(result).toEqual(mockWorkflow);
```

**Warum:** DI ermöglicht einfaches Mocking für Tests.

### Test-Abdeckung Ziele

**Kritische Pfade (100% Coverage):**
- Node Processors (Execution Service)
- Expression Resolution
- Tenant Isolation
- Input Validation

**Wichtige Pfade (80% Coverage):**
- Services (Business Logic)
- Controllers (HTTP Handling)
- Repositories (Data Access)

**Nice-to-Have (50% Coverage):**
- Utilities
- Helpers
- Middleware

---

## ✅ Checkliste vor Commit

### 🔴 Architektur (MUSS)
- [ ] Clean Architecture eingehalten (Controller → Service → Repository)
- [ ] Dependency Injection verwendet (TSyringe)
- [ ] Shared Packages verwendet (@monshy/core, @monshy/database, @monshy/auth)
- [ ] Keine direkten Database Calls im Service
- [ ] Keine Business Logic im Controller
- [ ] Tenant Isolation garantiert (in Queries und Prüfungen)

### 🔴 Security (MUSS)
- [ ] Auth Middleware auf allen geschützten Routes
- [ ] Rate Limiting aktiviert
- [ ] Security Headers aktiviert
- [ ] Input Validation mit Zod

### 🟡 Validation & Errors (SOLLTE)
- [ ] Custom Error Classes verwendet
- [ ] Error Handler Middleware vorhanden
- [ ] Strukturiertes Logging (Pino)
- [ ] Keine console.log
- [ ] Log-Level korrekt (info, warn, error)

### 🟡 Execution Service (SOLLTE)
- [ ] Node Processors über Registry verwendet
- [ ] Tools über Registry erstellt
- [ ] Expression Resolution verwendet
- [ ] Trace Updates über Queue-System

### 🟡 Database (SOLLTE)
- [ ] Repository Pattern verwendet
- [ ] Tenant in Queries enthalten
- [ ] Mongoose Documents zu Plain Objects konvertiert

---

## 🚨 Häufige Fehler

### 1. Node.data als String

**Symptom:** `InvalidCastException` im Backend

**Lösung:**
```typescript
// Beim Laden: String → Object
if (typeof node.data === 'string') {
  node.data = JSON.parse(node.data);
}

// Beim Speichern: Sicherstellen, dass es Object ist
data: typeof node.data === 'object' ? node.data : {}
```

### 2. Business Logic im Controller

**Symptom:** Controller wird zu groß, schwer testbar

**Lösung:** Business Logic in Service verschieben

### 3. Keine Tenant Isolation

**Symptom:** User kann fremde Workflows sehen

**Lösung:** Tenant immer in Queries und Prüfungen

### 4. Race Conditions bei Trace Updates

**Symptom:** Trace-Einträge fehlen oder sind falsch

**Lösung:** Queue-System verwenden (siehe executionService.ts)

### 5. Keine Input Validation

**Symptom:** Invalid Data führt zu Fehlern

**Lösung:** Zod Validation Middleware verwenden

---

## 🔗 Querverweise zu anderen Rules

- **[Frontend Workflow Rules](../frontend-workflow.md)** - Node Data Format, API Calls
- **[Registry System Rules](../registry-system.md)** - Node Processors, Tools

---

## 📚 Weitere Ressourcen

- `ARCHITECTURE.md` - Vollständige Architektur-Dokumentation
- `DeveloperRoom/EXECUTION_ARCHITECTURE.md` - Execution Service Details
- `DeveloperRoom/REGISTRY_ARCHITECTURE.md` - Registry System
- `packages/core/` - Shared Package Dokumentation

---

**Letzte Aktualisierung:** 15.12.2025  
**Wichtig:** Diese Rules sind kritisch für System-Stabilität und Sicherheit. Bei Unsicherheit: Fragen stellen!

