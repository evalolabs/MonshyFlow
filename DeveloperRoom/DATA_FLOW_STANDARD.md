# 📊 Datenfluss-Standard - NodeData Container

## 🎯 Übersicht

Der **Datenfluss-Standard** definiert eine einheitliche Struktur für den Datenaustausch zwischen Nodes. Jeder Node erhält und gibt einen standardisierten `NodeData` Container zurück.

---

## 📦 NodeData Struktur

### C# (AgentBuilder.AgentService/Models/NodeData.cs)

```csharp
public class NodeData
{
    // Hauptdaten (kann beliebige Struktur sein)
    public BsonValue? Json { get; set; }
    
    // Metadaten (immer vorhanden)
    public NodeMetadata Metadata { get; set; }
    
    // Optional: Schema-Information
    public NodeSchema? Schema { get; set; }
    
    // Optional: Fehler-Information
    public NodeError? Error { get; set; }
}

public class NodeMetadata
{
    public string NodeId { get; set; }
    public string NodeType { get; set; }
    public DateTime Timestamp { get; set; }
    public string Source { get; set; } // "webhook" | "schedule" | "manual" | "node" | "merge"
    public string? PreviousNodeId { get; set; }
}
```

### TypeScript (execution-service/src/models/nodeData.ts)

```typescript
interface NodeData {
  json: any; // Hauptdaten (standardisiert)
  metadata: NodeMetadata;
  schema?: NodeSchema;
  error?: NodeError;
}

interface NodeMetadata {
  nodeId: string;
  nodeType: string;
  timestamp: string; // ISO 8601
  source: 'webhook' | 'schedule' | 'manual' | 'node' | 'merge';
  previousNodeId?: string;
}
```

---

## 🔄 Datenfluss-Prinzipien

### 1. Einfacher Datenfluss (Sequentiell)

```
StartNode → NodeA → NodeB → EndNode
```

**Jeder Node:**
- **Input**: `NodeData` vom vorherigen Node
- **Output**: `NodeData` für den nächsten Node

### 2. Multi-Input (Branching)

```
        → NodeA →
StartNode → NodeB → MergeNode → EndNode
        → NodeC →
```

**MergeNode:**
- **Input**: `NodeData` mit `json` als Array von allen Inputs
- **Metadata.source**: `"merge"`
- **Output**: `NodeData` (zusammengeführt)

### 3. Multi-Output (Splitting)

```
StartNode → SplitNode → NodeA
                    → NodeB
                    → NodeC
```

**SplitNode:**
- **Output**: `NodeData[]` (Array für mehrere nächste Nodes)
- **WorkflowExecutionEngine** verteilt an alle nächsten Nodes

---

## 🛠️ Implementierung

### C# BaseNodeProcessor

```csharp
public abstract class BaseNodeProcessor : INodeProcessor
{
    // Neue standardisierte Methode
    public virtual async Task<NodeData?> ProcessNodeDataAsync(
        Node node, 
        NodeData? input, 
        ExecutionContext context)
    {
        // Override in derived classes
        // Default: Falls nicht implementiert, verwendet ProcessAsync
    }
    
    // Helper: Create NodeData
    protected NodeData CreateNodeData(
        object? data,
        string nodeId,
        string nodeType,
        string? previousNodeId = null,
        string? source = null)
    {
        return NodeData.Create(data, nodeId, nodeType, previousNodeId, source);
    }
    
    // Helper: Extract typed data
    protected T? ExtractData<T>(NodeData? input)
    {
        return input?.ExtractData<T>();
    }
}
```

### TypeScript NodeProcessor

```typescript
interface NodeProcessor {
  type: string;
  name: string;
  
  // Neue standardisierte Methode
  processNodeData?: (
    node: any, 
    input: NodeData | null, 
    context: NodeProcessorContext
  ) => Promise<NodeData | null>;
  
  // Legacy (Rückwärtskompatibel)
  process?: (
    node: any, 
    input: any, 
    context: NodeProcessorContext
  ) => Promise<any>;
}
```

