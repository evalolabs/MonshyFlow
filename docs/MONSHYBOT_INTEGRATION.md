# 🎤 MonshyBot Integration Guide

**Zweck:** Dokumentation für MonshyBot-Entwickler zur Integration von MonshyFlow SSO, API und Workflow (Function Calling)

**Zielgruppe:** Entwickler, die MonshyBot entwickeln und MonshyFlow nutzen

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [SSO Integration](#sso-integration)
3. [API Integration](#api-integration)
4. [Workflow Integration (Function Calling)](#workflow-integration-function-calling)
5. [Beispiele](#beispiele)
6. [Fehlerbehandlung](#fehlerbehandlung)

---

## 🎯 Übersicht

### Was ist MonshyFlow?

MonshyFlow ist eine **AI-Powered Workflow Automation Platform**, die:
- **SSO (Single Sign-On)** für Authentifizierung bereitstellt
- **REST API** für Workflow-Management bietet
- **Workflow Execution** als Function Calling ermöglicht

### Integration-Architektur

```
MonshyBot (Voicebot System)
    ↓
    ├─> SSO (Authentifizierung)
    ├─> API (Workflow Management)
    └─> Workflow Execution (Function Calling)
```

---

## 🔐 SSO Integration

### Übersicht

MonshyFlow bietet **JWT-basierte Authentifizierung** mit:
- Login/Register Endpoints
- JWT Token Management
- API Key Support

### API Endpoints

#### 1. Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "tenantId": "tenant-id",
      "role": "user"
    }
  }
}
```

**Wichtig:** Das Token ist in `data.token`, nicht direkt im Root!

**Beispiel (TypeScript):**
```typescript
async function login(email: string, password: string) {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (data.success && data.data) {
    // Token speichern (aus data.data.token, nicht data.token!)
    localStorage.setItem('auth_token', data.data.token);
    return data.data;
  } else {
    throw new Error(data.error || 'Login failed');
  }
}
```

#### 2. Register

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "tenantId": "tenant-id",
      "role": "user"
    }
  }
}
```

**Wichtig:** Das Token ist in `data.token`, nicht direkt im Root!

#### 3. User Info abrufen (me)

**Endpoint:** `GET /api/auth/me`

**Request:**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "693812cab08300a74f736a88",
  "email": "admin@acme.com",
  "firstName": "Admin",
  "lastName": "User",
  "roles": ["admin", "user"],
  "tenantId": "693812cab08300a74f736a70",
  "tenantName": "Acme Corporation"
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

#### 4. Token Validierung

**Endpoint:** `GET /api/auth/validate`

**Request:**
```http
GET /api/auth/validate
Authorization: Bearer <token>
```

**Response (200 OK - Token gültig):**
```json
{
  "valid": true,
  "user": {
    "id": "693812cab08300a74f736a88",
    "email": "admin@acme.com",
    "firstName": "Admin",
    "lastName": "User",
    "roles": ["admin", "user"],
    "tenantId": "693812cab08300a74f736a70",
    "tenantName": "Acme Corporation"
  },
  "expiresAt": "2025-12-22T10:30:00Z"
}
```

**Response (401 Unauthorized - Token ungültig):**
```json
{
  "valid": false,
  "error": "Token expired"
}
```

**Token Format:**
```
Authorization: Bearer <token>
```

**Token wird automatisch validiert bei:**
- API Requests mit `Authorization` Header
- Alle `/api/*` Endpoints (außer `/api/auth/login`, `/api/auth/register`, `/api/auth/validate`)

---

## 🔌 API Integration

### Base URL

```
http://localhost:5000  # Development
https://api.monshyflow.com  # Production
```

### Authentifizierung

**Alle API Requests benötigen einen Token:**

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
};
```

### API Endpoints

#### Workflow Management

##### 1. Alle Workflows abrufen

**Endpoint:** `GET /api/workflows`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "workflow-id",
      "name": "My Workflow",
      "description": "Workflow description",
      "nodes": [...],
      "edges": [...],
      "published": true,
      "createdAt": "2025-12-21T10:00:00Z"
    }
  ]
}
```

##### 2. Workflow nach ID abrufen

**Endpoint:** `GET /api/workflows/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "workflow-id",
    "name": "My Workflow",
    "nodes": [...],
    "edges": [...]
  }
}
```

##### 3. Veröffentlichte Workflows abrufen

**Endpoint:** `GET /api/workflows/published`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "workflow-id",
      "name": "Published Workflow",
      "published": true
    }
  ]
}
```

##### 4. Workflow erstellen

**Endpoint:** `POST /api/workflows`

**Request:**
```json
{
  "name": "New Workflow",
  "description": "Workflow description",
  "nodes": [],
  "edges": []
}
```

##### 5. Workflow aktualisieren

**Endpoint:** `PUT /api/workflows/:id`

**Request:**
```json
{
  "name": "Updated Workflow",
  "nodes": [...],
  "edges": [...]
}
```

##### 6. Workflow veröffentlichen

**Endpoint:** `POST /api/workflows/publish`

**Request:**
```json
{
  "workflowId": "workflow-id"
}
```

---

## ⚙️ Workflow Integration (Function Calling)

### Übersicht

Workflows können als **Function Calling** verwendet werden. Das bedeutet:
- Workflow wird als **Funktion** aufgerufen
- Input wird übergeben
- Output wird zurückgegeben
- Ideal für Voicebot Integration

### Execution Endpoints

**Es gibt zwei Endpoints:**

1. **`POST /api/workflows/:workflowId/execute`** (Empfohlen für MonshyBot)
   - Benötigt JWT Token oder API Key (Authorization Header)
   - Vollständige Execution mit Auth
   - Unterstützt alle Features
   - Für integrierte Systeme (MonshyBot, eigene Apps)

2. **`POST /api/webhooks/:workflowId`** (Für externe Webhooks)
   - Keine Auth nötig
   - Für öffentliche Webhooks
   - Workflow muss published sein
   - Für externe Systeme (GitHub, Stripe, etc.)

**Für MonshyBot:** Verwende `POST /api/workflows/:workflowId/execute` mit JWT Token oder API Key!

### Execution Endpoint (Empfohlen)

**Endpoint:** `POST /api/workflows/:workflowId/execute`

**Request:**
```json
{
  "input": {
    "message": "Hello, world!",
    "userId": "user-123",
    "timestamp": "2025-12-21T10:00:00Z"
  }
}
```

**Response:**
```json
{
  "executionId": "execution-id",
  "status": "completed",
  "output": {
    "result": "Workflow output",
    "data": {...}
  }
}
```

### Execution Status abrufen

**Endpoint:** `GET /api/execution/:executionId`

**Response:**
```json
{
  "id": "execution-id",
  "workflowId": "workflow-id",
  "status": "completed",
  "output": {...},
  "trace": [...],
  "createdAt": "2025-12-21T10:00:00Z",
  "completedAt": "2025-12-21T10:00:05Z"
}
```

### Status-Werte

- `pending` - Workflow wartet auf Ausführung
- `running` - Workflow wird ausgeführt
- `completed` - Workflow erfolgreich abgeschlossen
- `failed` - Workflow fehlgeschlagen

---

## 💡 Beispiele

### Beispiel 1: Komplette Integration

```typescript
// MonshyBot Integration
class MonshyBotIntegration {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  // SSO: Login
  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      // Response Format: { success: true, data: { token, user } }
      this.token = data.data.token;
      return data.data;
    }
    
    throw new Error(data.error || 'Login failed');
  }

  // SSO: Get current user
  async getCurrentUser() {
    const response = await fetch(`${this.baseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return await response.json();
  }

  // SSO: Validate token
  async validateToken(token?: string) {
    const tokenToValidate = token || this.token;
    const response = await fetch(`${this.baseUrl}/api/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${tokenToValidate}`,
      },
    });

    const data = await response.json();
    return data;
  }

  // API: Workflow abrufen
  async getWorkflow(workflowId: string) {
    const response = await fetch(`${this.baseUrl}/api/workflows/${workflowId}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    const data = await response.json();
    return data.data;
  }

  // API: Tenant Info abrufen
  async getTenant(tenantId: string) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get tenant: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  // Workflow Execution (Function Calling)
  async executeWorkflow(workflowId: string, input: any) {
    // WICHTIG: Verwende /api/workflows/:workflowId/execute (nicht /api/webhooks/:workflowId)
    // /api/workflows/:workflowId/execute benötigt Auth und ist für programmatische Calls
    // /api/webhooks/:workflowId ist für öffentliche Webhooks ohne Auth
    const response = await fetch(`${this.baseUrl}/api/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ input }),
    });

    const data = await response.json();
    
    // Polling für Completion
    if (data.status === 'running' || data.status === 'pending') {
      return await this.waitForCompletion(data.executionId);
    }
    
    return data;
  }

  // Polling für Completion
  private async waitForCompletion(executionId: string, maxWait: number = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const response = await fetch(`${this.baseUrl}/api/execution/${executionId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const data = await response.json();
      
      if (data.status === 'completed') {
        return data;
      } else if (data.status === 'failed') {
        throw new Error(data.error || 'Workflow execution failed');
      }
      
      // Warte 500ms vor nächstem Poll
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error('Workflow execution timeout');
  }
}

// Verwendung
const integration = new MonshyBotIntegration();

// Login
await integration.login('user@example.com', 'password');

// Workflow ausführen
const result = await integration.executeWorkflow('workflow-id', {
  message: 'Hello from Voicebot!',
  userId: 'user-123',
});
```

### Beispiel 2: Voicebot Function Calling

```typescript
// Voicebot nutzt Workflow als Function
class VoicebotWorkflowFunction {
  private integration: MonshyBotIntegration;

  constructor(integration: MonshyBotIntegration) {
    this.integration = integration;
  }

  // Workflow als Function aufrufen
  async callWorkflow(workflowId: string, userInput: string) {
    const input = {
      message: userInput,
      timestamp: new Date().toISOString(),
      source: 'voicebot',
    };

    const result = await this.integration.executeWorkflow(workflowId, input);
    
    return result.output;
  }

  // Beispiel: Customer Support Workflow
  async handleCustomerSupport(userMessage: string) {
    const workflowId = 'customer-support-workflow-id';
    return await this.callWorkflow(workflowId, userMessage);
  }

  // Beispiel: Order Processing Workflow
  async processOrder(orderData: any) {
    const workflowId = 'order-processing-workflow-id';
    return await this.callWorkflow(workflowId, JSON.stringify(orderData));
  }
}
```

### Beispiel 3: Python Integration

```python
import requests
import time

class MonshyFlowClient:
    def __init__(self, base_url='http://localhost:5000'):
        self.base_url = base_url
        self.token = None
    
    def login(self, email, password):
        response = requests.post(
            f'{self.base_url}/api/auth/login',
            json={'email': email, 'password': password}
        )
        data = response.json()
        
        if data.get('success'):
            self.token = data['token']
            return data
        else:
            raise Exception(data.get('error', 'Login failed'))
    
    def execute_workflow(self, workflow_id, input_data):
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            f'{self.base_url}/api/workflows/{workflow_id}/execute',
            headers=headers,
            json={'input': input_data}
        )
        
        data = response.json()
        
        # Polling für Completion
        if data.get('status') in ['running', 'pending']:
            return self.wait_for_completion(data['executionId'])
        
        return data
    
    def wait_for_completion(self, execution_id, max_wait=30):
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            response = requests.get(
                f'{self.base_url}/api/execution/{execution_id}',
                headers={'Authorization': f'Bearer {self.token}'}
            )
            
            data = response.json()
            
            if data['status'] == 'completed':
                return data
            elif data['status'] == 'failed':
                raise Exception(data.get('error', 'Workflow execution failed'))
            
            time.sleep(0.5)
        
        raise Exception('Workflow execution timeout')

# Verwendung
client = MonshyFlowClient()
client.login('user@example.com', 'password')

result = client.execute_workflow('workflow-id', {
    'message': 'Hello from Python!'
})
```

---

## 🚨 Fehlerbehandlung

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (ungültige Daten)
- `401` - Unauthorized (Token fehlt oder ungültig)
- `403` - Forbidden (keine Berechtigung)
- `404` - Not Found (Workflow nicht gefunden)
- `500` - Internal Server Error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Fehlerbehandlung (TypeScript)

```typescript
try {
  const result = await integration.executeWorkflow('workflow-id', input);
} catch (error) {
  if (error.response?.status === 401) {
    // Token ungültig - neu einloggen
    await integration.login(email, password);
  } else if (error.response?.status === 404) {
    // Workflow nicht gefunden
    console.error('Workflow not found');
  } else {
    // Anderer Fehler
    console.error('Error:', error.message);
  }
}
```

---

## 📚 Weitere Ressourcen

- **MonshyFlow Repository:** https://github.com/evalolabs/MonshyFlow
- **FAQ & Klarstellungen:** Siehe `docs/MONSHYBOT_FAQ.md`
- **API Dokumentation:** Siehe `docs/API.md` (wenn vorhanden)
- **Workflow Builder:** Siehe Frontend für Workflow-Erstellung

## ❓ FAQ

**Häufige Fragen:** Siehe `docs/MONSHYBOT_FAQ.md` für:
- Auth-Endpoints Status
- Workflow Execution Endpoint Klarstellung
- Login Response Format
- Troubleshooting

---

## 🔧 Setup

### 1. MonshyFlow starten

```bash
cd MonshyFlow
pnpm install
pnpm dev
```

### 2. API URL konfigurieren

```typescript
const API_URL = process.env.MONSHYFLOW_API_URL || 'http://localhost:5000';
```

### 3. Test-User erstellen

```bash
# Via Seed Script
cd seed
pnpm run seed
```

---

## ✅ Checkliste

- [ ] SSO Integration implementiert
- [ ] API Client erstellt
- [ ] Workflow Execution (Function Calling) implementiert
- [ ] Fehlerbehandlung implementiert
- [ ] Token Management implementiert
- [ ] Polling für Completion implementiert

---

**Letzte Aktualisierung:** 2025-12-21

