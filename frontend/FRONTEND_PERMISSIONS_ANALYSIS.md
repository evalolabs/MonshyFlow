# 🔐 Frontend Berechtigungen & Zugriffskontrolle

**Datum:** 2025-01-27  
**Status:** ✅ Vollständige Analyse der Frontend-Berechtigungen

---

## 📋 Übersicht

Das Frontend verwendet ein **Rollen- und Berechtigungssystem (RBAC)** mit **Multi-Tenant-Isolation**. Die Zugriffskontrolle erfolgt auf mehreren Ebenen:

1. **Route-Level:** Protected Routes (Authentifizierung erforderlich)
2. **UI-Level:** Sichtbarkeit von Navigation und UI-Elementen
3. **Backend-Level:** API-Endpoints filtern automatisch nach Tenant und Rolle

---

## 👥 Rollen-System

### Verfügbare Rollen

| Rolle | Beschreibung | Berechtigungen |
|-------|-------------|----------------|
| **superadmin** | System-Administrator | Vollzugriff auf alle Tenants und System-Funktionen |
| **admin** | Tenant-Administrator | Verwaltung des eigenen Tenants |
| **user** | Standard-Benutzer | Basis-Funktionen, eigene Daten |
| **developer** | Entwickler | Zusätzliche Entwickler-Funktionen (optional) |

### Rollen-Hierarchie

```
superadmin (höchste Berechtigung)
  └── admin
      └── user
          └── developer (optional)
```

---

## 🔑 Berechtigungen (Permissions)

Das System definiert folgende Permissions (aktuell im Frontend **nicht vollständig genutzt**):

### Workflow Permissions
- `workflow.read` - Workflows anzeigen
- `workflow.create` - Workflows erstellen
- `workflow.update` - Workflows bearbeiten
- `workflow.delete` - Workflows löschen
- `workflow.execute` - Workflows ausführen
- `workflow.publish` - Workflows veröffentlichen

### Tenant Permissions
- `tenant.read` - Tenants anzeigen
- `tenant.create` - Tenants erstellen
- `tenant.update` - Tenants bearbeiten
- `tenant.delete` - Tenants löschen

### User Permissions
- `user.read` - Benutzer anzeigen
- `user.create` - Benutzer erstellen
- `user.update` - Benutzer bearbeiten
- `user.delete` - Benutzer löschen
- `user.assign-role` - Rollen zuweisen

### Secret Permissions
- `secret.read` - Secrets anzeigen
- `secret.create` - Secrets erstellen
- `secret.update` - Secrets bearbeiten
- `secret.delete` - Secrets löschen
- `secret.decrypt` - Secrets entschlüsseln

### Role Permissions
- `role.read` - Rollen anzeigen
- `role.create` - Rollen erstellen
- `role.update` - Rollen bearbeiten
- `role.delete` - Rollen löschen
- `permission.read` - Berechtigungen anzeigen

**Hinweis:** Das Permission-System ist implementiert, wird aber aktuell hauptsächlich für Rollen-Checks (`superadmin`, `admin`) verwendet. Granulare Permission-Checks sind möglich, aber noch nicht überall implementiert.

---

## 🏢 Multi-Tenant-Isolation

### Tenant-Isolation Prinzip

- **Jeder Benutzer gehört zu einem Tenant** (`tenantId`)
- **Backend filtert automatisch** alle Daten nach Tenant
- **Superadmins** können alle Tenants sehen und verwalten
- **Normale Admins/User** sehen nur Daten ihres eigenen Tenants

### Tenant-Filterung im Frontend

```typescript
// User Management
const usersData = await adminService.getAllUsers(
  isSuperAdmin ? selectedTenantFilter || undefined : undefined
);
```

- **Superadmin:** Kann `tenantId` als Filter übergeben (zeigt alle Tenants)
- **Normaler Admin:** Kein Filter → Backend liefert nur eigenen Tenant

---

