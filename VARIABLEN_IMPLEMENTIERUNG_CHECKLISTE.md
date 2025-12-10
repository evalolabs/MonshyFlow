# Checkliste: Variable-Implementierung basierend auf execution-service

## Grundlage: execution-service Struktur

**Wichtig:** Diese Checkliste basiert **ausschließlich** auf der neuen `execution-service` Implementierung. Alle Anpassungen orientieren sich an:

- `ExpressionContext`: `{ steps: Record<string, NodeData>, input: NodeData | null, secrets: Record<string, string> }`
- `NodeData`: `{ json?: any, metadata: NodeMetadata, error?: NodeError }`
- `test-node-with-context` Endpoint: Gibt `output: NodeData` und `previousOutputs: Array<{nodeId, nodeType, label, output: NodeData}>` zurück

---

## Phase 1: Datenstruktur & MongoDB Schema (Kritisch)

### 1.1 Expression-Syntax in MongoDB speichern ✅
**Ziel:** Expressions werden als String mit `{{...}}` Syntax gespeichert

- [ ] **Bestätigung:** Expressions werden bereits als String gespeichert (z.B. `"url": "{{steps.node1.json.field}}"`)
- [ ] **Dokumentation:** Expression-Syntax wird nicht in MongoDB validiert, nur als String gespeichert
- [ ] **Format:** 
  ```json
  {
    "url": "https://api.example.com/{{steps.http-request.json.data.id}}",
    "headers": {
      "Authorization": "Bearer {{secrets.API_KEY}}"
    }
  }
  ```
- [ ] **Dateien betroffen:** 
  - `packages/api-service/src/services/WorkflowService.ts` (speichert node.data)
  - `packages/database/src/models/Workflow.ts` (Mongoose Schema - keine Änderung nötig)

**Zeitaufwand:** ~30 Minuten (nur Dokumentation)  
**Risiko:** Niedrig  
**Status:** ✅ Bereits implementiert

---

### 1.2 NodeData-Struktur in MongoDB
**Ziel:** Sicherstellen, dass NodeData korrekt serialisiert/deserialisiert wird

- [ ] **Prüfung:** Workflow.nodes[].data wird als `any` gespeichert (flexibel)
- [ ] **Bestätigung:** Expressions in `node.data` werden als String gespeichert
- [ ] **Beispiel:**
  ```json
  {
    "nodes": [
      {
        "id": "http-request-1",
        "type": "http-request",
        "data": {
          "url": "{{steps.start.json.userPrompt}}",
          "method": "GET"
        }
      }
    ]
  }
  ```
- [ ] **Keine Änderung nötig:** MongoDB Schema unterstützt bereits flexible `data` Struktur

**Zeitaufwand:** ~15 Minuten (nur Prüfung)  
**Risiko:** Niedrig  
**Status:** ✅ Bereits korrekt

---

## Phase 2: Variable Popup - Datenstruktur (Kritisch)

### 2.1 Datenquelle: test-node-with-context Endpoint
**Ziel:** Frontend erhält Variable-Daten vom execution-service

- [ ] **Endpoint:** `POST /api/execute/test-node-with-context`
- [ ] **Request Body:**
  ```typescript
  {
    workflow: Workflow,
    nodeId: string,
    input: NodeData | null,
    secrets: Record<string, string>
  }
  ```
- [ ] **Response Structure (execution-service):**
  ```typescript
  {
    success: true,
    nodeId: string,
    nodeType: string,
    output: NodeData,  // { json?: any, metadata: NodeMetadata }
    previousOutputs: Array<{
      nodeId: string,
      nodeType: string,
      label: string,
      output: NodeData  // { json?: any, metadata: NodeMetadata }
    }>,
    execution: {
      id: string,
      status: string,
      trace: Array<any>
    }
  }
  ```
- [ ] **Dateien betroffen:**
  - `packages/execution-service/src/controllers/executionController.ts` ✅ (bereits implementiert)
  - `packages/api-service/src/routes/index.ts` (forwarding zu execution-service) ✅ (bereits implementiert)

**Zeitaufwand:** ~1 Stunde (Prüfung & Dokumentation)  
**Risiko:** Niedrig  
**Status:** ✅ Bereits implementiert

---

### 2.2 Variable Popup - Datenstruktur für Frontend
**Ziel:** Frontend erhält strukturierte Daten für Variable Popup

