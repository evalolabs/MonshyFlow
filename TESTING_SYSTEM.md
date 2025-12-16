# Test-System Übersicht

## 🧪 Aktueller Test-Status

Das System hat **drei verschiedene Test-Ansätze**:

1. **Unit Tests** (Jest) - Minimal vorhanden
2. **Manuelle Test-Skripte** - Für Integration Tests
3. **Frontend Node Testing** - Interaktives Testing im UI

---

## 1. Unit Tests (Jest)

### Status: ⚠️ Minimal vorhanden

**Test-Framework:** Jest (vermutlich, basierend auf `describe`, `it`, `expect`)

**Aktuelle Tests:**
- ✅ `packages/execution-service/src/services/__tests__/expressionResolutionService.test.ts`
  - Testet Expression Resolution Service
  - 334 Zeilen, umfassende Tests für:
    - Steps Expressions (`{{steps.nodeId.json.field}}`)
    - Input Expressions (`{{input.json.field}}`)
    - Secrets (`{{secrets.KEY}}`)
    - Array Indices (`{{steps.nodeId.json.data[0]}}`)
    - Error Handling
    - Debug Mode

**Test-Konfiguration:**
```json
// packages/execution-service/package.json
"test": "echo \"Error: no test specified\" && exit 1"
```
⚠️ **Problem:** Test-Script ist nicht konfiguriert!

**Fehlende Tests:**
- ❌ Keine Frontend-Tests
- ❌ Keine Tests für Animation System
- ❌ Keine Tests für State Machine
- ❌ Keine Tests für Event Bus
- ❌ Keine Tests für Workflow Execution
- ❌ Keine Tests für Node Processors

---

## 2. Manuelle Test-Skripte

### Status: ✅ Vorhanden, aber nicht automatisiert

**Test-Dateien:**
- `packages/execution-service/test-optimized-nodes.ts`
  - Testet verschiedene Node-Typen (LLM, Agent, API, etc.)
  - Manuell ausführbar: `ts-node test-optimized-nodes.ts`
  
- `packages/execution-service/test-agents-sdk.ts`
  - Testet Agents SDK Integration
  - Manuell ausführbar: `ts-node test-agents-sdk.ts`

- `packages/execution-service/test-full-agents-sdk.ts`
  - Vollständiger Agents SDK Test

**Ausführung:**
```bash
cd packages/execution-service
ts-node test-optimized-nodes.ts
```

**Problem:** 
- Nicht in CI/CD integriert
- Nicht automatisiert
- Keine Assertions (nur Console-Logs)

---

## 3. Frontend Node Testing (Interaktiv)

### Status: ✅ Vollständig implementiert

**Wie es funktioniert:**

```
┌─────────────────────────────────────────────────────────┐
│              DebugPanel (Frontend)                       │
│  - Zeigt Execution Steps                                │
│  - "Play" Button pro Node                               │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│         workflowService.testNode()                       │
│  POST /api/workflows/:id/nodes/:nodeId/test-with-context│
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│         API Service (api-service)                       │
│  - Lädt Workflow aus DB                                 │
│  - Lädt Secrets                                         │
│  - Forwarded zu Execution Service                       │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│      Execution Service (execution-service)              │
│  - testNodeWithContext()                                │
│  - Führt Workflow bis zum Node aus                      │
│  - Gibt Output zurück                                   │
└─────────────────────────────────────────────────────────┘
```

### Test-Flow:

1. **User klickt "Play" Button** im DebugPanel
2. **Frontend:**
   - `DebugPanel.tsx` → `handlePlayNode()`
   - `workflowService.testNode(workflowId, nodeId, input)`
   - Startet Animation sofort (vor Backend-Call)

3. **Backend:**
   - `POST /api/workflows/:workflowId/nodes/:nodeId/test-with-context`
   - API Service lädt Workflow + Secrets
   - Forwarded zu Execution Service
   - Execution Service führt Workflow bis zum Node aus
   - Gibt Output zurück

4. **Frontend:**
   - Erhält Result
   - Aktualisiert DebugPanel
   - Stoppt Animation

### Features:

- ✅ **Context-Aware:** Testet Node mit vollständigem Workflow-Kontext
- ✅ **Input Validation:** Validiert Input gegen Start-Node Schema
- ✅ **Animation:** Startet Animation sofort (vor Backend-Call)
- ✅ **SSE Events:** Empfängt node.start/node.end Events
- ✅ **Error Handling:** Zeigt Fehler im DebugPanel

### Input-Handling:

```typescript
// Wenn Start-Node vorhanden:
// 1. Lädt gespeichertes Input (testInputStorage)
// 2. Validiert gegen Start-Node Schema
// 3. Falls ungültig → zeigt Input Modal
// 4. Falls gültig → verwendet gespeichertes Input

// Wenn kein Start-Node:
// → Verwendet leeres Objekt {}
```

---

## 📊 Test-Architektur

### Backend Test Endpoint

**Route:**
```
POST /api/workflows/:workflowId/nodes/:nodeId/test-with-context
```

**Request Body:**
```json
{
  "userPrompt": "test",
  // ... andere Input-Felder
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "output": { "json": {...}, "metadata": {...} },
    "input": {...},
    "duration": 1234
  },
  "_debug": {
    "receivedBody": {...},
    "bodyKeys": [...],
    // ... Debug-Info
  }
}
```

