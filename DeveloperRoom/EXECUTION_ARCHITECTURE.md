# Execution-Architektur Übersicht

## 🎯 Kurze Antwort

**Alle Execution-Pfade (Debug Panel, Webhook, Schedule) verwenden jetzt ausschließlich den TypeScript Execution Service**. Die C# `WorkflowExecutionEngine` wurde vollständig entfernt.

---

## 📊 Execution-Pfade im Detail

### 1. Debug Panel (Play-Icon auf Agent-Node)

```
Frontend
  ↓
POST /api/workflows/{workflowId}/nodes/{nodeId}/test-with-context
  ↓
WorkflowsController.cs (C#) - Proxy
  ↓
HTTP POST → execution-service:5002/api/workflows/{workflowId}/nodes/{nodeId}/test-with-context
  ↓
executionController.testNodeWithContext() (TypeScript)
  ↓
executionService.processNode() (TypeScript)
  ↓
buildToolsForAgent() → Registry (TypeScript)
  ↓
OpenAI Agents SDK
```

**Wichtig**: Debug Panel ruft direkt den **execution-service (TypeScript)** auf!

---

### 2. Postman Webhook (SYNC Mode)

```
Postman
  ↓
POST /api/webhook/{workflowId}
  ↓
WebhookController.cs (C#) - Proxy
  ↓
HTTP POST → execution-service:5002/v1/workflows/{id}/runs (TypeScript)
  ↓
workflowRunController.handleSyncRun()
  ↓
executionService.executeWorkflowWithObject()
  ↓
processNode() → buildToolsForAgent() → Registry (TypeScript)
  ↓
OpenAI Agents SDK
```

**Direkter Pfad**: C# → TypeScript execution-service

---

### 3. Postman Webhook (BACKGROUND Mode)

```
Postman
  ↓
POST /api/webhook/{workflowId}
  ↓
WebhookController.cs (C#) - Proxy
  ↓
CallExecutionServiceInBackgroundAsync() (Background Task)
  ↓
HTTP POST → execution-service:5002/v1/workflows/{id}/runs (TypeScript)
  ↓
workflowRunController.handleSyncRun()
  ↓
executionService.executeWorkflowWithObject()
  ↓
processNode() → buildToolsForAgent() → Registry (TypeScript)
  ↓
OpenAI Agents SDK
```

**Auch hier**: C# delegiert direkt an TypeScript execution-service

---

## 🔄 Gemeinsame Komponenten

### ✅ Alle verwenden:

1. **execution-service (TypeScript)**
   - `executionService.ts` - Haupt-Execution-Logik
   - `executionStorageService.ts` - MongoDB Persistierung
   - `buildToolsForAgent()` - Tool-Erkennung
   - **Registry-System** (TypeScript) für Nodes und Tools
   - OpenAI Agents SDK
   - **MCP Tools**: Unterstützt Standard MCP Handler und OpenAI Connectors (via `hostedMcpTool`)

2. **MongoDB Execution State**
   - `Execution` Dokumente für persistente Execution-States
   - `WorkflowRun` Dokumente für Run-Historie
   - `cleanupService.ts` - Automatische Bereinigung alter Executions

3. **TypeScript Registry System**
   - `getToolCreator()` / `getNodeProcessor()` - lädt Nodes/Tools aus `shared/registry.json`
   - **Single Source of Truth**: `shared/registry.json`
   - Auto-Discovery für Frontend via `/api/schemas/nodes`

---

