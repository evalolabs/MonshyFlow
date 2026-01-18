# 🔒 Frontend Tenant-Sicherheitsanalyse

**Datum:** 2025-01-27  
**Status:** ⚠️ Sicherheit hängt komplett vom Backend ab

---

## 📋 Zusammenfassung

**Kurze Antwort:** Die Daten sind **NUR sicher, wenn das Backend korrekt implementiert ist**. Das Frontend implementiert **KEINE Tenant-Isolation** und verlässt sich vollständig auf das Backend.

---

## 🔍 Frontend-Analyse: Was sendet das Frontend?

### ❌ Frontend sendet KEIN `tenantId` explizit

Das Frontend sendet in **keinem einzigen Service** explizit eine `tenantId`:

#### Workflows
```typescript
// workflowService.ts
async getAllWorkflows(): Promise<Workflow[]> {
  const response = await api.get('/api/workflows');
  // ❌ KEIN tenantId-Parameter
}
```

#### Secrets
```typescript
// secretsService.ts
async getAllSecrets(): Promise<SecretResponse[]> {
  const response = await api.get('/api/secrets');
  // ❌ KEIN tenantId-Parameter
}
```

#### API Keys
```typescript
// apiKeysService.ts
async getAllApiKeys(): Promise<ApiKeyResponse[]> {
  const response = await api.get('/api/apikeys');
  // ❌ KEIN tenantId-Parameter
}
```

#### Users (Ausnahme: Nur Superadmin)
```typescript
// adminService.ts
async getAllUsers(tenantId?: string): Promise<User[]> {
  const params = tenantId ? { tenantId } : {};
  // ✅ Nur Superadmin kann optional tenantId übergeben
  // ❌ Normale Admins senden KEIN tenantId
}
```

### ✅ Was das Frontend sendet

1. **Authorization Token** (automatisch in jedem Request)
   ```typescript
   // api.ts - Request Interceptor
   const token = localStorage.getItem('auth_token');
   if (token) {
     config.headers.Authorization = `Bearer ${token}`;
   }
   ```

2. **Keine explizite Tenant-ID** (außer Superadmin bei Users)

---

## 🛡️ Backend-Verantwortung (KRITISCH)

Da das Frontend **keine Tenant-Isolation** implementiert, **MUSS** das Backend:

### 1. Token validieren und `tenantId` extrahieren

```csharp
// Backend MUSS:
// 1. JWT Token validieren
// 2. tenantId aus Token-Claims extrahieren
// 3. Alle Daten nach tenantId filtern
```

### 2. Automatische Filterung bei ALLEN Endpoints

**Jeder Endpoint MUSS automatisch filtern:**

| Endpoint | Backend MUSS filtern nach |
|----------|--------------------------|
| `GET /api/workflows` | `tenantId` aus Token |
| `GET /api/workflows/:id` | `tenantId` aus Token + Workflow-Zugehörigkeit prüfen |
| `GET /api/secrets` | `tenantId` aus Token |
| `GET /api/secrets/:id` | `tenantId` aus Token + Secret-Zugehörigkeit prüfen |
| `GET /api/apikeys` | `tenantId` aus Token |
| `GET /api/admin/users` | `tenantId` aus Token (außer Superadmin) |
| `GET /api/admin/statistics` | `tenantId` aus Token |

### 3. Superadmin-Override

- **Superadmin** kann optional `tenantId` als Query-Parameter übergeben
- Backend MUSS prüfen, ob User `superadmin`-Rolle hat
- Nur dann darf `tenantId`-Parameter akzeptiert werden

---

## ⚠️ Potenzielle Sicherheitsrisiken

### 🔴 KRITISCH: Wenn Backend nicht filtert

**Szenario:** Backend filtert nicht nach `tenantId`

**Folge:**
- ❌ Tenant A sieht alle Workflows von Tenant B
- ❌ Tenant A kann Secrets von Tenant B lesen
- ❌ Tenant A kann API Keys von Tenant B sehen
- ❌ **Komplette Datenlecks zwischen Tenants**