### Execution Service Test-Funktion

**Datei:** `packages/execution-service/src/controllers/executionController.ts`

**Funktion:** `testNodeWithContext()`

**Was passiert:**
1. Lädt Workflow aus Request
2. Findet Ziel-Node
3. Berechnet Execution Path (Start → Ziel-Node)
4. Führt alle Nodes bis zum Ziel-Node aus
5. Gibt Output des Ziel-Nodes zurück

---

## 🔍 Test-Details

### Expression Resolution Tests

**Datei:** `expressionResolutionService.test.ts`

**Getestet:**
- ✅ Simple Steps: `{{steps.node1.json.field}}`
- ✅ Nested Paths: `{{steps.node1.json.user.name}}`
- ✅ Array Indices: `{{steps.node1.json.data[0]}}`
- ✅ Input: `{{input.json.userPrompt}}`
- ✅ Secrets: `{{secrets.API_KEY}}`
- ✅ Error Handling (throw, warn, fallback)
- ✅ Debug Mode (trace information)

**Beispiel:**
```typescript
it('should resolve simple steps expression', () => {
  const context = {
    steps: {
      'node1': createNodeData({ field: 'value' }, 'node1', 'test')
    },
    input: null,
    secrets: {}
  };
  const result = service.resolveExpressions(
    '{{steps.node1.json.field}}',
    context
  );
  expect(result).toBe('value');
});
```

---

## ⚠️ Probleme & Lücken

### 1. Fehlende Test-Infrastruktur

**Problem:**
- Jest nicht konfiguriert (package.json: `"test": "echo Error..."`)
- Keine Test-Dependencies installiert
- Keine Test-Scripts

**Lösung:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

### 2. Keine Frontend-Tests

**Problem:**
- Keine React-Tests
- Keine Component-Tests
- Keine Hook-Tests

**Empfehlung:**
- Vitest für Frontend (kompatibel mit Vite)
- React Testing Library
- Tests für Animation System (State Machine, Event Bus)

### 3. Manuelle Tests nicht automatisiert

**Problem:**
- Test-Skripte müssen manuell ausgeführt werden
- Keine CI/CD Integration
- Keine Assertions

**Lösung:**
- In Jest-Tests umwandeln
- Oder in separate Integration-Test-Suite

### 4. Keine E2E-Tests

**Problem:**
- Keine End-to-End Tests
- Keine Workflow-Execution Tests

**Empfehlung:**
- Playwright oder Cypress
- Test kompletter Workflow-Flows

---

## 🚀 Empfohlene Test-Strategie

### Phase 1: Test-Infrastruktur aufbauen

1. **Backend:**
   - Jest konfigurieren
   - Test-Scripts hinzufügen
   - Dependencies installieren

2. **Frontend:**
   - Vitest konfigurieren
   - React Testing Library setup
   - Test-Utilities erstellen

### Phase 2: Unit Tests schreiben

1. **Animation System:**
   - State Machine Tests
   - Event Bus Tests
   - Hook Tests

2. **Backend Services:**
   - Execution Service Tests
   - Node Processor Tests
   - Expression Resolution Tests (erweitern)

### Phase 3: Integration Tests

1. **Node Testing:**
   - Automatisierte Node-Tests
   - Verschiedene Node-Typen testen

2. **Workflow Execution:**
   - Komplette Workflow-Flows
   - Error Cases

### Phase 4: E2E Tests

1. **UI Tests:**
   - Workflow Builder Interaktionen
   - Node Testing im UI
   - Animation System

---

## 📝 Test-Beispiele

### Animation System Test (Zukünftig)

```typescript
// useAnimationStateMachine.test.ts
describe('useAnimationStateMachine', () => {
  it('should transition from idle to waiting_for_start', () => {
    const { result } = renderHook(() => 
      useAnimationStateMachine({
        executionOrder: [mockNode1, mockNode2],
        testingNodeId: null,
        isExecuting: true
      })
    );
    
    expect(result.current.getStateType()).toBe('waiting_for_start');
  });
});
```

### Event Bus Test (Zukünftig)

```typescript
// animationEventBus.test.ts
describe('SSEAnimationEventBus', () => {
  it('should buffer early events', () => {
    const mockSSE = createMockSSEConnection();
    const eventBus = new SSEAnimationEventBus(mockSSE);
    
    // Emit event before handler registered
    eventBus.emit('node_start_received', { nodeId: 'node1' });
    
    // Register handler
    const handler = jest.fn();
    eventBus.on('node_start_received', handler);
    
    // Handler should receive buffered event
    expect(handler).toHaveBeenCalled();
  });
});
```

---

## 🎯 Zusammenfassung

| Test-Typ | Status | Framework | Anzahl |
|----------|--------|-----------|--------|
| **Unit Tests (Backend)** | ⚠️ Minimal | Jest | 1 Datei |
| **Unit Tests (Frontend)** | ❌ Keine | - | 0 |
| **Integration Tests** | ⚠️ Manuell | - | 3 Skripte |
| **E2E Tests** | ❌ Keine | - | 0 |
| **Node Testing (UI)** | ✅ Vollständig | - | 1 Feature |

**Nächste Schritte:**
1. Jest/Vitest konfigurieren
2. Test-Infrastruktur aufbauen
3. Animation System Tests schreiben
4. Frontend Component Tests hinzufügen



