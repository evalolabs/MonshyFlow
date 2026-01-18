# 🔒 Backend Tenant-Isolation Sicherheitsanalyse

**Datum:** 2025-01-27  
**Status:** ⚠️ **KRITISCHE SICHERHEITSLÜCKEN GEFUNDEN**

---

## 📋 Executive Summary

**Ergebnis:** Das Backend hat **mehrere kritische Sicherheitslücken** bei der Tenant-Isolation. Ein normaler Tenant-User kann auf Daten anderer Tenants zugreifen.

**Risiko-Level:** 🔴 **HOCH** - Datenlecks zwischen Tenants möglich

---

## ✅ Was funktioniert (Gut implementiert)

### 1. Token-Validierung und tenantId-Extraktion ✅

**Middleware:** `packages/api-service/src/middleware/authMiddleware.ts`

```typescript
const payload = verifyToken(token);
(req as any).user = {
  userId: payload.userId,
  tenantId: payload.tenantId,  // ✅ Wird aus Token extrahiert
  email: payload.email,
  role: payload.role,
  authMethod: 'JWT',
};
```

**Status:** ✅ **SICHER** - `tenantId` wird korrekt aus Token extrahiert, nicht aus Request-Body

### 2. Secrets Service ✅

**Controller:** `packages/secrets-service/src/controllers/SecretsController.ts`

```typescript
async getAll(req: Request, res: Response): Promise<void> {
  const user = (req as any).user;
  const secrets = await this.secretsService.getByTenantId(user.tenantId);  // ✅ Filtert nach tenantId
  res.json({ success: true, data: secrets });
}
```

**Status:** ✅ **SICHER** - Filtert korrekt nach `user.tenantId`

### 3. Workflow Execute ✅

**Controller:** `packages/api-service/src/controllers/WorkflowController.ts` (Zeile 250-295)

```typescript
// Security check: User can only execute workflows from their tenant
if (workflow.tenantId !== user.tenantId) {
  logger.warn({ ... }, 'Forbidden: User tried to execute workflow from another tenant');
  res.status(403).json({ success: false, error: 'Forbidden: You can only execute workflows from your own tenant' });
  return;
}
```

**Status:** ✅ **SICHER** - Prüft Tenant-Zugehörigkeit vor Ausführung

### 4. Tenant Controller ✅

**Controller:** `packages/api-service/src/controllers/TenantController.ts` (Zeile 28-53)

```typescript
// Security: User can only access their own tenant
if (user.tenantId !== tenantId) {
  logger.warn({ ... }, 'User attempted to access different tenant');
  res.status(403).json({ success: false, error: 'Forbidden - You can only access your own tenant' });
  return;
}
```

**Status:** ✅ **SICHER** - Prüft Tenant-Zugehörigkeit

---

## 🔴 KRITISCHE SICHERHEITSLÜCKEN

### 1. WorkflowController.getAll() - Query-Parameter-Manipulation

**Datei:** `packages/api-service/src/controllers/WorkflowController.ts` (Zeile 38-47)

**Problem:**
```typescript
async getAll(req: Request, res: Response): Promise<void> {
  const user = (req as any).user;
  // ❌ UNSICHER: Akzeptiert tenantId aus Query-Parameter OHNE Superadmin-Check
  const tenantId = (req.query.tenantId as string) || user.tenantId;
  const workflows = await this.workflowService.getAll(tenantId);
  // ...
}
```

**Angriffsszenario:**
1. Normaler User (Tenant A) ruft auf: `GET /api/workflows?tenantId=tenant-b-id`
2. Backend verwendet `tenant-b-id` statt `user.tenantId`
3. User sieht alle Workflows von Tenant B

**Risiko:** 🔴 **HOCH** - Jeder User kann Daten anderer Tenants sehen

**Fix:**
```typescript
async getAll(req: Request, res: Response): Promise<void> {
  const user = (req as any).user;
  
  // ✅ Superadmin kann tenantId-Parameter übergeben
  let tenantId = user.tenantId;
  if (req.query.tenantId && user.role === 'superadmin') {
    tenantId = req.query.tenantId as string;
  }
  
  const workflows = await this.workflowService.getAll(tenantId);
  res.json({ success: true, data: workflows.map(w => this.toJSON(w)) });
}
```