## 🛡️ Zugriffskontrolle nach Seite

### 🔓 Öffentliche Routes (keine Authentifizierung)

| Route | Beschreibung |
|-------|-------------|
| `/login` | Login-Seite |
| `/register` | Registrierungs-Seite |
| `/oauth2/callback` | OAuth2 Callback-Handler |

### 🔒 Geschützte Routes (Authentifizierung erforderlich)

Alle anderen Routes sind durch `<ProtectedRoute>` geschützt und erfordern eine gültige Authentifizierung.

---

## 📊 Seiten-spezifische Berechtigungen

### 🏠 HomePage (`/`)
- **Zugriff:** ✅ Alle authentifizierten Benutzer
- **Funktionen:**
  - Workflows anzeigen (gefiltert nach Tenant)
  - Workflows erstellen
  - Workflows bearbeiten
- **Tenant-Isolation:** ✅ Backend filtert automatisch

### 📊 Admin Dashboard (`/admin`)
- **Zugriff:** ✅ Alle authentifizierten Benutzer
- **Angezeigte Statistiken:**
  - **Alle Benutzer:** Total Users, Total Workflows, Total Secrets
  - **Nur Superadmin:** Zusätzlich Total Tenants, Super Admins, Admins, Published Workflows
- **Tenant-Isolation:** ✅ Statistiken werden nach Tenant gefiltert (außer für Superadmin)

### 👥 User Management (`/admin/users`)
- **Zugriff:** ✅ Alle authentifizierten Benutzer
- **Funktionen:**
  - **Alle:** Benutzer anzeigen, erstellen, bearbeiten, löschen
  - **Superadmin:** Kann Tenant-Filter wählen (zeigt alle Tenants)
  - **Normaler Admin:** Sieht nur Benutzer des eigenen Tenants
- **Besonderheiten:**
  - Superadmin kann `superadmin`-Rolle zuweisen
  - Normale Admins können `superadmin`-Rolle **nicht** zuweisen
  - Tenant-Auswahl nur für Superadmin sichtbar
- **Tenant-Isolation:** ✅ Backend filtert nach Tenant (außer für Superadmin mit Filter)

### 🔑 Secrets Management (`/admin/secrets`)
- **Zugriff:** ✅ Alle authentifizierten Benutzer
- **Funktionen:**
  - Secrets anzeigen, erstellen, bearbeiten, löschen
  - Secrets entschlüsseln
- **Tenant-Isolation:** ✅ Backend filtert automatisch nach Tenant

### 🛡️ API Keys Management (`/admin/apikeys`)
- **Zugriff:** ✅ Alle authentifizierten Benutzer
- **Funktionen:**
  - API Keys anzeigen, erstellen, löschen, widerrufen
- **Tenant-Isolation:** ✅ Backend filtert automatisch nach Tenant

### 🏢 Tenant Management (`/admin/tenants`)
- **Zugriff:** ❌ **Nur Superadmin**
- **Funktionen:**
  - Tenants anzeigen, erstellen, bearbeiten, löschen
- **UI-Schutz:**
  ```typescript
  if (!isSuperAdmin) {
    return <div>Access denied. Only superadmins can manage tenants.</div>;
  }
  ```
- **Navigation:** Menüpunkt wird nur für Superadmin angezeigt

### 📝 Workflow Editor (`/workflow/:id`)
- **Zugriff:** ✅ Alle authentifizierten Benutzer
- **Funktionen:**
  - Workflows bearbeiten
  - Workflows ausführen
  - Nodes konfigurieren
- **Tenant-Isolation:** ✅ Backend prüft Tenant-Zugehörigkeit

### 🪝 Webhook Test (`/webhook-test/:workflowId`)
- **Zugriff:** ✅ Alle authentifizierten Benutzer
- **Funktionen:**
  - Webhooks testen
  - Workflow-Status abrufen
- **Tenant-Isolation:** ✅ Backend prüft Tenant-Zugehörigkeit