**Basierend auf ExpressionContext:**
```typescript
interface VariableTreeData {
  // Input (von start node)
  input: {
    json: any | null;
    metadata: NodeMetadata;
  } | null;
  
  // Steps (alle vorherigen Nodes)
  steps: Record<string, {
    nodeId: string;
    nodeType: string;
    label: string;
    output: {
      json: any | null;
      metadata: NodeMetadata;
    };
  }>;
  
  // Secrets (nur Namen, keine Werte)
  secrets: string[];  // Array von Secret-Namen
}
```

- [ ] **Transformation:** API-Service transformiert `test-node-with-context` Response zu `VariableTreeData`
  ```typescript
  // Transformation in api-service
  const variableTreeData: VariableTreeData = {
    input: response.execution.trace.find(t => t.nodeId === 'start-xxx')?.output || null,
    steps: response.previousOutputs.reduce((acc, prev) => {
      acc[prev.nodeId] = {
        nodeId: prev.nodeId,
        nodeType: prev.nodeType,
        label: prev.label,
        output: prev.output  // NodeData: { json, metadata }
      };
      return acc;
    }, {}),
    secrets: Object.keys(secrets)  // Nur Namen
  };
  ```
- [ ] **Dateien betroffen:**
  - `packages/api-service/src/routes/index.ts` (neue Transformation)
  - `packages/api-service/src/types/variableTree.ts` (neue Type-Definition)

**Zeitaufwand:** ~2 Stunden  
**Risiko:** Mittel  
**Status:** ⏳ Zu implementieren

---

### 2.3 Variable Popup - Expression-Pfade
**Ziel:** Frontend zeigt verfügbare Expression-Pfade basierend auf NodeData-Struktur

**Expression-Syntax (basierend auf execution-service):**
```typescript
// Steps
{{steps.<nodeId>.json.<path>}}        // ✅ Primär (json Feld)
{{steps.<nodeId>.metadata.<field>}}   // ✅ Metadata-Zugriff

// Input
{{input.json.<path>}}                 // ✅ Primär (json Feld)
{{input.metadata.<field>}}            // ✅ Metadata-Zugriff

// Secrets
{{secrets.<name>}}                     // ✅ Secret-Zugriff
{{secret:<name>}}                      // ✅ Legacy-Format (wird automatisch umgeleitet)
```

- [ ] **Frontend zeigt an:**
  - `input.json.*` - Alle Pfade in `input.json`
  - `steps.<nodeId>.json.*` - Alle Pfade in `steps[nodeId].json`
  - `steps.<nodeId>.metadata.*` - Metadata-Felder
  - `secrets.*` - Verfügbare Secret-Namen (ohne Werte)
- [ ] **Pfad-Generierung:** Frontend generiert Pfade rekursiv aus `json` Objekt
  ```typescript
  function generatePaths(obj: any, prefix: string = ''): string[] {
    if (typeof obj !== 'object' || obj === null) return [prefix];
    if (Array.isArray(obj)) {
      return [
        ...obj.slice(0, 5).map((_, i) => `${prefix}[${i}]`),
        `${prefix}.length`
      ];
    }
    const paths: string[] = [];
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newPath = prefix ? `${prefix}.${key}` : key;
        paths.push(newPath);
        paths.push(...generatePaths(obj[key], newPath));
      }
    }
    return paths;
  }
  ```
- [ ] **Dateien betroffen:**
  - `packages/frontend/src/components/VariableTreePopover.tsx` (Pfad-Generierung)
  - `packages/frontend/src/utils/variablePathGenerator.ts` (neue Utility)

**Zeitaufwand:** ~3-4 Stunden  
**Risiko:** Mittel  
**Status:** ⏳ Zu implementieren

---

## Phase 3: Frontend - Variable Popup UI (Wichtig)

### 3.1 VariableTreePopover - Datenstruktur anpassen
**Ziel:** Popover verwendet neue NodeData-Struktur (json statt data)

- [ ] **Aktuelle Struktur prüfen:** `VariableTreePopover.tsx` erwartet `{ data, metadata }`?
- [ ] **Anpassung:** Popover erwartet `{ json, metadata }` (basierend auf NodeData)
- [ ] **Code-Änderung:**
  ```typescript
  // Alt (Legacy)
  const hasData = nodeOutput?.data !== undefined;
  const data = nodeOutput?.data;
  
  // Neu (NodeData)
  const hasJson = nodeOutput?.json !== undefined;
  const json = nodeOutput?.json;
  ```
- [ ] **Backward Compatibility:** Unterstützung für Legacy `data` Feld (falls vorhanden)
  ```typescript
  const json = nodeOutput?.json ?? nodeOutput?.data;  // Fallback
  ```
- [ ] **Dateien betroffen:**
  - `packages/frontend/src/components/VariableTreePopover.tsx`