---

### 2. WorkflowController.getById() - Keine Tenant-Prüfung

**Datei:** `packages/api-service/src/controllers/WorkflowController.ts` (Zeile 54-72)

**Problem:**
```typescript
async getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const workflow = await this.workflowService.getById(id);  // ❌ Keine Tenant-Prüfung
  
  if (!workflow) {
    throw new NotFoundError('Workflow', id);
  }
  
  res.json({ success: true, data: this.toJSON(workflow) });  // ❌ Gibt Workflow zurück, auch wenn es zu anderem Tenant gehört
}
```

**Angriffsszenario:**
1. User (Tenant A) kennt Workflow-ID von Tenant B (z.B. durch Enumeration)
2. Ruft auf: `GET /api/workflows/{tenant-b-workflow-id}`
3. Backend gibt Workflow zurück, obwohl es zu Tenant B gehört

**Risiko:** 🔴 **HOCH** - User kann Workflows anderer Tenants lesen

**Fix:**
```typescript
async getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = (req as any).user;
  const workflow = await this.workflowService.getById(id);
  
  if (!workflow) {
    throw new NotFoundError('Workflow', id);
  }
  
  // ✅ Prüfe Tenant-Zugehörigkeit (außer Superadmin)
  const workflowObj = workflow.toObject ? workflow.toObject() : workflow;
  if (user.role !== 'superadmin' && workflowObj.tenantId !== user.tenantId) {
    logger.warn({ 
      requestedWorkflowId: id, 
      userTenantId: user.tenantId, 
      workflowTenantId: workflowObj.tenantId 
    }, 'Forbidden: User tried to access workflow from another tenant');
    res.status(403).json({ 
      success: false, 
      error: 'Forbidden: You can only access workflows from your own tenant' 
    });
    return;
  }
  
  res.json({ success: true, data: this.toJSON(workflow) });
}
```

---

### 3. WorkflowController.update() - Keine Tenant-Prüfung

**Datei:** `packages/api-service/src/controllers/WorkflowController.ts` (Zeile 90-104)

**Problem:**
```typescript
async update(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const workflow = await this.workflowService.update(id, req.body);  // ❌ Keine Tenant-Prüfung
  logger.info({ workflowId: id }, 'Workflow updated');
  res.json({ success: true, data: this.toJSON(workflow) });
}
```

**Angriffsszenario:**
1. User (Tenant A) kennt Workflow-ID von Tenant B
2. Ruft auf: `PUT /api/workflows/{tenant-b-workflow-id}` mit eigenen Daten
3. Backend aktualisiert Workflow von Tenant B

**Risiko:** 🔴 **KRITISCH** - User kann Workflows anderer Tenants bearbeiten/löschen

**Fix:**
```typescript
async update(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = (req as any).user;
  
  // ✅ Prüfe Tenant-Zugehörigkeit VOR Update
  const existingWorkflow = await this.workflowService.getById(id);
  if (!existingWorkflow) {
    throw new NotFoundError('Workflow', id);
  }
  
  const workflowObj = existingWorkflow.toObject ? existingWorkflow.toObject() : existingWorkflow;
  if (user.role !== 'superadmin' && workflowObj.tenantId !== user.tenantId) {
    logger.warn({ 
      requestedWorkflowId: id, 
      userTenantId: user.tenantId, 
      workflowTenantId: workflowObj.tenantId 
    }, 'Forbidden: User tried to update workflow from another tenant');
    res.status(403).json({ 
      success: false, 
      error: 'Forbidden: You can only update workflows from your own tenant' 
    });
    return;
  }
  
  const workflow = await this.workflowService.update(id, req.body);
  logger.info({ workflowId: id }, 'Workflow updated');
  res.json({ success: true, data: this.toJSON(workflow) });
}
```

---

### 4. WorkflowController.delete() - Keine Tenant-Prüfung

**Datei:** `packages/api-service/src/controllers/WorkflowController.ts` (Zeile 106-120)

**Problem:**
```typescript
async delete(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await this.workflowService.delete(id);  // ❌ Keine Tenant-Prüfung
  logger.info({ workflowId: id }, 'Workflow deleted');
  res.status(204).send();
}
```