---

## 🧭 Navigation & UI-Elemente

### Navigation-Menü

| Menüpunkt | Sichtbarkeit | Route |
|-----------|--------------|-------|
| Dashboard | ✅ Alle | `/admin` |
| Workflows | ✅ Alle | `/` |
| Users | ✅ Alle | `/admin/users` |
| Secrets | ✅ Alle | `/admin/secrets` |
| API Keys | ✅ Alle | `/admin/apikeys` |
| Tenants | ❌ **Nur Superadmin** | `/admin/tenants` |

**Code-Referenz:**
```64:64:frontend/src/components/Navigation/Navigation.tsx
      permission: 'superadmin', // Only for superadmin
```

### UI-Elemente nach Rolle

#### Superadmin sieht:
- ✅ Tenant-Management-Menüpunkt
- ✅ Tenant-Filter in User Management
- ✅ Tenant-Spalte in User-Tabelle
- ✅ Zusätzliche Statistiken im Dashboard (Tenants, Super Admins, Admins)
- ✅ Kann `superadmin`-Rolle zuweisen
- ✅ Kann Tenant bei User-Erstellung auswählen

#### Normaler Admin/User sieht:
- ❌ Kein Tenant-Management-Menüpunkt
- ❌ Kein Tenant-Filter in User Management
- ❌ Keine Tenant-Spalte in User-Tabelle
- ❌ Keine zusätzlichen Statistiken
- ❌ Kann `superadmin`-Rolle **nicht** zuweisen
- ❌ Kann Tenant bei User-Erstellung **nicht** auswählen (automatisch eigener Tenant)

---

## 🔍 Permission-Hooks & Utilities

### Verfügbare Hooks

```typescript
// Rollen-Checks
useIsSuperAdmin(): boolean
useIsAdmin(): boolean

// Permission-Checks (aktuell nicht vollständig genutzt)
useHasPermission(permission: Permission): boolean
useHasAnyPermission(permissions: Permission[]): boolean

// Tenant-Info
useCurrentUserTenantId(): string | undefined
```

### Verwendung

```typescript
// Beispiel: Superadmin-Check
const isSuperAdmin = useIsSuperAdmin();

if (isSuperAdmin) {
  // Zeige zusätzliche Features
}

// Beispiel: Permission-Check
const canDeleteWorkflow = useHasPermission(Permissions.WORKFLOW_DELETE);
```

---

## 🔐 Authentifizierung & Token

### Token-Verwaltung

- **Token-Speicherung:** `localStorage.getItem('auth_token')`
- **User-Info:** `localStorage.getItem('auth_user')`
- **Automatische Token-Übertragung:** Alle API-Requests senden automatisch `Authorization: Bearer <token>`

### User-Objekt

```typescript
interface User {
  id: string;
  email: string;
  roles: string[];           // z.B. ['admin', 'user']
  permissions?: string[];     // z.B. ['workflow.read', 'workflow.create']
  tenantId?: string;         // Tenant-Zugehörigkeit
  tenantName?: string;       // Tenant-Name (Display)
}
```

---

## 🛡️ Backend-Integration

### Automatische Filterung

Das **Backend filtert automatisch** alle Daten nach:
1. **Tenant-ID** (aus User-Token)
2. **Rolle** (für Admin-Endpoints)

### API-Endpoints mit Tenant-Filterung

- ✅ `GET /api/workflows` - Nur Workflows des eigenen Tenants
- ✅ `GET /api/secrets` - Nur Secrets des eigenen Tenants
- ✅ `GET /api/apikeys` - Nur API Keys des eigenen Tenants
- ✅ `GET /api/admin/users` - Gefiltert nach Tenant (außer Superadmin)
- ✅ `GET /api/admin/statistics` - Statistiken des eigenen Tenants

### Superadmin-Override

Superadmins können bei bestimmten Endpoints einen `tenantId`-Parameter übergeben, um Daten anderer Tenants zu sehen:

