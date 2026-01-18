# 🔌 Frontend API Endpoints Analyse

**Datum:** 2025-01-27  
**Status:** ✅ Vollständige Analyse aller Frontend-Endpoints

---

## 📋 Übersicht

Das Frontend nutzt **Axios** als HTTP-Client und kommuniziert über das **Kong Gateway** (Port 5000) mit dem Backend.

**Base URL:** `http://localhost:5000` (konfigurierbar via `VITE_API_URL`)

**Authentifizierung:** Bearer Token aus `localStorage.getItem('auth_token')` wird automatisch in allen Requests mitgesendet.

---

## 🔐 Authentifizierung Endpoints

### `POST /api/auth/login`
- **Service:** `authService.login()`
- **Beschreibung:** Benutzer-Login
- **Request Body:**
  ```typescript
  {
    email: string;
    password: string;
  }
  ```
- **Response:** `{ success: boolean; data: AuthResponse }`
- **Auth:** ❌ Nicht erforderlich

### `POST /api/auth/register`
- **Service:** `authService.register()`
- **Beschreibung:** Benutzer-Registrierung
- **Request Body:**
  ```typescript
  {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    tenantName?: string;
  }
  ```
- **Response:** `{ success: boolean; data: AuthResponse }`
- **Auth:** ❌ Nicht erforderlich

---

## 📊 Workflow Endpoints

### `GET /api/workflows`
- **Service:** `workflowService.getAllWorkflows()`
- **Beschreibung:** Alle Workflows abrufen
- **Response:** `{ success: boolean; data: Workflow[] }`
- **Auth:** ✅ Erforderlich

### `GET /api/workflows/:id`
- **Service:** `workflowService.getWorkflowById()`
- **Beschreibung:** Workflow nach ID abrufen
- **Response:** `{ success: boolean; data: Workflow }`
- **Auth:** ✅ Erforderlich

### `POST /api/workflows`
- **Service:** `workflowService.createWorkflow()`
- **Beschreibung:** Neuen Workflow erstellen
- **Request Body:** `CreateWorkflowRequest`
- **Response:** `{ success: boolean; data: Workflow }`
- **Auth:** ✅ Erforderlich

### `PUT /api/workflows/:id`
- **Service:** `workflowService.updateWorkflow()`
- **Beschreibung:** Workflow aktualisieren
- **Request Body:** `Partial<Workflow>`
- **Response:** `void`
- **Auth:** ✅ Erforderlich
- **Hinweis:** Sanitized Nodes (node.data wird automatisch zu Object konvertiert)

### `DELETE /api/workflows/:id`
- **Service:** `workflowService.deleteWorkflow()`
- **Beschreibung:** Workflow löschen
- **Response:** `void`
- **Auth:** ✅ Erforderlich

### `POST /api/workflows/:id/execute`
- **Service:** `workflowService.startExecution()`, `workflowService.executeWorkflow()`
- **Beschreibung:** Workflow ausführen
- **Request Body:**
  ```typescript
  {
    input?: any;  // oder ExecutionRequest
  }
  ```
- **Response:** `ExecutionResponse`
- **Auth:** ✅ Erforderlich

### `PUT /api/workflows/start-node`
- **Service:** `workflowService.updateStartNode()`
- **Beschreibung:** Start-Node Konfiguration aktualisieren
- **Request Body:**
  ```typescript
  {
    workflowId: string;
    nodeId: string;
    // ... weitere StartNode-Konfiguration
  }
  ```
- **Response:** `void`
- **Auth:** ✅ Erforderlich

### `PUT /api/workflows/node`
- **Service:** `workflowService.updateNode()`
- **Beschreibung:** Beliebigen Node aktualisieren
- **Request Body:**
  ```typescript
  {
    workflowId: string;
    nodeId: string;
    type: string;
    data: any;
  }
  ```
- **Response:** `void`
- **Auth:** ✅ Erforderlich

### `DELETE /api/workflows/:workflowId/nodes/:nodeId`
- **Service:** `workflowService.deleteNode()`
- **Beschreibung:** Node aus Workflow löschen
- **Response:** `void`
- **Auth:** ✅ Erforderlich

### `POST /api/workflows/publish`
- **Service:** `workflowService.publishWorkflow()`
- **Beschreibung:** Workflow veröffentlichen
- **Request Body:**
  ```typescript
  {
    workflowId: string;
    description?: string;
  }
  ```