**Angriffsszenario:**
1. User (Tenant A) kennt Workflow-ID von Tenant B
2. Ruft auf: `DELETE /api/workflows/{tenant-b-workflow-id}`
3. Backend löscht Workflow von Tenant B

**Risiko:** 🔴 **KRITISCH** - User kann Workflows anderer Tenants löschen

**Fix:**
```typescript
async delete(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = (req as any).user;
  
  // ✅ Prüfe Tenant-Zugehörigkeit VOR Delete
  const existingWorkflow = await this.workflowService.getById(id);
  if (!existingWorkflow) {
    throw new NotFoundError('Workflow', id);
  }
  
  const workflowObj = existingWorkflow.toObject ? existingWorkflow.toObject() : existingWorkflow;
  if (user.role !== 'superadmin' && workflowObj.tenantId !== user.tenantId) {
    logger.warn({ 
      requestedWorkflowId: id, 
      userTenantId: user.tenantId, 
      workflowTenantId: workflowObj.tenantId 
    }, 'Forbidden: User tried to delete workflow from another tenant');
    res.status(403).json({ 
      success: false, 
      error: 'Forbidden: You can only delete workflows from your own tenant' 
    });
    return;
  }
  
  await this.workflowService.delete(id);
  logger.info({ workflowId: id }, 'Workflow deleted');
  res.status(204).send();
}
```

---

### 5. WorkflowController.getPublished() - Query-Parameter-Manipulation

**Datei:** `packages/api-service/src/controllers/WorkflowController.ts` (Zeile 210-223)

**Problem:**
```typescript
async getPublished(req: Request, res: Response): Promise<void> {
  const user = (req as any).user;
  // ❌ UNSICHER: Akzeptiert tenantId aus Query-Parameter OHNE Superadmin-Check
  const tenantId = (req.query.tenantId as string) || user?.tenantId;
  const workflows = await this.workflowService.getPublished(tenantId);
  // ...
}
```

**Risiko:** 🔴 **HOCH** - Gleiches Problem wie `getAll()`

**Fix:** Gleiche Lösung wie bei `getAll()` - Superadmin-Check hinzufügen

---

### 6. AdminController.getAllUsers() - Query-Parameter-Manipulation

**Datei:** `packages/api-service/src/controllers/AdminController.ts` (Zeile 49-61)

**Problem:**
```typescript
async getAllUsers(req: Request, res: Response): Promise<void> {
  const tenantId = req.query.tenantId as string | undefined;  // ❌ Kein Superadmin-Check
  const users = await this.adminService.getAllUsers(tenantId);
  res.json({ success: true, data: users.map(u => this.userToJSON(u)) });
}
```

**Angriffsszenario:**
1. Normaler Admin (Tenant A) ruft auf: `GET /api/admin/users?tenantId=tenant-b-id`
2. Backend gibt alle Users von Tenant B zurück

**Risiko:** 🔴 **HOCH** - User kann Benutzer anderer Tenants sehen

**Fix:**
```typescript
async getAllUsers(req: Request, res: Response): Promise<void> {
  const user = (req as any).user;
  
  // ✅ Superadmin kann tenantId-Parameter übergeben, normale Admins nur eigenen Tenant
  let tenantId: string | undefined = undefined;
  if (req.query.tenantId) {
    if (user.role === 'superadmin') {
      tenantId = req.query.tenantId as string;
    } else {
      // Normale Admins können nur eigenen Tenant sehen
      tenantId = user.tenantId;
    }
  } else {
    // Wenn kein Parameter, verwende User's Tenant (außer Superadmin)
    tenantId = user.role === 'superadmin' ? undefined : user.tenantId;
  }
  
  const users = await this.adminService.getAllUsers(tenantId);
  res.json({ success: true, data: users.map(u => this.userToJSON(u)) });
}
```

---

### 7. AdminController.getStatistics() - Keine Tenant-Filterung

**Datei:** `packages/api-service/src/controllers/AdminController.ts` (Zeile 39-47)

**Problem:**
```typescript
async getStatistics(req: Request, res: Response): Promise<void> {
  const statistics = await this.adminService.getStatistics();  // ❌ Keine Tenant-Filterung
  res.json({ success: true, data: statistics });
}
```

