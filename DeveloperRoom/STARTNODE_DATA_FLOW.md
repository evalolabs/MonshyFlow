# StartNode: Datenfluss und Schema

## 🎯 Übersicht

Der **StartNode** ist der Entry Point eines Workflows. Er empfängt Input-Daten (z.B. von Webhook, Schedule, Manual) und gibt sie strukturiert an die nächsten Nodes weiter.

---

## 📥 **INPUT: Was bekommt der StartNode?**

### Quellen

1. **Webhook** (`entryType: "webhook"`)
   - HTTP Request Body (POST/PUT/PATCH)
   - Query Parameters
   - Headers

2. **Schedule** (`entryType: "schedule"`)
   - Geplante Trigger (Cron, etc.)
   - Konfigurierte Input-Daten

3. **Manual** (`entryType: "manual"`)
   - Manuelle Ausführung über API
   - Test-Inputs

### Input-Struktur (von WebhookController)

Der `WebhookController` verarbeitet den Request und erstellt ein `BsonDocument` mit folgender Struktur:

```json
{
  "userPrompt": "string",           // Priorität 1: Explizit gesetzt
                                    // Priorität 2: Aus "message", "query", "text", "input" extrahiert
                                    // Priorität 3: Erster String-Wert aus Body
                                    // Fallback: Leerer String ""
  
  "message": "string",              // Original, falls vorhanden
  "query": "string",                // Original, falls vorhanden
  "text": "string",                 // Original, falls vorhanden
  "input": "string",                // Original, falls vorhanden
  
  // Alle anderen Body-Felder werden übernommen
  "customField": "value",
  "anotherField": { ... },
  
  "_metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "source": "webhook",
    "method": "POST",
    "headers": { ... },
    "query": { ... }
  }
}
```

### Input-Verarbeitung (WebhookController.cs)

```csharp
// 1. Request Body wird zu BsonDocument geparst
var requestBody = await GetRequestBodyAsync();

// 2. Priorisierte Extraktion von userPrompt:
//    - userPrompt (höchste Priorität)
//    - message → userPrompt
//    - query → userPrompt
//    - text → userPrompt
//    - input → userPrompt
//    - Erster String-Wert aus Body
//    - Fallback: ""

// 3. _metadata wird hinzugefügt (timestamp, source, method, headers, query)

// 4. Input wird als "input" Variable im ExecutionContext gespeichert
context.Variables["input"] = input;
```

---

## 📤 **OUTPUT: Was gibt der StartNode weiter?**

### C# Implementation (StartNodeProcessor.cs)

Der StartNode gibt ein **BsonDocument** zurück:

```json
{
  "nodeId": "string",               // ID des StartNodes
  "nodeType": "start",              // Immer "start"
  "entryType": "webhook",           // "webhook" | "schedule" | "manual"
  "method": "POST",                 // HTTP Method (bei webhook)
  "input": {                        // Der komplette rohe Input
    "userPrompt": "...",
    "message": "...",
    "_metadata": { ... }
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "message": "Workflow started via webhook",
  
  // Optional (falls im Node konfiguriert):
  "label": "string",
  "description": "string",
  "endpoint": "string"
}
```

### TypeScript Implementation (registerBuiltIns.ts)

**WICHTIG:** Der TypeScript StartNode gibt den Input **direkt durch** (passthrough):

```typescript
process: async (node, input) => {
    // Start node just passes through the input
    return input;
}
```

**Unterschied:**
- **C#**: Fügt Metadaten hinzu (nodeId, nodeType, entryType, etc.)
- **TypeScript**: Gibt Input unverändert weiter

---

## 🔄 **Datenfluss zu nächsten Nodes**

### C# WorkflowExecutionEngine

```csharp
// 1. StartNode wird verarbeitet
var result = await processor.ProcessAsync(node, context);

// 2. Output wird in Context gespeichert
context.Variables[$"node_{node.Id}_output"] = result;

// 3. Nächste Nodes finden (via Edges)
var nextNodes = GetNextNodes(context.Workflow, node);

// 4. Nächste Node erhält Output als Input
foreach (var nextNode in nextNodes)
{
    // Der Output des StartNodes wird als Input an die nächste Node übergeben
    await ProcessNodeAsync(context, nextNode);
}
```

### TypeScript ExecutionService

```typescript
// 1. StartNode finden
const startNode = workflow.nodes.find(n => n.type === 'start');

// 2. StartNode verarbeiten
let currentInput = input;  // Original Input
let currentNode = startNode;

// 3. StartNode gibt Input durch (passthrough)
nodeOutput = await this.processNode(currentNode, currentInput, workflow, execution);
// nodeOutput === input (unverändert)

// 4. Nächste Node finden (via Edges)
const nextEdge = workflow.edges.find(e => e.source === currentNode.id);
const nextNode = workflow.nodes.find(n => n.id === nextEdge.target);

// 5. Output wird als Input für nächste Node verwendet
currentNode = nextNode;
currentInput = nodeOutput;  // StartNode Output → nächste Node Input
```

