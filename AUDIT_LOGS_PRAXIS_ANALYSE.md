# 📊 Audit-Logs: Wann erscheinen Logs in der Praxis?

**Datum:** 2025-01-27  
**Status:** ⚠️ **Teilweise implementiert - viele Logs fehlen noch**

---

## ✅ Was aktuell geloggt wird

### 1. Workflow-Zugriffe (Superadmin)

**Wann:** Wenn ein Superadmin auf einen Workflow eines anderen Tenants zugreift

**Aktionen:**
- ✅ `GET /api/workflows/:id` - Superadmin ruft Workflow ab
- ✅ `PUT /api/workflows/:id` - Superadmin aktualisiert Workflow
- ✅ `DELETE /api/workflows/:id` - Superadmin löscht Workflow

**Beispiel:**
```
Superadmin (superadmin@example.com) greift auf Workflow "workflow-123" von Tenant "tenant-456" zu
→ Log: ACCESS, resource: workflow, resourceId: workflow-123, tenantId: tenant-456
```

**Code-Referenz:**
```42:56:packages/api-service/src/controllers/WorkflowController.ts
        this.auditLogService.logSuperAdminAccess({
          userId: user.userId,
          userEmail: user.email,
          action: 'ACCESS',
          resource: 'workflow',
          resourceId: workflowId,
          tenantId: workflowObj.tenantId,
          reason: 'System administration',
          ipAddress: (req as any).ip || req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        }).catch(err => {
          // Don't block the request if logging fails
          logger.error({ err }, 'Failed to log superadmin access');
        });
```

---

### 2. User-Zugriffe (Superadmin)

**Wann:** Wenn ein Superadmin auf einen User eines anderen Tenants zugreift

**Aktionen:**
- ✅ `GET /api/admin/users/:id` - Superadmin ruft User ab

**Beispiel:**
```
Superadmin (superadmin@example.com) greift auf User "user-789" von Tenant "tenant-456" zu
→ Log: ACCESS, resource: user, resourceId: user-789, tenantId: tenant-456
```

**Code-Referenz:**
```137:151:packages/api-service/src/controllers/AdminController.ts
        this.auditLogService.logSuperAdminAccess({
          userId: user.userId,
          userEmail: user.email,
          action: 'ACCESS',
          resource: 'user',
          resourceId: id,
          tenantId: targetUser.tenantId,
          reason: 'System administration',
          ipAddress: (req as any).ip || req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        }).catch(err => {
          logger.error({ err }, 'Failed to log superadmin access');
        });
```

---

## ❌ Was NICHT geloggt wird (fehlt noch)

### 1. Workflow-Operationen (fehlend)

**Fehlende Aktionen:**
- ❌ `GET /api/workflows` - Superadmin listet alle Workflows (auch von anderen Tenants)
- ❌ `POST /api/workflows` - Workflow wird erstellt
- ❌ `GET /api/workflows/published` - Veröffentlichte Workflows werden abgerufen

**Problem:** Wenn Superadmin `getAll` mit `tenantId` Parameter aufruft, wird kein Log erstellt.

---

### 2. User-Operationen (fehlend)

**Fehlende Aktionen:**
- ❌ `GET /api/admin/users` - Superadmin listet alle User (auch von anderen Tenants)
- ❌ `POST /api/admin/users` - User wird erstellt
- ❌ `PUT /api/admin/users/:id` - User wird aktualisiert
- ❌ `DELETE /api/admin/users/:id` - User wird gelöscht

**Problem:** Nur `getUserById` wird geloggt, aber nicht `getAllUsers`, `createUser`, `updateUser`, `deleteUser`.

---

### 3. Tenant-Operationen (fehlend)