**Service:** `packages/api-service/src/services/AdminService.ts` (Zeile 64-103)

```typescript
async getStatistics(): Promise<Statistics> {
  const [
    totalUsers,
    totalTenants,
    totalWorkflows,
    totalSecrets,
    // ... ❌ Zählt ALLE Tenants, nicht nur eigenen Tenant
  ] = await Promise.all([
    User.countDocuments(),  // ❌ Alle Users
    Tenant.countDocuments(),  // ❌ Alle Tenants
    Workflow.countDocuments(),  // ❌ Alle Workflows
    Secret.countDocuments(),  // ❌ Alle Secrets
    // ...
  ]);
}
```

**Angriffsszenario:**
1. Normaler Admin (Tenant A) ruft auf: `GET /api/admin/statistics`
2. Backend gibt Statistiken für ALLE Tenants zurück (systemweit)

**Risiko:** 🟡 **MITTEL** - User sieht systemweite Statistiken (weniger kritisch, aber unerwünscht)

**Fix:**
```typescript
// Controller
async getStatistics(req: Request, res: Response): Promise<void> {
  const user = (req as any).user;
  const statistics = await this.adminService.getStatistics(user.tenantId, user.role);
  res.json({ success: true, data: statistics });
}

// Service
async getStatistics(tenantId?: string, userRole?: string): Promise<Statistics> {
  const isSuperAdmin = userRole === 'superadmin';
  const tenantFilter = isSuperAdmin ? {} : { tenantId };
  
  const [
    totalUsers,
    totalTenants,
    totalWorkflows,
    totalSecrets,
    activeUsers,
    activeTenants,
    publishedWorkflows,
    superAdmins,
    admins,
  ] = await Promise.all([
    User.countDocuments(tenantFilter),
    isSuperAdmin ? Tenant.countDocuments() : Promise.resolve(0),  // Nur Superadmin sieht alle Tenants
    Workflow.countDocuments(tenantFilter),
    Secret.countDocuments(tenantFilter),
    User.countDocuments({ ...tenantFilter, isActive: true }),
    isSuperAdmin ? Tenant.countDocuments({ isActive: true }) : Promise.resolve(0),
    Workflow.countDocuments({ ...tenantFilter, isPublished: true }),
    isSuperAdmin ? User.countDocuments({ roles: { $in: [ROLES.SUPERADMIN] } }) : Promise.resolve(0),
    isSuperAdmin ? User.countDocuments({ roles: { $in: [ROLES.ADMIN] } }) : Promise.resolve(0),
  ]);
  
  // ...
}
```

---

### 8. AdminController.getUserById() - Keine Tenant-Prüfung

**Datei:** `packages/api-service/src/controllers/AdminController.ts` (Zeile 63-76)

**Problem:**
```typescript
async getUserById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = await this.adminService.getUserById(id);  // ❌ Keine Tenant-Prüfung
  res.json({ success: true, data: this.userToJSON(user) });
}
```

**Risiko:** 🔴 **HOCH** - User kann Benutzer anderer Tenants sehen

**Fix:** Tenant-Prüfung hinzufügen (außer Superadmin)

---

### 9. WorkflowController.updateStartNode() / updateNode() - Keine Tenant-Prüfung

**Datei:** `packages/api-service/src/controllers/WorkflowController.ts` (Zeile 122-187)

**Problem:**
```typescript
async updateStartNode(req: Request, res: Response): Promise<void> {
  const { workflowId, nodeId } = req.body;
  // ❌ Keine Tenant-Prüfung
  await this.workflowService.updateStartNode(workflowId, nodeId, config);
  // ...
}
```

**Risiko:** 🔴 **HOCH** - User kann Nodes in Workflows anderer Tenants bearbeiten

**Fix:** Tenant-Prüfung vor Update hinzufügen

---

## 📊 Zusammenfassung der Sicherheitslücken