---

## 📝 Verwendungsbeispiele

### Beispiel 1: Einfacher Node (C#)

```csharp
public class MyNodeProcessor : BaseNodeProcessor
{
    public override async Task<NodeData?> ProcessNodeDataAsync(
        Node node, 
        NodeData? input, 
        ExecutionContext context)
    {
        // Extract data
        var inputData = ExtractData<MyInputType>(input);
        
        // Process
        var result = await DoSomething(inputData);
        
        // Return NodeData
        return CreateNodeData(
            result,
            node.Id,
            node.Type ?? "my-node",
            input?.Metadata.NodeId
        );
    }
}
```

### Beispiel 2: Einfacher Node (TypeScript)

```typescript
registerNodeProcessor({
    type: 'my-node',
    name: 'My Node',
    processNodeData: async (node, input, context) => {
        // Extract data
        const inputData = extractData<MyInputType>(input);
        
        // Process
        const result = await doSomething(inputData);
        
        // Return NodeData
        return createNodeData(
            result,
            node.id,
            node.type,
            input?.metadata.nodeId
        );
    },
});
```

### Beispiel 3: Expression-basiert

```typescript
// Node nutzt Expression: {{steps.node-1.data.name}}
const name = evaluateExpression('{{steps.node-1.data.name}}', context);
const result = { greeting: `Hello ${name}!` };
return createNodeData(result, node.id, node.type, previousNodeId);
```

---

## 🔍 WorkflowExecutionEngine Integration

### C# Engine

Der `WorkflowExecutionEngine` sammelt automatisch NodeData-Inputs:

```csharp
private NodeData? CollectNodeDataInput(ExecutionContext context, Node node)
{
    // 1. Finde vorherige Nodes (via Edges)
    var previousEdges = context.Workflow.Edges
        .Where(e => e.Target == node.Id)
        .ToList();
    
    // 2. Ein Input: Direkt weitergeben
    if (previousEdges.Count == 1)
    {
        var previousNodeId = previousEdges[0].Source;
        return context.Variables[$"node_{previousNodeId}_output"] as NodeData;
    }
    
    // 3. Mehrere Inputs: Array sammeln
    if (previousEdges.Count > 1)
    {
        var inputs = previousEdges
            .Select(e => context.Variables[$"node_{e.Source}_output"] as NodeData)
            .ToList();
        return new NodeData { Data = inputs, Metadata = { Source = "merge" } };
    }
    
    // 4. Start-Node: Input von Execution
    return context.Variables["input"] as NodeData;
}
```

### TypeScript ExecutionService

Der `ExecutionService` konvertiert automatisch zu NodeData:

```typescript
private convertToNodeData(data: any, nodeId: string, nodeType: string): NodeData {
    if (data && typeof data === 'object' && 'data' in data && 'metadata' in data) {
        return data; // Already NodeData
    }
    return createNodeData(data, nodeId, nodeType);
}
```

---

## 🔄 Rückwärtskompatibilität

### Legacy Nodes (ohne NodeData)