**Fehlende Aktionen:**
- ❌ `GET /api/admin/tenants` - Alle Tenants werden abgerufen
- ❌ `GET /api/admin/tenants/:id` - Tenant wird abgerufen
- ❌ `POST /api/admin/tenants` - Tenant wird erstellt
- ❌ `PUT /api/admin/tenants/:id` - Tenant wird aktualisiert
- ❌ `DELETE /api/admin/tenants/:id` - Tenant wird gelöscht

**Problem:** Keine Tenant-Operationen werden geloggt, obwohl diese kritisch sind.

---

### 4. Secrets-Operationen (fehlend)

**Fehlende Aktionen:**
- ❌ `GET /api/secrets` - Secrets werden abgerufen
- ❌ `POST /api/secrets` - Secret wird erstellt
- ❌ `PUT /api/secrets/:id` - Secret wird aktualisiert
- ❌ `DELETE /api/secrets/:id` - Secret wird gelöscht
- ❌ `GET /api/secrets/:id/decrypt` - Secret wird entschlüsselt (bereits blockiert für Superadmin)

**Problem:** Secrets sind sehr sensibel, aber keine Zugriffe werden geloggt.

---

### 5. API-Keys-Operationen (fehlend)

**Fehlende Aktionen:**
- ❌ `GET /api/apikeys` - API Keys werden abgerufen
- ❌ `POST /api/apikeys` - API Key wird erstellt
- ❌ `DELETE /api/apikeys/:id` - API Key wird gelöscht/revoked

**Problem:** API-Keys sind kritisch, aber keine Zugriffe werden geloggt.

---

### 6. Normale User-Aktionen (fehlend)

**Fehlende Aktionen:**
- ❌ Normale User-Aktionen werden überhaupt nicht geloggt
- ❌ Keine `logTenantAction` Aufrufe vorhanden

**Problem:** Es gibt keine Logs für normale User-Aktionen (z.B. Workflow erstellen, User erstellen, etc.).

---

## 🎯 Wann erscheinen Logs in der Praxis?

### Aktuell (mit bestehender Implementierung):

**Logs erscheinen nur wenn:**

1. **Superadmin greift auf Workflow zu:**
   - Superadmin öffnet Workflow-Details (`GET /api/workflows/:id`)
   - Superadmin bearbeitet Workflow (`PUT /api/workflows/:id`)
   - Superadmin löscht Workflow (`DELETE /api/workflows/:id`)
   - **WICHTIG:** Nur wenn der Workflow zu einem anderen Tenant gehört!

2. **Superadmin greift auf User zu:**
   - Superadmin öffnet User-Details (`GET /api/admin/users/:id`)
   - **WICHTIG:** Nur wenn der User zu einem anderen Tenant gehört!

**Logs erscheinen NICHT wenn:**

- ❌ Superadmin listet alle Workflows (`GET /api/workflows`)
- ❌ Superadmin listet alle User (`GET /api/admin/users`)
- ❌ Superadmin erstellt/aktualisiert/löscht User
- ❌ Superadmin erstellt/aktualisiert/löscht Tenant
- ❌ Superadmin greift auf Secrets zu
- ❌ Superadmin greift auf API Keys zu
- ❌ Normale User führen Aktionen aus

---

## 📊 Beispiel-Szenarien

### Szenario 1: Superadmin öffnet Workflow-Details

**Aktion:**
```
Superadmin (superadmin@example.com) öffnet Workflow "workflow-123" von Tenant "tenant-456"
GET /api/workflows/workflow-123
```

**Ergebnis:**
```
✅ LOG ERSCHEINT:
{
  "action": "ACCESS",
  "resource": "workflow",
  "resourceId": "workflow-123",
  "tenantId": "tenant-456",
  "userId": "superadmin-user-id",
  "userEmail": "superadmin@example.com",
  "reason": "System administration",
  "timestamp": "2025-01-27T10:00:00.000Z"
}
```

---

### Szenario 2: Superadmin listet alle Workflows

**Aktion:**
```
Superadmin (superadmin@example.com) listet alle Workflows
GET /api/workflows?tenantId=tenant-456
```