**Zeitaufwand:** ~2 Stunden  
**Risiko:** Mittel  
**Status:** ⏳ Zu implementieren

---

### 3.2 VariableTreePopover - Expression-Insertion
**Ziel:** Popover fügt korrekte Expression-Syntax ein

- [ ] **Expression-Format:** `{{steps.<nodeId>.json.<path>}}`
- [ ] **Insert-Funktion:**
  ```typescript
  function insertExpression(nodeId: string, path: string, type: 'steps' | 'input' | 'secrets'): string {
    if (type === 'input') {
      return `{{input.json.${path}}}`;
    }
    if (type === 'secrets') {
      return `{{secrets.${path}}}`;
    }
    return `{{steps.${nodeId}.json.${path}}}`;
  }
  ```
- [ ] **Metadata-Zugriff:** Separate Option für `{{steps.<nodeId>.metadata.<field>}}`
- [ ] **Dateien betroffen:**
  - `packages/frontend/src/components/VariableTreePopover.tsx`
  - `packages/frontend/src/utils/expressionBuilder.ts` (neue Utility)

**Zeitaufwand:** ~2 Stunden  
**Risiko:** Niedrig  
**Status:** ⏳ Zu implementieren

---

### 3.3 ExpressionEditor - Validierung
**Ziel:** Frontend validiert Expression-Syntax (optional, basierend auf expressionValidator)

- [ ] **Optional:** Frontend kann `expressionValidator` Logik replizieren (nur Syntax-Check)
- [ ] **Syntax-Validierung:**
  ```typescript
  function validateExpressionSyntax(expression: string): boolean {
    if (!expression.startsWith('{{') || !expression.endsWith('}}')) return false;
    const inner = expression.slice(2, -2).trim();
    const patterns = [
      /^steps\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_.\[\]]+$/,
      /^input\.[a-zA-Z0-9_.\[\]]+$/,
      /^secrets\.[a-zA-Z0-9_-]+$/
    ];
    return patterns.some(p => p.test(inner));
  }
  ```
- [ ] **Visual Feedback:** Ungültige Expressions werden rot markiert
- [ ] **Dateien betroffen:**
  - `packages/frontend/src/components/ExpressionEditor.tsx`
  - `packages/frontend/src/utils/expressionValidator.ts` (neue Utility)

**Zeitaufwand:** ~2-3 Stunden  
**Risiko:** Niedrig  
**Status:** ⏳ Optional

---

## Phase 4: API-Service - Daten-Transformation (Wichtig)

### 4.1 test-node-with-context Response Transformation
**Ziel:** API-Service transformiert execution-service Response zu Frontend-Format

- [ ] **Neuer Endpoint:** `GET /api/workflows/:workflowId/nodes/:nodeId/variables`
- [ ] **Oder:** Erweitere bestehenden `test-node-with-context` Endpoint
- [ ] **Transformation:**
  ```typescript
  // In api-service/src/routes/index.ts
  app.get('/api/workflows/:workflowId/nodes/:nodeId/variables', async (req, res) => {
    const { workflowId, nodeId } = req.params;
    
    // 1. Hole Workflow
    const workflow = await workflowService.getById(workflowId);
    
    // 2. Hole Input (von Start Node)
    const startNode = workflow.nodes.find(n => n.type === 'start');
    const input = startNode?.data?.inputSchema ? { /* ... */ } : null;
    
    // 3. Rufe execution-service auf
    const executionResponse = await fetch('http://execution-service:3000/api/execute/test-node-with-context', {
      method: 'POST',
      body: JSON.stringify({
        workflow,
        nodeId,
        input,
        secrets: {}  // Secrets werden separat geholt
      })
    });
    
    // 4. Transformiere Response
    const variableTreeData = transformToVariableTree(executionResponse);
    
    res.json(variableTreeData);
  });
  ```
- [ ] **Dateien betroffen:**
  - `packages/api-service/src/routes/index.ts`
  - `packages/api-service/src/utils/variableTreeTransformer.ts` (neue Utility)
  - `packages/api-service/src/types/variableTree.ts` (neue Type-Definition)

**Zeitaufwand:** ~3-4 Stunden  
**Risiko:** Mittel  
**Status:** ⏳ Zu implementieren

---

### 4.2 Secrets-Handling
**Ziel:** API-Service holt Secret-Namen (ohne Werte) für Variable Popup

- [ ] **Secret-Service Integration:** Hole Secret-Namen vom Secret-Service
- [ ] **Response:** Nur Namen, keine Werte (Sicherheit)
  ```typescript
  {
    secrets: ['API_KEY', 'DATABASE_PASSWORD', 'WEBHOOK_SECRET']
  }
  ```
