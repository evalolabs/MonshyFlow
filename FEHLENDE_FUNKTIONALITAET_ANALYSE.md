# Fehlende Funktionalität: C# → Node.js Migration Analyse

## Vergleich: C# (alt) vs Node.js (neu) - Variablen-Kontext

### ✅ Was funktioniert in Node.js

#### 1. Webhook-Execution ✅
**Pfad:** `packages/api-service/src/routes/index.ts` (Zeile 190-307)

**Status:** ✅ **IMPLEMENTIERT**

- ✅ Webhook-Endpunkt: `POST /api/webhook/:workflowId`
- ✅ Lädt Workflow aus Datenbank
- ✅ Lädt Secrets für Tenant
- ✅ Sendet an Execution-Service

**Code:**
```typescript
app.post('/api/webhook/:workflowId', async (req: Request, res: Response) => {
  // Load workflow
  const workflowData = await workflowService.getById(workflowId);
  const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;
  
  // Load secrets
  const secretsResponse = await axios.get(
    `${secretsServiceUrl}/api/internal/secrets/tenant/${workflow.tenantId}`,
    // ...
  );
  
  // Send to execution-service
  const executionRequestBody = {
    input: input,
    workflow: {
      ...workflow,
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      secrets: secrets, // ✅ Secrets werden mitgesendet
    },
  };
  
  await axios.post(
    `${executionServiceUrl}/v1/workflows/${workflowId}/runs`,
    executionRequestBody
  );
});
```

#### 2. Test-Node-Execution ✅
**Pfad:** `packages/api-service/src/routes/index.ts` (Zeile 63-158)

**Status:** ✅ **IMPLEMENTIERT**

- ✅ Endpunkt: `POST /api/workflows/:workflowId/nodes/:nodeId/test-with-context`
- ✅ Lädt Workflow
- ✅ Lädt Secrets
- ✅ Sendet an Execution-Service

**Code:**
```typescript
app.post('/api/workflows/:workflowId/nodes/:nodeId/test-with-context', async (req, res) => {
  // Load workflow
  const workflowData = await workflowService.getById(workflowId);
  const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;
  
  // Load secrets
  // ... (gleiche Logik wie Webhook)
  
  // Send to execution-service
  const executionRequestBody = {
    workflow: {
      ...workflow,
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
    },
    nodeId,
    input: req.body.input || {},
    secrets: secrets, // ✅ Secrets werden mitgesendet
  };
  
  await axios.post(
    `${executionServiceUrl}/api/execute/test-node-with-context`,
    executionRequestBody
  );
});
```

#### 3. Workflow-Speicherung ✅
**Pfad:** `packages/api-service/src/repositories/WorkflowRepository.ts`

**Status:** ✅ **IMPLEMENTIERT**