```typescript
// Superadmin kann alle Tenants sehen
const users = await adminService.getAllUsers(tenantId);
```

---

## 📋 Zusammenfassung: Wer darf was sehen?

### 🔴 Superadmin
- ✅ **Alle Tenants** verwalten
- ✅ **Alle Benutzer** aller Tenants sehen
- ✅ **Tenant-Management** (CRUD)
- ✅ **Superadmin-Rolle** zuweisen
- ✅ **Alle Statistiken** (systemweit)
- ✅ **Alle Workflows, Secrets, API Keys** (systemweit)

### 🟡 Admin (Tenant-Admin)
- ✅ **Eigene Workflows** verwalten
- ✅ **Eigene Secrets** verwalten
- ✅ **Eigene API Keys** verwalten
- ✅ **Benutzer des eigenen Tenants** verwalten
- ✅ **Statistiken des eigenen Tenants** sehen
- ❌ **Kein Zugriff** auf andere Tenants
- ❌ **Kein Tenant-Management**
- ❌ **Kann keine Superadmin-Rolle** zuweisen

### 🟢 User (Standard-Benutzer)
- ✅ **Eigene Workflows** erstellen/bearbeiten
- ✅ **Eigene Workflows** ausführen
- ✅ **Eigene Secrets** verwalten
- ✅ **Eigene API Keys** verwalten
- ❌ **Kein Zugriff** auf User-Management
- ❌ **Kein Zugriff** auf andere Tenants
- ❌ **Kein Zugriff** auf Admin-Funktionen

---

## ⚠️ Wichtige Hinweise

### Frontend vs. Backend Sicherheit

1. **Frontend-Berechtigungen sind nur UI-Schutz!**
   - Das Frontend versteckt nur UI-Elemente
   - **Echte Sicherheit** muss im Backend implementiert sein
   - Backend muss alle Requests validieren und filtern

2. **Tenant-Isolation ist Backend-Verantwortung**
   - Frontend sendet `tenantId` nicht explizit
   - Backend extrahiert `tenantId` aus dem User-Token
   - Backend filtert automatisch alle Daten

3. **Permission-System ist vorbereitet, aber nicht vollständig genutzt**
   - Permissions sind definiert
   - Hooks sind implementiert
   - Aktuell wird hauptsächlich auf Rollen-Basis geprüft
   - Granulare Permissions können schrittweise eingeführt werden

### Best Practices

1. **Immer Backend-Validierung vertrauen**
   - Frontend-Checks sind nur für UX
   - Backend muss alle Aktionen validieren

2. **Tenant-Isolation nie im Frontend implementieren**
   - Backend ist die einzige Quelle der Wahrheit
   - Frontend zeigt nur, was Backend zurückgibt

3. **Rollen-Checks für kritische Aktionen**
   - Superadmin-Funktionen explizit prüfen
   - UI-Elemente basierend auf Rolle anzeigen/verstecken

---

## 📝 Code-Referenzen

### Permission Utilities
- `frontend/src/utils/permissions.ts` - Permission-Hooks und Konstanten

### Auth Context
- `frontend/src/contexts/AuthContext.tsx` - Authentifizierungs-Context

### Protected Routes
- `frontend/src/components/ProtectedRoute.tsx` - Route-Schutz

### Navigation
- `frontend/src/components/Navigation/Navigation.tsx` - Navigation mit Rollen-Filter

### Admin Pages
- `frontend/src/pages/AdminDashboardPage.tsx` - Dashboard mit Rollen-basierten Statistiken
- `frontend/src/pages/UserManagementPage.tsx` - User-Verwaltung mit Tenant-Filter
- `frontend/src/pages/TenantManagementPage.tsx` - Tenant-Verwaltung (nur Superadmin)

---

**Erstellt von:** Auto (AI Assistant)  
**Datum:** 2025-01-27