- **Response:** `void`
- **Auth:** ✅ Erforderlich

### `GET /api/workflows/published`
- **Service:** `workflowService.getPublishedWorkflows()`
- **Beschreibung:** Alle veröffentlichten Workflows abrufen
- **Response:** `Workflow[]`
- **Auth:** ✅ Erforderlich

### `POST /api/workflows/:workflowId/nodes/:nodeId/test-with-context`
- **Service:** `workflowService.testNode()`
- **Beschreibung:** Einzelnen Node mit Kontext testen
- **Request Body:** `any` (optional)
- **Response:** `any`
- **Auth:** ✅ Erforderlich

---

## ⚙️ Execution Endpoints

### `GET /api/execution/:executionId`
- **Service:** `workflowService.getExecution()`
- **Beschreibung:** Execution-Status abrufen
- **Response:** `Execution`
- **Auth:** ✅ Erforderlich

### `GET /api/execution/workflow/:workflowId`
- **Service:** `workflowService.getExecutionsByWorkflow()`
- **Beschreibung:** Alle Executions eines Workflows abrufen
- **Response:** `Execution[]`
- **Auth:** ✅ Erforderlich

### `GET /api/execute/:executionId/status`
- **Service:** `workflowService.getExecutionStatus()`
- **Beschreibung:** Execution-Status abrufen (alternativer Endpoint)
- **Response:** `any`
- **Auth:** ✅ Erforderlich

### `PUT /api/execution/:executionId/status`
- **Service:** `workflowService.updateExecutionStatus()`
- **Beschreibung:** Execution-Status aktualisieren
- **Request Body:**
  ```typescript
  {
    status: string;
  }
  ```
- **Response:** `void`
- **Auth:** ✅ Erforderlich

### `POST /api/execution/:executionId/complete`
- **Service:** `workflowService.completeExecution()`
- **Beschreibung:** Execution abschließen
- **Request Body:**
  ```typescript
  {
    output?: any;
    error?: string;
  }
  ```
- **Response:** `void`
- **Auth:** ✅ Erforderlich

---

## 🧪 Test Endpoints

### `POST /api/test/:workflowId/execute`
- **Service:** `workflowService.testWorkflow()`
- **Beschreibung:** Workflow testen
- **Request Body:** `any` (Test-Input)
- **Response:**
  ```typescript
  {
    success: boolean;
    executionId: string;
    status: string;
    input: any;
    output?: any;
    error?: string;
    executionTrace?: any[];
    duration?: number;
  }
  ```
- **Auth:** ✅ Erforderlich

### `GET /api/test/:workflowId/info`
- **Service:** `workflowService.getWorkflowTestInfo()`
- **Beschreibung:** Workflow-Test-Informationen abrufen
- **Response:**
  ```typescript
  {
    workflowId: string;
    workflowName: string;
    startNode: any;
    nodeCount: number;
    edgeCount: number;
  }
  ```
- **Auth:** ✅ Erforderlich

---

## 🔑 Secrets Endpoints

### `GET /api/secrets`
- **Service:** `secretsService.getAllSecrets()`
- **Beschreibung:** Alle Secrets abrufen
- **Response:** `{ success: boolean; data: SecretResponse[] }`
- **Auth:** ✅ Erforderlich

### `GET /api/secrets/:id`
- **Service:** `secretsService.getSecretById()`
- **Beschreibung:** Secret nach ID abrufen
- **Response:** `{ success: boolean; data: SecretResponse }`
- **Auth:** ✅ Erforderlich

### `POST /api/secrets`
- **Service:** `secretsService.createSecret()`
- **Beschreibung:** Neues Secret erstellen
- **Request Body:**
  ```typescript
  {
    name: string;
    description?: string;
    secretType: number; // 0=ApiKey, 1=Password, 2=Token, 3=Generic, 4=SMTP
    provider?: string;
    value: string;
    isActive?: boolean;
  }
  ```
- **Response:** `{ success: boolean; data: SecretResponse }`
- **Auth:** ✅ Erforderlich

### `PUT /api/secrets/:id`
- **Service:** `secretsService.updateSecret()`
- **Beschreibung:** Secret aktualisieren
- **Request Body:** `UpdateSecretRequest`
- **Response:** `{ success: boolean; data: SecretResponse }`
- **Auth:** ✅ Erforderlich

