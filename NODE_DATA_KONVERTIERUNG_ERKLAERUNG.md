# Explizite Node-Data-Konvertierung - Erklärung

## Was ist das Problem?

### Aktuelle Situation (Node.js)

```typescript
// In packages/api-service/src/routes/index.ts (Zeile 77)
const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;

// Dann wird workflow direkt an Execution-Service gesendet:
const executionRequestBody = {
  workflow: {
    ...workflow,
    nodes: workflow.nodes || [],
    edges: workflow.edges || [],
  },
  // ...
};
```

**Was passiert:**
- `toObject()` konvertiert das gesamte MongoDB-Dokument zu einem Plain-Object
- **Normalerweise** funktioniert das für `node.data` auch
- **ABER**: Wenn `node.data` verschachtelte MongoDB-Dokumente enthält, könnten diese nicht richtig konvertiert werden

### C# Lösung (alt)

```csharp
// In WebhookController.cs (Zeile 558-584)
nodes = workflow.Nodes?.Select(n => {
    object? nodeData = null;
    if (n.Data != null)
    {
        try
        {
            // EXPLIZIT: BsonDocument → JSON String → Object
            var dataJson = n.Data.ToJson(); // BsonDocument → JSON String
            nodeData = JsonSerializer.Deserialize<object>(dataJson); // JSON String → Plain Object
        }
        catch
        {
            nodeData = null;
        }
    }
    
    return new
    {
        id = n.Id,
        type = n.Type,
        data = nodeData, // ✅ Garantiert Plain-Object
        // ...
    };
}).ToList(),
```

**Warum explizit?**
- C# verwendet `BsonDocument` (MongoDB-spezifisch)
- Diese müssen explizit zu JSON konvertiert werden
- Garantiert, dass `data` immer ein Plain-Object ist

## Ist es in Node.js wirklich ein Problem?

### Wahrscheinlich NICHT, weil:

1. **Mongoose `toObject()`** konvertiert normalerweise alles richtig:
   ```typescript
   const workflow = workflowData.toObject();
   // Sollte node.data bereits als Plain-Object haben
   ```

2. **Schema.Types.Mixed** speichert Daten als Plain-Objects:
   ```typescript
   data: { type: Schema.Types.Mixed } // Speichert als Plain-Object
   ```

### ABER: Sicherheitshalber explizit machen

**Warum?**
- Garantiert, dass es immer funktioniert
- Gleiche Logik wie in C# (Konsistenz)
- Verhindert potenzielle Serialisierungs-Probleme

## Lösung: Explizite Konvertierung hinzufügen

### Option 1: Einfache Konvertierung (empfohlen)

```typescript
// In packages/api-service/src/routes/index.ts

// Nach Zeile 77:
const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;

// EXPLIZIT: Konvertiere node.data zu Plain-Objects
if (workflow.nodes && Array.isArray(workflow.nodes)) {
  workflow.nodes = workflow.nodes.map(node => ({
    ...node,
    data: node.data && typeof node.data === 'object' && node.data.constructor?.name === 'Object'
      ? node.data  // Bereits Plain-Object
      : node.data && typeof node.data.toObject === 'function'
        ? node.data.toObject()  // MongoDB-Dokument → Plain-Object
        : typeof node.data === 'string'
          ? JSON.parse(node.data)  // JSON String → Object
          : node.data  // Fallback
  }));
}
```

### Option 2: JSON-basierte Konvertierung (wie C#)

```typescript
// Explizite Konvertierung über JSON (wie C#)
if (workflow.nodes && Array.isArray(workflow.nodes)) {
  workflow.nodes = workflow.nodes.map(node => {
    let nodeData = node.data;
    
    // Wenn data existiert, konvertiere es explizit
    if (nodeData != null) {
      try {
        // Konvertiere zu JSON und zurück (garantiert Plain-Object)
        const dataJson = JSON.stringify(nodeData);
        nodeData = JSON.parse(dataJson);
      } catch (error) {
        // Falls Konvertierung fehlschlägt, verwende null
        logger.warn({ err: error, nodeId: node.id }, 'Failed to serialize node.data');
        nodeData = null;
      }
    }
    
    return {
      ...node,
      data: nodeData
    };
  });
}
```

## Beispiel: Was könnte schiefgehen?

### Szenario 1: Verschachtelte MongoDB-Dokumente

```javascript
// In MongoDB gespeichert:
{
  nodes: [{
    id: "node-1",
    data: {
      url: "{{steps.node-2.json.field}}",
      config: BsonDocument { ... }  // ❌ MongoDB-Dokument
    }
  }]
}

// Nach toObject():
{
  nodes: [{
    id: "node-1",
    data: {
      url: "{{steps.node-2.json.field}}",
      config: { ... }  // ✅ Sollte funktionieren
    }
  }]
}
```

**Problem:** Wenn `config` noch ein MongoDB-Dokument ist, wird es nicht richtig serialisiert.

### Szenario 2: JSON-String statt Object

```javascript
// In MongoDB gespeichert (wenn als String gespeichert wurde):
{
  nodes: [{
    id: "node-1",
    data: '{"url": "{{steps.node-2.json.field}}"}'  // ❌ String statt Object
  }]
}
```

**Problem:** Execution-Service erwartet ein Object, nicht einen String.

## Empfehlung

**Implementiere Option 2 (JSON-basierte Konvertierung)** - genau wie C#:

1. ✅ Garantiert Plain-Objects
2. ✅ Konsistent mit C#-Version
3. ✅ Behandelt alle Edge-Cases
4. ✅ Einfach zu verstehen

## Code-Änderung

**Datei:** `packages/api-service/src/routes/index.ts`

**Nach Zeile 77 hinzufügen:**

```typescript
// Convert MongoDB document to plain object if needed
const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;

// EXPLIZIT: Konvertiere node.data zu Plain-Objects (wie in C#)
if (workflow.nodes && Array.isArray(workflow.nodes)) {
  workflow.nodes = workflow.nodes.map(node => {
    let nodeData = node.data;
    
    // Explizite Konvertierung (wie C#: BsonDocument.ToJson() → Deserialize)
    if (nodeData != null) {
      try {
        // Konvertiere zu JSON und zurück (garantiert Plain-Object)
        const dataJson = JSON.stringify(nodeData);
        nodeData = JSON.parse(dataJson);
      } catch (error) {
        // Falls Konvertierung fehlschlägt, verwende null
        logger.warn({ err: error, nodeId: node.id }, 'Failed to serialize node.data');
        nodeData = null;
      }
    }
    
    return {
      ...node,
      data: nodeData
    };
  });
}
```

**Wichtig:** Diese Konvertierung muss an **zwei Stellen** gemacht werden:
1. In `test-node-with-context` Route (Zeile 77)
2. In `webhook` Route (Zeile 206)

---

*Erklärung erstellt am: 2024*