### 🟡 MITTEL: Token-Manipulation

**Szenario:** User manipuliert Token im Frontend

**Schutz:**
- ✅ Backend MUSS Token-Signatur validieren
- ✅ Backend MUSS Token-Expiration prüfen
- ✅ Backend MUSS `tenantId` aus Token extrahieren (nicht aus Request-Body)

### 🟡 MITTEL: Direkte API-Calls

**Szenario:** User umgeht Frontend und ruft API direkt auf

**Schutz:**
- ✅ Backend MUSS Token-Validierung haben
- ✅ Backend MUSS Tenant-Isolation haben
- ❌ Frontend kann hier nichts schützen

### 🟢 NIEDRIG: UI-Manipulation

**Szenario:** User manipuliert Frontend-Code (z.B. DevTools)

**Schutz:**
- ✅ Frontend zeigt nur, was Backend zurückgibt
- ✅ Backend filtert trotzdem korrekt
- ⚠️ User könnte versuchen, andere Tenant-IDs zu sehen (aber Backend blockiert)

---

## ✅ Was das Frontend RICHTIG macht

1. **Keine explizite `tenantId` in Requests**
   - Frontend sendet keine manipulierbare `tenantId`
   - Verlässt sich auf Backend-Token-Extraktion

2. **Token wird automatisch mitgesendet**
   - Jeder Request enthält `Authorization: Bearer <token>`
   - Token enthält `tenantId` (Backend-Verantwortung)

3. **Superadmin-Logik korrekt**
   - Nur Superadmin kann `tenantId`-Parameter übergeben
   - Normale Admins können keine `tenantId` setzen

---

## ❌ Was das Frontend NICHT macht (Backend-Verantwortung)

1. **Keine Tenant-Validierung**
   - Frontend prüft nicht, ob zurückgegebene Daten zum eigenen Tenant gehören
   - Frontend zeigt einfach an, was Backend zurückgibt

2. **Keine Client-seitige Filterung**
   - Frontend filtert nicht nach `tenantId` im Response
   - Verlässt sich darauf, dass Backend nur korrekte Daten sendet

3. **Keine zusätzliche Sicherheitsschicht**
   - Frontend ist "dumm" und vertraut dem Backend
   - Das ist **korrekt**, aber Backend MUSS sicher sein

---

## 🔐 Sicherheits-Checkliste für Backend

### ✅ Backend MUSS implementieren:

- [ ] **JWT Token-Validierung** bei jedem Request
- [ ] **`tenantId`-Extraktion** aus Token-Claims (nicht aus Request-Body)
- [ ] **Automatische Filterung** aller Daten nach `tenantId`
- [ ] **Zugriffskontrolle** bei GET-by-ID (prüfen, ob Resource zum Tenant gehört)
- [ ] **Superadmin-Check** vor `tenantId`-Parameter-Akzeptanz
- [ ] **Logging** von verdächtigen Zugriffen (versuchter Zugriff auf andere Tenant-Daten)

### ❌ Backend DARF NICHT:

- [ ] `tenantId` aus Request-Body/Query-Parameter akzeptieren (außer Superadmin)
- [ ] Daten ohne Tenant-Filter zurückgeben
- [ ] Token-Validierung überspringen
- [ ] Tenant-Isolation ignorieren

---

## 📊 Beispiel: Sichere vs. Unsichere Implementierung

### ✅ SICHER (Backend filtert)

```typescript
// Frontend
const workflows = await workflowService.getAllWorkflows();
// Sendet: GET /api/workflows
// Header: Authorization: Bearer <token>

// Backend (C#)
var tenantId = GetTenantIdFromToken(token); // Aus Token extrahieren
var workflows = await _db.Workflows
    .Where(w => w.TenantId == tenantId)  // ✅ Filtert nach Tenant
    .ToListAsync();
```