### `DELETE /api/secrets/:id`
- **Service:** `secretsService.deleteSecret()`
- **Beschreibung:** Secret löschen
- **Response:** `void` (204 No Content)
- **Auth:** ✅ Erforderlich

### `GET /api/secrets/:id/decrypt`
- **Service:** `secretsService.getDecryptedSecret()`
- **Beschreibung:** Entschlüsseltes Secret abrufen
- **Response:** `{ success: boolean; data: DecryptedSecretResponse }`
- **Auth:** ✅ Erforderlich

---

## 🔐 API Keys Endpoints

### `GET /api/apikeys`
- **Service:** `apiKeysService.getAllApiKeys()`
- **Beschreibung:** Alle API Keys abrufen
- **Response:** `{ success: boolean; data: ApiKeyResponse[] }`
- **Auth:** ✅ Erforderlich

### `POST /api/apikeys`
- **Service:** `apiKeysService.createApiKey()`
- **Beschreibung:** Neuen API Key erstellen
- **Request Body:**
  ```typescript
  {
    name?: string;
    description?: string;
    expiresAt?: string | null; // ISO date string
  }
  ```
- **Response:** `{ success: boolean; data: ApiKeyResponse }` (enthält `key` nur bei Erstellung)
- **Auth:** ✅ Erforderlich

### `DELETE /api/apikeys/:id`
- **Service:** `apiKeysService.deleteApiKey()`
- **Beschreibung:** API Key löschen
- **Response:** `void` (204 No Content)
- **Auth:** ✅ Erforderlich

### `POST /api/apikeys/:id/revoke`
- **Service:** `apiKeysService.revokeApiKey()`
- **Beschreibung:** API Key widerrufen
- **Response:** `{ success: boolean }`
- **Auth:** ✅ Erforderlich

---

## 👥 Admin Endpoints

### `GET /api/admin/users`
- **Service:** `adminService.getAllUsers()`
- **Beschreibung:** Alle Benutzer abrufen
- **Query Params:** `tenantId?: string`
- **Response:** `{ success: boolean; data: User[] }`
- **Auth:** ✅ Erforderlich (Admin)

### `GET /api/admin/users/:id`
- **Service:** `adminService.getUserById()`
- **Beschreibung:** Benutzer nach ID abrufen
- **Response:** `{ success: boolean; data: User }`
- **Auth:** ✅ Erforderlich (Admin)

### `POST /api/admin/users`
- **Service:** `adminService.createUser()`
- **Beschreibung:** Neuen Benutzer erstellen
- **Request Body:**
  ```typescript
  {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
    tenantId?: string;
  }
  ```
- **Response:** `{ success: boolean; data: User }`
- **Auth:** ✅ Erforderlich (Admin)

### `PUT /api/admin/users/:id`
- **Service:** `adminService.updateUser()`
- **Beschreibung:** Benutzer aktualisieren
- **Request Body:** `UpdateUserRequest`
- **Response:** `{ success: boolean; data: User }`
- **Auth:** ✅ Erforderlich (Admin)

### `DELETE /api/admin/users/:id`
- **Service:** `adminService.deleteUser()`
- **Beschreibung:** Benutzer löschen
- **Response:** `void`
- **Auth:** ✅ Erforderlich (Admin)

### `GET /api/admin/tenants`
- **Service:** `adminService.getAllTenants()`
- **Beschreibung:** Alle Tenants abrufen
- **Response:** `{ success: boolean; data: Tenant[] }`
- **Auth:** ✅ Erforderlich (Admin)

### `GET /api/admin/tenants/:id`
- **Service:** `adminService.getTenantById()`
- **Beschreibung:** Tenant nach ID abrufen
- **Response:** `{ success: boolean; data: Tenant }`
- **Auth:** ✅ Erforderlich (Admin)

### `POST /api/admin/tenants`
- **Service:** `adminService.createTenant()`
- **Beschreibung:** Neuen Tenant erstellen
- **Request Body:**
  ```typescript
  {
    name: string;
    description?: string;
  }
  ```
- **Response:** `{ success: boolean; data: Tenant }`
- **Auth:** ✅ Erforderlich (Admin)