**Ergebnis:**
```
❌ KEIN LOG - Fehlt noch!
```

---

### Szenario 3: Superadmin erstellt User

**Aktion:**
```
Superadmin (superadmin@example.com) erstellt neuen User
POST /api/admin/users
{
  "email": "newuser@example.com",
  "tenantId": "tenant-456"
}
```

**Ergebnis:**
```
❌ KEIN LOG - Fehlt noch!
```

---

### Szenario 4: Normaler User erstellt Workflow

**Aktion:**
```
Normaler User (user@tenant-456.com) erstellt Workflow
POST /api/workflows
{
  "name": "My Workflow"
}
```

**Ergebnis:**
```
❌ KEIN LOG - Fehlt noch!
```

---

## 🔧 Empfehlungen für vollständige Implementierung

### 1. Superadmin-Logs erweitern

**WorkflowController:**
- ✅ `getById` - bereits implementiert
- ❌ `getAll` - hinzufügen (wenn Superadmin mit tenantId filtert)
- ❌ `create` - hinzufügen (wenn Superadmin für anderen Tenant erstellt)
- ✅ `update` - bereits implementiert (via checkTenantAccess)
- ✅ `delete` - bereits implementiert (via checkTenantAccess)

**AdminController:**
- ❌ `getAllUsers` - hinzufügen (wenn Superadmin mit tenantId filtert)
- ✅ `getUserById` - bereits implementiert
- ❌ `createUser` - hinzufügen (wenn Superadmin für anderen Tenant erstellt)
- ❌ `updateUser` - hinzufügen (wenn Superadmin User von anderem Tenant aktualisiert)
- ❌ `deleteUser` - hinzufügen (wenn Superadmin User von anderem Tenant löscht)
- ❌ `getAllTenants` - hinzufügen
- ❌ `getTenantById` - hinzufügen
- ❌ `createTenant` - hinzufügen
- ❌ `updateTenant` - hinzufügen
- ❌ `deleteTenant` - hinzufügen

### 2. Secrets-Logs hinzufügen

**SecretsController:**
- ❌ Alle Secrets-Operationen loggen (besonders kritisch!)

### 3. API-Keys-Logs hinzufügen

**ApiKeyController:**
- ❌ Alle API-Keys-Operationen loggen

### 4. Normale User-Aktionen loggen

**Optional, aber empfohlen:**
- ❌ `logTenantAction` für wichtige Aktionen (CREATE, UPDATE, DELETE)
- ❌ Workflow-Erstellung, -Aktualisierung, -Löschung
- ❌ User-Erstellung, -Aktualisierung, -Löschung
- ❌ Secret-Erstellung, -Aktualisierung, -Löschung

---

## 📝 Zusammenfassung

### Aktueller Status:

**✅ Geloggt:**
- Superadmin greift auf Workflow zu (getById, update, delete)
- Superadmin greift auf User zu (getUserById)

**❌ Nicht geloggt:**
- Superadmin listet Workflows/User/Tenants
- Superadmin erstellt/aktualisiert/löscht User/Tenants
- Superadmin greift auf Secrets/API Keys zu
- Normale User-Aktionen

### In der Praxis:

**Logs erscheinen nur wenn:**
1. Superadmin öffnet Workflow-Details eines anderen Tenants
2. Superadmin öffnet User-Details eines anderen Tenants

**Logs erscheinen NICHT bei:**
- Alle anderen Aktionen (auch kritische wie Tenant-Löschung)

### Empfehlung:

**Kritisch:** Secrets- und API-Keys-Zugriffe sollten sofort geloggt werden!

**Wichtig:** Tenant-Operationen sollten geloggt werden!

**Optional:** Normale User-Aktionen können geloggt werden (für vollständige Transparenz).

---

**Erstellt von:** Auto (AI Assistant)  
**Datum:** 2025-01-27