| Endpoint | Problem | Risiko | Status |
|----------|---------|--------|--------|
| `GET /api/workflows` | Query-Parameter-Manipulation | 🔴 Hoch | ❌ UNSICHER |
| `GET /api/workflows/:id` | Keine Tenant-Prüfung | 🔴 Hoch | ❌ UNSICHER |
| `PUT /api/workflows/:id` | Keine Tenant-Prüfung | 🔴 Kritisch | ❌ UNSICHER |
| `DELETE /api/workflows/:id` | Keine Tenant-Prüfung | 🔴 Kritisch | ❌ UNSICHER |
| `GET /api/workflows/published` | Query-Parameter-Manipulation | 🔴 Hoch | ❌ UNSICHER |
| `PUT /api/workflows/start-node` | Keine Tenant-Prüfung | 🔴 Hoch | ❌ UNSICHER |
| `PUT /api/workflows/node` | Keine Tenant-Prüfung | 🔴 Hoch | ❌ UNSICHER |
| `GET /api/admin/users` | Query-Parameter-Manipulation | 🔴 Hoch | ❌ UNSICHER |
| `GET /api/admin/users/:id` | Keine Tenant-Prüfung | 🔴 Hoch | ❌ UNSICHER |
| `GET /api/admin/statistics` | Keine Tenant-Filterung | 🟡 Mittel | ❌ UNSICHER |
| `GET /api/secrets` | ✅ Korrekt | ✅ Sicher | ✅ OK |
| `POST /api/workflows/:id/execute` | ✅ Korrekt | ✅ Sicher | ✅ OK |

---

## 🛠️ Empfohlene Fixes (Priorisiert)

### Phase 1: Kritisch (Sofort)

1. **WorkflowController.update()** - Tenant-Prüfung hinzufügen
2. **WorkflowController.delete()** - Tenant-Prüfung hinzufügen
3. **WorkflowController.getById()** - Tenant-Prüfung hinzufügen

### Phase 2: Hoch (Bald)

4. **WorkflowController.getAll()** - Superadmin-Check für Query-Parameter
5. **WorkflowController.getPublished()** - Superadmin-Check für Query-Parameter
6. **AdminController.getAllUsers()** - Superadmin-Check für Query-Parameter
7. **AdminController.getUserById()** - Tenant-Prüfung hinzufügen
8. **WorkflowController.updateStartNode()** - Tenant-Prüfung hinzufügen
9. **WorkflowController.updateNode()** - Tenant-Prüfung hinzufügen

### Phase 3: Mittel (Nice-to-Have)

10. **AdminController.getStatistics()** - Tenant-Filterung hinzufügen

---

## 🧪 Test-Plan

### Unit-Tests erstellen für:

1. **WorkflowController Tests:**
   - User kann nicht Workflow von anderem Tenant lesen
   - User kann nicht Workflow von anderem Tenant bearbeiten
   - User kann nicht Workflow von anderem Tenant löschen
   - Superadmin kann alle Workflows sehen

2. **AdminController Tests:**
   - Normaler Admin sieht nur eigene Tenant-Users
   - Superadmin kann alle Users sehen
   - Query-Parameter-Manipulation wird blockiert

3. **Integration-Tests:**
   - Tenant-Isolation End-to-End testen
   - Cross-Tenant-Zugriffe blockieren

---

## 📝 Code-Referenzen

### Controller mit Problemen:
- `packages/api-service/src/controllers/WorkflowController.ts`
- `packages/api-service/src/controllers/AdminController.ts`

### Services:
- `packages/api-service/src/services/WorkflowService.ts`
- `packages/api-service/src/services/AdminService.ts`

### Repositories:
- `packages/api-service/src/repositories/WorkflowRepository.ts`

---

## ⚠️ FAZIT

**Status:** 🔴 **KRITISCH** - Mehrere Sicherheitslücken gefunden

**Empfehlung:** 
1. **Sofort:** Phase 1 Fixes implementieren (Update, Delete, GetById)
2. **Diese Woche:** Phase 2 Fixes implementieren
3. **Nächste Woche:** Tests schreiben und validieren

**Risiko:** Ein normaler Tenant-User kann aktuell:
- ❌ Workflows anderer Tenants lesen
- ❌ Workflows anderer Tenants bearbeiten
- ❌ Workflows anderer Tenants löschen
- ❌ Benutzer anderer Tenants sehen
- ❌ Systemweite Statistiken sehen

---

**Erstellt von:** Auto (AI Assistant)  
**Datum:** 2025-01-27