Bestehende Nodes, die noch `ProcessAsync` (C#) oder `process` (TypeScript) verwenden, funktionieren weiterhin:

- **C#**: `BaseNodeProcessor` konvertiert automatisch zwischen `BsonDocument` und `NodeData`
- **TypeScript**: `ExecutionService` konvertiert automatisch zu `NodeData`

### Migration

Neue Nodes sollten `ProcessNodeDataAsync` / `processNodeData` verwenden:

1. **C#**: Override `ProcessNodeDataAsync` statt `ProcessAsync`
2. **TypeScript**: Implementiere `processNodeData` statt `process`

---

## 📊 Expression-System Integration

### Neue Syntax (✅ Implementiert)

Das Expression-System wurde erweitert, um NodeData-Syntax zu unterstützen:

```typescript
// Standard-Syntax:
{{steps.node-1.json}}                    // Komplettes json-Feld
{{steps.node-1.json.field}}              // Spezifisches Feld im json
{{steps.node-1.metadata.nodeId}}         // Metadaten-Zugriff
{{steps.node-1.metadata.timestamp}}      // Timestamp
{{steps.node-1.metadata.source}}         // Source (webhook, schedule, etc.)

// Legacy (funktioniert weiterhin für Rückwärtskompatibilität):
{{steps.node-1.data}}                    // Legacy-Syntax → wird zu json umgeleitet
{{steps.node-1.output}}                  // Legacy-Syntax
{{input}}                                 // Workflow-Input
{{input.json.field}}                     // Input mit NodeData
```

### Variable Storage

Der Engine speichert NodeData unter zwei Keys:

```typescript
// In TypeScript execution-service:
execution.steps[nodeId] = result; // Neue Expression-Syntax
```

### Implementierung

Die `resolveWorkflowExpressions()` Methode in `expressionResolutionService.ts` wurde erweitert:
- Unterstützt `{{steps.nodeId.json}}` Syntax
- Unterstützt `{{steps.nodeId.json.field}}` für verschachtelte Felder
- Unterstützt `{{steps.nodeId.metadata.*}}` für Metadaten-Zugriff
- Automatische Umleitung von `{{steps.nodeId.data}}` zu `{{steps.nodeId.json}}` für Rückwärtskompatibilität

---

## ✅ Vorteile

1. **Konsistenz**: Einheitliche Struktur für alle Nodes
2. **Flexibilität**: `json` kann beliebige Struktur haben
3. **Nachvollziehbarkeit**: Metadaten für jeden Schritt
4. **Debugging**: Einfaches Tracing über `metadata.previousNodeId`
5. **Validierung**: Optionales Schema-System
6. **Erweiterbarkeit**: Neue Felder ohne Breaking Changes
7. **Rückwärtskompatibilität**: Legacy `data`-Expressions werden automatisch zu `json` umgeleitet

---

## 🚀 Best Practices

1. **Immer NodeData verwenden**: Neue Nodes sollten `processNodeData` implementieren
2. **Metadaten nutzen**: `previousNodeId` für Tracing, `source` für Debugging
3. **Typisierte Extraktion**: Nutze `extractData<T>()` für type-safe Zugriff
4. **Fehlerbehandlung**: Nutze `NodeError` für strukturierte Fehler
5. **Schema-Definition**: Optional, aber empfohlen für Validierung
6. **Expression-Syntax**: Nutze `{{steps.nodeId.json.field}}` für bessere Lesbarkeit

## ✅ Schema-Validierung

### Implementierung

Ein optionales Schema-Validierungssystem wurde implementiert (`SchemaValidator.cs`):

```csharp
// In ProcessNodeDataAsync:
var validationResult = SchemaValidator.Validate(input, node.InputSchema);
if (!validationResult.IsValid)
{
    return CreateNodeData(
        null,
        node.Id,
        node.Type ?? "unknown",
        input?.Metadata.NodeId
    )
    {
        Error = new NodeError
        {
            Message = string.Join(", ", validationResult.Errors),
            Code = "VALIDATION_ERROR"
        }
    };
}
```

### Schema-Format (JSON Schema)

```json
{
  "type": "object",
  "required": ["field1", "field2"],
  "properties": {
    "field1": { "type": "string" },
    "field2": { "type": "number" }
  }
}
```

### Verwendung

1. **Input-Schema**: Definiere `inputSchema` im Node-Config
2. **Output-Schema**: Definiere `outputSchema` im Node-Config (optional)
3. **Validierung**: Wird automatisch in `ProcessNodeDataAsync` durchgeführt

---

## 📚 Weitere Ressourcen

- **STARTNODE_DATA_FLOW.md**: StartNode-spezifischer Datenfluss
- **EXECUTION_ARCHITECTURE.md**: Execution-Architektur-Übersicht
- **Code-Beispiele**: Siehe bestehende Node-Implementierungen

---

**🎉 Mit diesem Standard ist der Datenfluss zwischen Nodes konsistent, nachvollziehbar und erweiterbar!**