### `PUT /api/admin/tenants/:id`
- **Service:** `adminService.updateTenant()`
- **Beschreibung:** Tenant aktualisieren
- **Request Body:** `UpdateTenantRequest`
- **Response:** `{ success: boolean; data: Tenant }`
- **Auth:** ✅ Erforderlich (Admin)

### `DELETE /api/admin/tenants/:id`
- **Service:** `adminService.deleteTenant()`
- **Beschreibung:** Tenant löschen
- **Response:** `void`
- **Auth:** ✅ Erforderlich (Admin)

### `GET /api/admin/roles`
- **Service:** `adminService.getRoles()`
- **Beschreibung:** Alle Rollen abrufen
- **Response:** `{ success: boolean; data: Role[] }`
- **Auth:** ✅ Erforderlich (Admin)

### `GET /api/admin/statistics`
- **Service:** `adminService.getStatistics()`
- **Beschreibung:** System-Statistiken abrufen
- **Response:** `{ success: boolean; data: Statistics }`
- **Auth:** ✅ Erforderlich (Admin)

---

## 📄 Document Endpoints

### `POST /api/Documents/upload`
- **Service:** `documentService.uploadDocument()`
- **Beschreibung:** Dokument hochladen
- **Request Body:**
  ```typescript
  {
    fileName: string;
    contentBase64: string;
    workflowId?: string;
  }
  ```
- **Response:** `DocumentUploadResponse`
- **Auth:** ✅ Erforderlich

### `GET /api/Documents/:documentId`
- **Service:** `documentService.getDocument()`
- **Beschreibung:** Dokument nach ID abrufen
- **Response:** `Document`
- **Auth:** ✅ Erforderlich

### `GET /api/Documents/workflow/:workflowId`
- **Service:** `documentService.getWorkflowDocuments()`
- **Beschreibung:** Alle Dokumente eines Workflows abrufen
- **Response:** `Document[]`
- **Auth:** ✅ Erforderlich

### `DELETE /api/Documents/:documentId`
- **Service:** `documentService.deleteDocument()`
- **Beschreibung:** Dokument löschen
- **Response:** `void`
- **Auth:** ✅ Erforderlich

---

## 🔧 Node Discovery & Schema Endpoints

### `GET /api/schemas/nodes`
- **Service:** `nodeDiscoveryService.discoverNodes()`
- **Beschreibung:** Alle verfügbaren Node-Typen vom Backend abrufen
- **Response:**
  ```typescript
  {
    nodes: DiscoveredNode[];
    count: number;
  }
  ```
- **Auth:** ✅ Erforderlich

---

## 🛠️ Function & Handler Endpoints

### `GET /api/functions`
- **Service:** `functionService.getAvailableFunctions()`
- **Beschreibung:** Alle verfügbaren Functions abrufen
- **Query Params:** `_t: number` (Cache-Busting)
- **Response:** `FunctionDefinition[]`
- **Auth:** ✅ Erforderlich

### `GET /api/mcp-handlers`
- **Service:** `mcpService.getAvailableHandlers()`
- **Beschreibung:** Alle verfügbaren MCP Handlers abrufen
- **Query Params:** `_t: number` (Cache-Busting)
- **Response:** `McpHandlerSummary[]`
- **Auth:** ✅ Erforderlich

### `GET /api/web-search-handlers`
- **Service:** `webSearchService.getAvailableHandlers()`
- **Beschreibung:** Alle verfügbaren Web Search Handlers abrufen
- **Query Params:** `_t: number` (Cache-Busting)
- **Response:** `WebSearchHandlerSummary[]`
- **Auth:** ✅ Erforderlich

---

## 🔄 OAuth2 Endpoints

### `POST /api/oauth2/token`
- **Service:** `oauth2Service.handleOAuth2Callback()`
- **Beschreibung:** OAuth2 Authorization Code gegen Access Token tauschen
- **Request Body:**
  ```typescript
  {
    apiId: string;
    code: string;
    state: string;
    codeVerifier: string;
    redirectUri: string;
  }
  ```
- **Response:**
  ```typescript
  {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }
  ```
- **Auth:** ✅ Erforderlich

---

## ⏰ Scheduler Endpoints

### `GET /api/scheduler/timezones`
- **Service:** `ScheduleConfigForm.loadTimezones()`
- **Beschreibung:** Verfügbare Zeitzonen abrufen
- **Response:**
  ```typescript
  {
    systemTimezones: Timezone[];
    ianaTimezones: Timezone[];
  }
  ```
