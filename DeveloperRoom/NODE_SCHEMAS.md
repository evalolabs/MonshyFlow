# 📋 Node Schema Standards

## Übersicht

Jeder Node-Typ in `shared/registry.json` hat jetzt **Standard-Schemas** für Input und Output definiert. Diese Schemas:

- ✅ Dokumentieren die erwarteten Datenstrukturen
- ✅ Ermöglichen automatische Validierung
- ✅ Unterstützen Type-Safety und IDE-Autocomplete
- ✅ Erleichtern die Integration zwischen Nodes

---

## Schema-Struktur

### Input Schema
Definiert, welche Daten ein Node als Input erwartet.

### Output Schema
Definiert, welche Daten ein Node als Output liefert.

### Format
Beide Schemas verwenden **JSON Schema Draft 2020-12**:

```json
{
  "inputSchema": {
    "type": "object",
    "description": "...",
    "properties": { ... },
    "required": [ ... ]
  },
  "outputSchema": {
    "type": "object",
    "description": "...",
    "properties": { ... },
    "required": [ ... ]
  }
}
```

---

## Standard-Schemas pro Node-Typ

### 🚀 Start Node

**Input Schema:**
- Optional und anpassbar pro Workflow
- Standard: Akzeptiert beliebige Daten (`additionalProperties: true`)

**Output Schema:**
```json
{
  "entryType": "string",      // "webhook" | "schedule" | "manual"
  "method": "string",          // HTTP method
  "input": "any",              // Original input data
  "message": "string",         // Workflow start message
  "label": "string?",          // Optional: Node label
  "description": "string?"    // Optional: Node description
}
```

---

### ⬜ End Node

**Input Schema:**
- Akzeptiert beliebige Daten von vorherigen Nodes

**Output Schema:**
- Gibt Input als Output zurück (Workflow-Ergebnis)

---

### 👤 Agent Node

**Input Schema:**
- Akzeptiert beliebige Daten (typischerweise String-Prompt oder strukturierte Daten)

**Output Schema:**
```json
{
  "output": "string | object | array",  // Agent's response
  "trace": "array?",                    // Optional: Execution trace
  "usage": {                            // Optional: Token usage
    "prompt_tokens": "number",
    "completion_tokens": "number",
    "total_tokens": "number"
  }
}
```

---

### 🤖 LLM Node

**Input Schema:**
- String-Prompt oder strukturiertes Objekt
- Variablen wie `{{steps.nodeId.data}}` werden aufgelöst

**Output Schema:**
```json
{
  "response": "string",         // LLM's text response
  "model": "string?",           // Optional: Model used
  "usage": {                    // Optional: Token usage
    "prompt_tokens": "number",
    "completion_tokens": "number",
    "total_tokens": "number"
  },
  "finish_reason": "string?"   // "stop" | "length" | "content_filter" | "tool_calls"
}
```

---

### 🌐 HTTP Request Node

**Input Schema:**
- Beliebige Daten
- Wenn `sendInput: true`, werden diese Daten als Request Body gesendet

**Output Schema:**
```json
{
  "status": "number",           // HTTP status code (200, 404, etc.)
  "statusText": "string?",      // HTTP status text
  "data": "any",                // Response body (parsed JSON or string)
  "headers": "object?",         // Response headers
  "url": "string?",             // URL that was called
  "method": "string?"           // HTTP method used
}
```

---

## Verwendung

### 1. Schema-Validierung in Processors

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

### 2. Schema aus Registry laden

Die Schemas sind in `shared/registry.json` definiert und können zur Laufzeit geladen werden:

```csharp
// Beispiel: Schema aus Registry laden
var nodeConfig = LoadNodeConfigFromRegistry(nodeType);
var inputSchema = nodeConfig?.InputSchema;
var outputSchema = nodeConfig?.OutputSchema;
```

### 3. Frontend: Schema-basierte Validierung

Im Frontend können die Schemas für:
- ✅ Form-Validierung
- ✅ Type-Hints in Expression Editor
- ✅ Auto-Complete
- ✅ Dokumentation

verwendet werden.

---

## Best Practices

1. **Immer Output-Schema definieren**: Dokumentiert, was der Node zurückgibt
2. **Input-Schema optional**: Nur wenn spezifische Struktur erforderlich
3. **Flexible Schemas**: Nutze `additionalProperties: true` für Erweiterbarkeit
4. **Beschreibungen**: Immer `description` Felder für bessere Dokumentation
5. **Required Fields**: Nur wirklich erforderliche Felder als `required` markieren

---

## Erweiterung

### Neues Schema hinzufügen

1. Öffne `shared/registry.json`
2. Finde den Node-Eintrag
3. Füge `inputSchema` und/oder `outputSchema` hinzu:

```json
{
  "type": "my-node",
  "inputSchema": {
    "type": "object",
    "properties": {
      "myField": { "type": "string" }
    },
    "required": ["myField"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "string" }
    }
  }
}
```

4. Validiere: `npm run validate:registry` (in `shared/`)

---

## Status

✅ **Implementiert:**
- Start Node
- End Node
- Agent Node
- LLM Node
- HTTP Request Node

⏳ **Noch zu implementieren:**
- Weitere Node-Typen (wenn hinzugefügt)

---

**Letzte Aktualisierung:** ${new Date().toISOString()}