## 🏗️ Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend / Postman                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              AgentBuilder.AgentService (C#)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  WorkflowsController (Debug Panel - Proxy)          │    │
│  │  WebhookController (Webhook - Proxy)                │    │
│  │  SchedulerService (Schedule - Proxy)                │    │
│  └──────────────┬─────────────────────────────────────┘    │
└─────────────────┼──────────────────────────────────────────┘
                  │
                  │ HTTP POST (alle Execution-Pfade)
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│            execution-service (TypeScript)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  executionService.ts                                │    │
│  │  - executeWorkflow()                                │    │
│  │  - processNode()                                    │    │
│  │  - buildToolsForAgent()                             │    │
│  │  - Verwendet TypeScript Node/Tool Registry          │    │
│  └──────────────┬─────────────────────────────────────┘    │
│                 │                                           │
│                 ├───────────────────────────────────────────┤
│                 │                                           │
│                 ▼                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │  executionStorageService.ts                         │    │
│  │  - MongoDB Persistierung                           │    │
│  │  - Execution State Management                       │    │
│  └──────────────┬─────────────────────────────────────┘    │
│                 │                                           │
│                 ▼                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │  MongoDB                                             │    │
│  │  - Execution Collection                              │    │
│  │  - WorkflowRun Collection                           │    │
│  └────────────────────────────────────────────────────┘    │
│                 │                                           │
│                 ▼                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │  OpenAI Agents SDK                                 │    │
│  │  - Agent Creation                                  │    │
│  │  - Tool Integration                                │    │
│  │  - Execution                                       │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Fazit

### Einheitliches System:

**JA** - Alle Execution-Pfade (Debug Panel, Webhook, Schedule) verwenden jetzt ausschließlich den **TypeScript execution-service**.

### Unterschiede:

1. **Debug Panel**:
   - C# Controller als Proxy
   - Endpoint: `/api/workflows/{workflowId}/nodes/{nodeId}/test-with-context`
   - Delegiert direkt an TypeScript execution-service

2. **Webhook (sync)**:
   - C# Controller als Proxy
   - Endpoint: `/v1/workflows/{id}/runs`
   - Delegiert direkt an TypeScript execution-service

3. **Webhook (background)**:
   - C# Controller als Proxy (Background Task)
   - Endpoint: `/v1/workflows/{id}/runs`
   - Delegiert direkt an TypeScript execution-service

4. **Schedule**:
   - C# `SchedulerService` als Proxy
   - Endpoint: `/v1/workflows/{id}/runs`
   - Delegiert direkt an TypeScript execution-service

### Warum einheitlich?

- **TypeScript execution-service**: Führt alle Workflow-Execution aus
- **MongoDB**: Persistiert Execution-States für Skalierbarkeit
- **C# Services**: Nur noch als Gateway/Proxy für API-Routing

### Registry System:

- **TypeScript Registry**: Lädt Node-Processors und Tool-Creators aus `shared/registry.json`
- **Frontend Auto-Discovery**: Lädt Node-Metadaten automatisch von `/api/schemas/nodes`
- **Single Source of Truth**: `shared/registry.json` für Backend, Auto-Discovery für Frontend

---

## 🎯 Vorteile der aktuellen Architektur

✅ **Vollständig einheitlich**: Alle Execution-Pfade verwenden den TypeScript execution-service  
✅ **Skalierbarkeit**: MongoDB-basierte Execution-States ermöglichen horizontale Skalierung  
✅ **Persistenz**: Execution-States überleben Service-Restarts  
✅ **Auto-Discovery**: Frontend lädt Node-Metadaten automatisch vom Backend  
✅ **Registry-System**: Automatische Node/Tool-Erkennung  
✅ **Cleanup**: Automatische Bereinigung alter Executions  

---

## 🔧 Architektur-Entscheidungen

### ✅ Implementiert: Vollständig einheitlich

**Alle Execution über TypeScript execution-service:**
- Debug Panel → TypeScript execution-service
- Webhook → TypeScript execution-service
- Schedule → TypeScript execution-service
- C# Services nur noch als Gateway/Proxy

**Vorteile**: 
- Ein System, keine Duplikation
- MongoDB-basierte Skalierbarkeit
- Persistente Execution-States
- Frontend Auto-Discovery

---

## 📝 Zusammenfassung

**Aktuell**: 
- ✅ Alle Execution-Pfade verwenden den **TypeScript execution-service**
- ✅ **MongoDB** für Execution-State Persistierung
- ✅ **Frontend Auto-Discovery** für Node-Metadaten
- ✅ **Registry-System** für automatische Node/Tool-Erkennung

**Status**: 
- ✅ Architektur ist vollständig vereinheitlicht
- ✅ C# Services dienen nur noch als Gateway/Proxy
- ✅ TypeScript execution-service ist die Single Source of Truth für Execution