- **Auth:** ✅ Erforderlich

### `POST /api/scheduler/validate-cron`
- **Service:** `ScheduleConfigForm.validateCronExpression()`
- **Beschreibung:** Cron-Expression validieren
- **Request Body:**
  ```typescript
  {
    cronExpression: string;
    timezone: string;
  }
  ```
- **Response:**
  ```typescript
  {
    valid: boolean;
    error?: string;
    nextRunTimes?: string[];
  }
  ```
- **Auth:** ✅ Erforderlich

---

## 🪝 Webhook Endpoints

### `POST /api/webhook/:workflowId`
- **Service:** `WebhookTestPage.testWebhook()` (direkt via `fetch`)
- **Beschreibung:** Webhook testen
- **Request Body:** `any` (JSON)
- **Response:** `any`
- **Auth:** ⚠️ Unklar (vermutlich nicht erforderlich für öffentliche Webhooks)

### `GET /api/webhook/:workflowId/status`
- **Service:** `WebhookTestPage.getWorkflowStatus()` (direkt via `fetch`)
- **Beschreibung:** Workflow-Status abrufen
- **Response:** `any`
- **Auth:** ⚠️ Unklar

---

## 📊 Statistiken

**Gesamtanzahl Endpoints:** 50+

**Kategorien:**
- 🔐 Authentifizierung: 2
- 📊 Workflows: 12
- ⚙️ Execution: 5
- 🧪 Test: 2
- 🔑 Secrets: 6
- 🔐 API Keys: 4
- 👥 Admin: 12
- 📄 Documents: 4
- 🔧 Node Discovery: 1
- 🛠️ Functions/Handlers: 3
- 🔄 OAuth2: 1
- ⏰ Scheduler: 2
- 🪝 Webhooks: 2

---

## 🔍 Wichtige Hinweise

### Response-Format
Die meisten Endpoints verwenden ein einheitliches Response-Format:
```typescript
{
  success: boolean;
  data: T;
}
```

Die Services haben Fallback-Logik für direkte Responses (ohne `success`-Wrapper).

### Authentifizierung
- Alle Requests (außer Login/Register) benötigen einen Bearer Token
- Token wird automatisch aus `localStorage.getItem('auth_token')` geladen
- Bei 401-Fehlern wird automatisch zum Login umgeleitet

### Error Handling
- 401 Unauthorized → Automatische Weiterleitung zum Login
- Errors werden im Format `{ success: false, error: string, code?: string }` zurückgegeben
- Error-Interceptor transformiert Backend-Errors in einheitliches Format

### Node Data Sanitization
- Workflow-Update-Requests werden automatisch sanitized
- `node.data` wird von String zu Object konvertiert (falls nötig)
- Verhindert Backend `InvalidCastException` Fehler

### Cache-Busting
- Function/Handler-Endpoints verwenden `_t: Date.now()` Query-Parameter
- Verhindert Browser-Caching

---

## 📝 Dateien-Referenzen

**API Client:**
- `frontend/src/services/api.ts` - Axios-Konfiguration und Interceptors

**Services:**
- `frontend/src/services/workflowService.ts` - Workflow-Endpoints
- `frontend/src/services/authService.ts` - Auth-Endpoints
- `frontend/src/services/adminService.ts` - Admin-Endpoints
- `frontend/src/services/secretsService.ts` - Secrets-Endpoints
- `frontend/src/services/apiKeysService.ts` - API Keys-Endpoints
- `frontend/src/services/documentService.ts` - Document-Endpoints
- `frontend/src/services/nodeDiscoveryService.ts` - Node Discovery
- `frontend/src/services/functionService.ts` - Functions
- `frontend/src/services/mcpService.ts` - MCP Handlers
- `frontend/src/services/webSearchService.ts` - Web Search Handlers
- `frontend/src/services/oauth2Service.ts` - OAuth2
- `frontend/src/services/sseService.ts` - Server-Sent Events (keine HTTP-Endpoints)

**Components:**
- `frontend/src/components/WorkflowBuilder/ScheduleConfigForm.tsx` - Scheduler-Endpoints
- `frontend/src/pages/WebhookTestPage.tsx` - Webhook-Endpoints (direkt via fetch)

---

**Erstellt von:** Auto (AI Assistant)  
**Datum:** 2025-01-27