- ✅ Workflows werden in MongoDB gespeichert
- ✅ Nodes mit `data` Feld werden gespeichert
- ✅ Variablen werden als normale Strings gespeichert (wie in C#)

---

### ⚠️ Potenzielle Unterschiede / Zu prüfen

#### 1. Workflow-Datenstruktur beim Senden

**C# (alt):**
```csharp
var workflowObj = new
{
    id = workflow.Id,
    name = workflow.Name,
    nodes = workflow.Nodes?.Select(n => {
        object? nodeData = null;
        if (n.Data != null)
        {
            var dataJson = n.Data.ToJson(); // BsonDocument → JSON
            nodeData = JsonSerializer.Deserialize<object>(dataJson);
        }
        return new
        {
            id = n.Id,
            type = n.Type,
            data = nodeData, // ✅ Explizite Konvertierung
            // ...
        };
    }).ToList(),
    edges = workflow.Edges?.Select(e => new { ... }).ToList(),
    secrets = secrets // ✅ Separate Übergabe
};
```

**Node.js (neu):**
```typescript
const executionRequestBody = {
  workflow: {
    ...workflow, // ✅ Spread-Operator - alle Felder werden übernommen
    nodes: workflow.nodes || [],
    edges: workflow.edges || [],
    secrets: secrets, // ✅ Secrets werden im Workflow-Objekt mitgesendet
  },
  input: input,
};
```

**Unterschied:**
- **C#**: Konvertiert `BsonDocument` explizit zu JSON-Objekt
- **Node.js**: Verwendet `toObject()` oder Spread-Operator
- **Mögliches Problem**: Wenn `workflow.nodes[].data` ein MongoDB-Dokument ist, könnte es nicht richtig serialisiert werden

#### 2. Input-Daten-Struktur

**C# (alt):**
```csharp
// Input wird als BsonDocument übergeben
var inputJson = input.ToJson(); // BsonDocument → JSON String
var inputObj = JsonSerializer.Deserialize<object>(inputJson);

var requestBody = new
{
    workflow = workflowObj,
    input = inputObj, // ✅ Als Objekt
    secrets = secrets
};
```

**Node.js (neu):**
```typescript
const executionRequestBody = {
  input: input, // ✅ Direkt als req.body
  workflow: {
    ...workflow,
    secrets: secrets,
  },
};
```

**Unterschied:**
- **C#**: Konvertiert Input explizit
- **Node.js**: Verwendet direkt `req.body`
- **Status**: ✅ Sollte funktionieren, da Express JSON automatisch parst

#### 3. Secrets-Übergabe

**C# (alt):**
```csharp
// Secrets werden separat UND im Workflow-Objekt übergeben
var requestBody = new
{
    workflow = workflowObj, // Enthält secrets
    input = inputObj,
    secrets = secrets // ✅ Auch separat
};
```

**Node.js (neu):**
```typescript
// Secrets werden nur im Workflow-Objekt übergeben
const executionRequestBody = {
  workflow: {
    ...workflow,
    secrets: secrets, // ✅ Nur im Workflow
  },
  input: input,
  // ❌ KEINE separate secrets-Übergabe
};
```

**Unterschied:**
- **C#**: Secrets werden **zweimal** übergeben (im Workflow UND separat)
- **Node.js**: Secrets werden **nur einmal** übergeben (im Workflow)
- **Mögliches Problem**: Execution-Service könnte separate `secrets` erwarten

#### 4. Node-Data-Serialisierung

**C# (alt):**
```csharp
// Explizite Konvertierung von BsonDocument
if (n.Data != null)
{
    var dataJson = n.Data.ToJson(); // BsonDocument → JSON String
    nodeData = JsonSerializer.Deserialize<object>(dataJson); // JSON String → Object
}
```

**Node.js (neu):**
```typescript
// Verwendet toObject() oder Spread-Operator
const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;
// nodes werden direkt übernommen
```

**Mögliches Problem:**
- Wenn `node.data` ein MongoDB-Dokument ist, könnte es nicht richtig serialisiert werden
- `toObject()` sollte das konvertieren, aber es ist nicht explizit für `node.data` gemacht

---

### 🔍 Zu prüfende Punkte

#### 1. Node-Data-Serialisierung
**Frage:** Werden `node.data` Felder richtig serialisiert, wenn sie MongoDB-Dokumente sind?

**C# Lösung:**
```csharp
var dataJson = n.Data.ToJson();
nodeData = JsonSerializer.Deserialize<object>(dataJson);
```

**Node.js Lösung (aktuell):**
```typescript
const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;
```

**Empfehlung:** Explizite Konvertierung für `node.data` hinzufügen:
```typescript
const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;
workflow.nodes = workflow.nodes?.map(node => ({
  ...node,
  data: node.data && typeof node.data.toObject === 'function' 
    ? node.data.toObject() 
    : node.data
}));
```

#### 2. Secrets-Übergabe
**Frage:** Erwartet Execution-Service separate `secrets` oder nur im Workflow?

**C#:** Beides
**Node.js:** Nur im Workflow

**Empfehlung:** Separate `secrets` hinzufügen (wie in C#):
```typescript
const executionRequestBody = {
  workflow: {
    ...workflow,
    secrets: secrets,
  },
  input: input,
  secrets: secrets, // ✅ Auch separat (wie C#)
};
```

#### 3. Input-Struktur
**Frage:** Wird Input richtig strukturiert?

**C#:** Konvertiert BsonDocument explizit
**Node.js:** Verwendet direkt `req.body`

**Status:** ✅ Sollte funktionieren, aber prüfen ob Execution-Service die gleiche Struktur erwartet

---

### 📋 Zusammenfassung

#### ✅ Was funktioniert:
1. ✅ Webhook-Execution-Endpunkt
2. ✅ Test-Node-Execution-Endpunkt
3. ✅ Secrets werden geladen
4. ✅ Workflow wird an Execution-Service gesendet
5. ✅ Workflow-Speicherung

#### ⚠️ Potenzielle Probleme:
1. ⚠️ **Node-Data-Serialisierung**: Könnte Probleme geben, wenn `node.data` MongoDB-Dokumente sind
2. ⚠️ **Secrets-Übergabe**: Wird nur im Workflow übergeben, nicht separat (C# macht beides)
3. ⚠️ **Input-Struktur**: Sollte funktionieren, aber nicht explizit konvertiert wie in C#

#### 🔧 Empfohlene Fixes:
1. **Explizite Node-Data-Konvertierung** hinzufügen
2. **Separate Secrets-Übergabe** hinzufügen (wie in C#)
3. **Input-Struktur prüfen** und ggf. explizit konvertieren

---

*Analyse erstellt am: 2024*
*Basierend auf Vergleich C# vs Node.js Implementierung*