### ❌ UNSICHER (Backend filtert nicht)

```csharp
// Backend (C#) - FALSCH!
var workflows = await _db.Workflows.ToListAsync();
// ❌ Keine Tenant-Filterung!
// ❌ Gibt ALLE Workflows zurück (alle Tenants)
```

---

## 🎯 Empfehlungen

### Für Frontend (aktuell OK)

1. ✅ **Weiterhin keine `tenantId` senden** (außer Superadmin)
2. ✅ **Token automatisch mitgeben** (bereits implementiert)
3. ⚠️ **Optional:** Client-seitige Validierung hinzufügen (zusätzliche Sicherheitsschicht)

### Für Backend (KRITISCH)

1. 🔴 **MUSS:** Tenant-Isolation bei ALLEN Endpoints implementieren
2. 🔴 **MUSS:** Token-Validierung und `tenantId`-Extraktion
3. 🔴 **MUSS:** Zugriffskontrolle bei GET-by-ID
4. 🟡 **SOLLTE:** Logging von verdächtigen Zugriffen
5. 🟡 **SOLLTE:** Unit-Tests für Tenant-Isolation

### Optional: Frontend-Verbesserungen

1. **Client-seitige Validierung** (zusätzliche Sicherheitsschicht)
   ```typescript
   // Nach API-Response prüfen, ob alle Daten zum eigenen Tenant gehören
   const currentTenantId = useCurrentUserTenantId();
   const workflows = await workflowService.getAllWorkflows();
   
   // Warnung, wenn Backend falsche Daten sendet
   const foreignWorkflows = workflows.filter(w => w.tenantId !== currentTenantId);
   if (foreignWorkflows.length > 0) {
     console.error('SECURITY WARNING: Backend returned workflows from other tenants!');
   }
   ```

2. **Tenant-Badge in UI** (Transparenz)
   ```typescript
   // Zeige Tenant-Name in UI, damit User sehen, zu welchem Tenant sie gehören
   {user.tenantName && (
     <span className="tenant-badge">🏢 {user.tenantName}</span>
   )}
   ```

---

## 📝 Code-Referenzen

### Frontend Services (keine Tenant-Filterung)
- `frontend/src/services/workflowService.ts` - Kein `tenantId`-Parameter
- `frontend/src/services/secretsService.ts` - Kein `tenantId`-Parameter
- `frontend/src/services/apiKeysService.ts` - Kein `tenantId`-Parameter
- `frontend/src/services/adminService.ts` - Nur Superadmin kann `tenantId` übergeben

### API Client
- `frontend/src/services/api.ts` - Sendet automatisch Token

### Auth Context
- `frontend/src/contexts/AuthContext.tsx` - Speichert User-Info (inkl. `tenantId`)

---

## ⚠️ FAZIT

### Ist die Daten-Darstellung sicher?

**Antwort:** **NUR wenn das Backend korrekt implementiert ist!**

- ✅ **Frontend-Architektur ist korrekt** (verlässt sich auf Backend)
- ⚠️ **Sicherheit hängt komplett vom Backend ab**
- 🔴 **Backend MUSS Tenant-Isolation implementieren**
- 🔴 **Backend MUSS Token-Validierung haben**

### Risiko-Bewertung

| Aspekt | Risiko | Status |
|--------|--------|--------|
| Frontend-Architektur | ✅ Niedrig | Korrekt implementiert |
| Backend-Abhängigkeit | 🔴 Hoch | Frontend kann nichts schützen |
| Token-Sicherheit | 🟡 Mittel | Hängt von Backend-Validierung ab |
| Tenant-Isolation | 🔴 Hoch | Komplett Backend-Verantwortung |

**Empfehlung:** Backend-Code auf Tenant-Isolation prüfen und testen!

---

**Erstellt von:** Auto (AI Assistant)  
**Datum:** 2025-01-27