- [ ] **Dateien betroffen:**
  - `packages/api-service/src/services/SecretService.ts` (neue Methode: `getSecretNames()`)
  - `packages/api-service/src/routes/index.ts` (Secret-Namen in Variable-Tree einbinden)

**Zeitaufwand:** ~1-2 Stunden  
**Risiko:** Niedrig  
**Status:** ⏳ Zu implementieren

---

## Phase 5: Testing & Validierung (Wichtig)

### 5.1 Expression-Resolution Testen
**Ziel:** Sicherstellen, dass alle Expression-Formate korrekt aufgelöst werden

- [ ] **Test-Cases:**
  - `{{steps.node1.json.field}}` ✅
  - `{{steps.node1.json.nested.field}}` ✅
  - `{{steps.node1.json.array[0]}}` ✅
  - `{{input.json.userPrompt}}` ✅
  - `{{input.json.nested.data}}` ✅
  - `{{secrets.API_KEY}}` ✅
  - `{{steps.node1.metadata.nodeId}}` ✅
- [ ] **Test-Methode:** Manuell im Frontend testen
- [ ] **Dateien betroffen:** Keine (nur Testing)

**Zeitaufwand:** ~2 Stunden  
**Risiko:** Niedrig  
**Status:** ⏳ Zu testen

---

### 5.2 Variable Popup Testen
**Ziel:** Sicherstellen, dass Popup alle verfügbaren Variablen korrekt anzeigt

- [ ] **Test-Szenarien:**
  - Start Node: Zeigt `input.json.*` korrekt
  - HTTP Request Node: Zeigt `steps.start.json.*` korrekt
  - Agent Node: Zeigt `steps.http-request.json.*` korrekt
  - Secrets: Zeigt Secret-Namen (ohne Werte)
- [ ] **Test-Methode:** Manuell im Frontend testen
- [ ] **Dateien betroffen:** Keine (nur Testing)

**Zeitaufwand:** ~2 Stunden  
**Risiko:** Niedrig  
**Status:** ⏳ Zu testen

---

## Phase 6: Dokumentation (Optional)

### 6.1 Expression-Syntax Dokumentation
**Ziel:** Dokumentiere alle unterstützten Expression-Formate

- [ ] **Dokumentation erstellen:** `EXPRESSION_SYNTAX.md`
- [ ] **Inhalt:**
  - Steps: `{{steps.<nodeId>.json.<path>}}`
  - Input: `{{input.json.<path>}}`
  - Secrets: `{{secrets.<name>}}`
  - Metadata: `{{steps.<nodeId>.metadata.<field>}}`
  - Array-Zugriff: `{{steps.node1.json.array[0]}}`
  - Nested Objects: `{{steps.node1.json.user.name}}`
- [ ] **Dateien betroffen:**
  - `EXPRESSION_SYNTAX.md` (neu)

**Zeitaufwand:** ~1 Stunde  
**Risiko:** Niedrig  
**Status:** ⏳ Optional

---

## Zusammenfassung

### ✅ Bereits implementiert (execution-service):
- Expression-Resolution mit `json` Feld
- `test-node-with-context` Endpoint
- NodeData-Struktur: `{ json, metadata }`
- ExpressionContext: `{ steps, input, secrets }`

### ⏳ Zu implementieren:
1. **API-Service:** Transformation von `test-node-with-context` Response zu VariableTreeData
2. **Frontend:** VariableTreePopover anpassen (json statt data)
3. **Frontend:** Expression-Pfad-Generierung
4. **Frontend:** Expression-Insertion mit korrekter Syntax
5. **API-Service:** Secrets-Namen für Popup
6. **Testing:** Manuelle Tests aller Expression-Formate

### 📊 Geschätzter Gesamtaufwand:
- **Phase 1:** ✅ Bereits fertig (0h)
- **Phase 2:** ~6-7 Stunden
- **Phase 3:** ~6-7 Stunden
- **Phase 4:** ~4-6 Stunden
- **Phase 5:** ~4 Stunden
- **Phase 6:** ~1 Stunde (optional)

**Gesamt:** ~20-24 Stunden

---

## Wichtige Hinweise

1. **Keine Änderungen am execution-service:** Alle Anpassungen nur in API-Service und Frontend
2. **NodeData-Struktur:** Immer `{ json, metadata }` verwenden (nicht `data`)
3. **Expression-Syntax:** Immer `{{steps.<nodeId>.json.<path>}}` (nicht `{{steps.<nodeId>.data.<path>}}`)
4. **Backward Compatibility:** Optional Legacy-Support für `data` Feld (nur im Frontend)