---

## 📋 **Schema-Definition**

### Input Schema (was der StartNode empfängt)

```typescript
interface StartNodeInput {
  // User Input (priorisiert)
  userPrompt?: string;        // Hauptfeld für Agent-Nodes
  
  // Alternative Input-Felder
  message?: string;
  query?: string;
  text?: string;
  input?: string;
  
  // Beliebige weitere Felder
  [key: string]: any;
  
  // Metadaten (wird automatisch hinzugefügt)
  _metadata?: {
    timestamp: string;
    source: "webhook" | "schedule" | "manual";
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
    query?: Record<string, string>;
  };
}
```

### Output Schema (was der StartNode weitergibt)

#### C# Output Schema

```typescript
interface StartNodeOutput_CSharp {
  nodeId: string;
  nodeType: "start";
  entryType: "webhook" | "schedule" | "manual";
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  input: StartNodeInput;              // Kompletter roher Input
  timestamp: string;
  message: string;
  
  // Optional
  label?: string;
  description?: string;
  endpoint?: string;
}
```

#### TypeScript Output Schema

```typescript
interface StartNodeOutput_TypeScript {
  // Gibt Input unverändert zurück (passthrough)
  // Identisch mit StartNodeInput
}
```

---

## 🔍 **Beispiele**

### Beispiel 1: Webhook mit userPrompt

**Request:**
```json
POST /api/webhook/{workflowId}
{
  "userPrompt": "Was ist das Wetter heute?"
}
```

**StartNode Input:**
```json
{
  "userPrompt": "Was ist das Wetter heute?",
  "_metadata": {
    "timestamp": "2024-01-01T12:00:00Z",
    "source": "webhook",
    "method": "POST",
    "headers": { ... },
    "query": { ... }
  }
}
```

**StartNode Output (C#):**
```json
{
  "nodeId": "start-1",
  "nodeType": "start",
  "entryType": "webhook",
  "method": "POST",
  "input": {
    "userPrompt": "Was ist das Wetter heute?",
    "_metadata": { ... }
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "message": "Workflow started via webhook"
}
```

**StartNode Output (TypeScript):**
```json
{
  "userPrompt": "Was ist das Wetter heute?",
  "_metadata": { ... }
}
```

### Beispiel 2: Webhook mit message-Feld

**Request:**
```json
POST /api/webhook/{workflowId}
{
  "message": "Hallo Welt",
  "userId": "123"
}
```

**StartNode Input:**
```json
{
  "userPrompt": "Hallo Welt",        // Aus "message" extrahiert
  "message": "Hallo Welt",            // Original beibehalten
  "userId": "123",
  "_metadata": { ... }
}
```

### Beispiel 3: Komplexer Input

**Request:**
```json
POST /api/webhook/{workflowId}
{
  "data": {
    "name": "John",
    "age": 30
  },
  "options": {
    "format": "json"
  }
}
```

**StartNode Input:**
```json
{
  "data": {
    "name": "John",
    "age": 30
  },
  "options": {
    "format": "json"
  },
  "userPrompt": "",                  // Fallback: leerer String
  "_metadata": { ... }
}
```

---

## ⚠️ **Wichtige Unterschiede**

### C# vs TypeScript

| Aspekt | C# (StartNodeProcessor) | TypeScript (registerBuiltIns) |
|--------|------------------------|-------------------------------|
| **Output** | Fügt Metadaten hinzu | Passthrough (unverändert) |
| **Struktur** | Wrapper mit nodeId, nodeType, etc. | Direkter Input |
| **Verwendung** | WorkflowExecutionEngine | executionService |

### Warum unterschiedlich?

- **C#**: Orchestriert komplexe Workflows, braucht Metadaten für Tracking
- **TypeScript**: Fokussiert auf Agent-Execution, Input wird direkt an Agent weitergegeben

---

## 🎯 **Zusammenfassung**

1. **Input**: StartNode empfängt strukturierte Daten (userPrompt, message, etc.) + Metadaten
2. **Verarbeitung**: 
   - C#: Fügt Metadaten hinzu (nodeId, nodeType, entryType, etc.)
   - TypeScript: Passthrough (unverändert)
3. **Output**: Wird als `currentInput` an nächste Node übergeben
4. **Schema**: Flexibel (kein striktes Schema), aber konsistente Struktur

---

## 📝 **Empfehlungen**

1. **Für Agent-Nodes**: Verwende `userPrompt` Feld für bessere Kompatibilität
2. **Für andere Nodes**: Nutze die Felder, die dein Node erwartet
3. **Metadaten**: `_metadata` Feld enthält nützliche Request-Informationen
4. **TypeScript**: Input wird direkt durchgereicht → keine Metadaten-Wrapper

