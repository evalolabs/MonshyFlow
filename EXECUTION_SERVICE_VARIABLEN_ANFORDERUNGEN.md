# Execution-Service: Anforderungen für Variablen-Auflösung {{...}}

## Übersicht

Der execution-service benötigt spezifische Datenstrukturen, um Variablen wie `{{input.json.field}}`, `{{steps.nodeId.json.field}}` und `{{secrets.name}}` korrekt aufzulösen.

## 1. ExpressionContext Interface

Der execution-service erwartet einen `ExpressionContext` mit folgender Struktur:

```typescript
interface ExpressionContext {
    /**
     * Steps from previous nodes: key = nodeId, value = NodeData or object
     */
    steps: Record<string, any>;

    /**
     * Input data (from start node): NodeData or object
     */
    input?: any;

    /**
     * Secrets: key = secret name, value = secret value
     */
    secrets: Record<string, string>;
}
```

## 2. Normalisierung zu NodeData-Format

Der execution-service normalisiert automatisch alle Daten zu NodeData-Format:

### 2.1 NodeData-Struktur

```typescript
interface NodeData {
    /**
     * Main data payload (json is the primary field)
     */
    json?: any;

    /**
     * Metadata about this data (always present)
     */
    metadata: {
        nodeId: string;
        nodeType: string;
        timestamp: string;
        source: string;
        previousNodeId?: string;
    };

    /**
     * Optional error information
     */
    error?: {
        message: string;
        code?: string;
        details?: any;
    };
}
```

### 2.2 Normalisierungs-Logik

Der execution-service prüft, ob Daten bereits NodeData-Format haben:

```typescript
isNodeData(value): boolean {
    return (
        value !== null &&
        typeof value === 'object' &&
        'metadata' in value &&
        typeof value.metadata === 'object' &&
        'nodeId' in value.metadata &&
        ('json' in value || 'data' in value)  // Unterstützt sowohl json als auch data (backward compatibility)
    );
}
```

**Normalisierungs-Regeln:**
1. Wenn `value` bereits NodeData ist → wird unverändert zurückgegeben
2. Wenn `value` ein Objekt mit `data` und `metadata` hat → wird als NodeData behandelt
3. Sonst → wird `createNodeData(value, nodeId, nodeType)` aufgerufen, um es zu wrappen

## 3. Anforderungen für `execution.input`

### 3.1 Struktur

`execution.input` wird direkt verwendet (Zeile 1307 in executionService.ts):

```typescript
input: execution.input
```

**Anforderungen:**
- Kann ein beliebiges Objekt sein (wird automatisch normalisiert)
- Wird zu NodeData normalisiert mit `normalizeToNodeData(context.input, 'input', 'input')`
- Nach Normalisierung sollte es NodeData-Format haben: `{json: {...}, metadata: {...}}`

### 3.2 Beispiel

**Vor Normalisierung:**
```javascript
execution.input = { userPrompt: "Was ist ein Gin" }
```

**Nach Normalisierung (intern):**
```javascript
normalizedInput = {
    json: { userPrompt: "Was ist ein Gin" },
    metadata: {
        nodeId: 'input',
        nodeType: 'input',
        timestamp: '2025-12-10T15:42:14.939Z',
        source: 'node'
    }
}
```

**Verwendung in Expressions:**
- `{{input.json.userPrompt}}` → `"Was ist ein Gin"`
- `{{input.json}}` → `{"userPrompt": "Was ist ein Gin"}`

## 4. Anforderungen für `execution.trace`

### 4.1 Struktur

`execution.trace` wird verwendet, um `steps` zu bauen (Zeile 1301-1306 in executionService.ts):

```typescript
steps: execution.trace.reduce((acc: any, step: any) => {
    if (step.nodeId && step.nodeId !== node.id) {
        acc[step.nodeId] = step.output || step;
    }
    return acc;
}, {})
```

**Anforderungen für `traceEntry`:**
- `traceEntry.nodeId`: string (erforderlich)
- `traceEntry.output`: NodeData oder object (wird automatisch normalisiert)
- `traceEntry.input`: optional
- `traceEntry.type`: optional
- `traceEntry.timestamp`: optional
- `traceEntry.duration`: optional

### 4.2 Beispiel

**Trace-Eintrag:**
```javascript
execution.trace = [
    {
        nodeId: 'start-1765374356726',
        type: 'start',
        input: { userPrompt: "Was ist ein Gin" },
        output: {
            json: { userPrompt: "Was ist ein Gin" },
            metadata: {
                nodeId: 'start-1765374356726',
                nodeType: 'start',
                timestamp: '2025-12-10T15:42:14.939Z',
                source: 'node'
            }
        },
        timestamp: new Date(),
        duration: 10
    }
]
```

**Nach Normalisierung (intern):**
```javascript
steps = {
    'start-1765374356726': {
        json: { userPrompt: "Was ist ein Gin" },
        metadata: { ... }
    }
}
```

**Verwendung in Expressions:**
- `{{steps.start-1765374356726.json.userPrompt}}` → `"Was ist ein Gin"`
- `{{steps.start-1765374356726.json}}` → `{"userPrompt": "Was ist ein Gin"}`

## 5. Anforderungen für `secrets`

### 5.1 Struktur

```typescript
secrets: Record<string, string>
```

**Anforderungen:**
- Key = secret name (string)
- Value = secret value (string)
- Wird NICHT normalisiert (bleibt als Record<string, string>)

### 5.2 Beispiel

```javascript
secrets = {
    'PIPEDRIVE_API_KEY': 'abc123',
    'OPENAI_API_KEY': 'xyz789'
}
```

**Verwendung in Expressions:**
- `{{secret:PIPEDRIVE_API_KEY}}` → `"abc123"`
- `{{secrets.PIPEDRIVE_API_KEY}}` → `"abc123"`

## 6. Wichtige Erkenntnisse

### 6.1 Automatische Normalisierung

Der execution-service normalisiert automatisch:
- `input` → NodeData-Format
- `steps[nodeId]` → NodeData-Format

**ABER:** Die Normalisierung funktioniert nur, wenn:
- Daten bereits NodeData-Format haben (mit `metadata` und `json`/`data`)
- Oder Daten als plain objects übergeben werden (werden dann gewrappt)

### 6.2 Problem: `output.json` ist `null`

Wenn `traceEntry.output` die Struktur `{data: {...}, metadata: {...}}` hat (ohne `json` Feld), dann:
- `isNodeData()` erkennt es als NodeData (weil `data` und `metadata` vorhanden)
- Aber `normalizeToNodeData()` migriert `data` zu `json` nur wenn `metadata` vorhanden ist
- Wenn `metadata` fehlt, wird es nicht als NodeData erkannt und neu gewrappt

**Lösung:** `traceEntry.output` sollte IMMER NodeData-Format haben:
```javascript
{
    json: {...},  // ERFORDERLICH
    metadata: {   // ERFORDERLICH
        nodeId: string,
        nodeType: string,
        timestamp: string,
        source: string
    }
}
```

### 6.3 Start-Node Output

Der Start-Node sollte NodeData zurückgeben:
```javascript
{
    json: { userPrompt: "..." },  // Die eigentlichen Input-Daten
    metadata: {
        nodeId: 'start-1765374356726',
        nodeType: 'start',
        timestamp: '...',
        source: 'start'
    }
}
```

**Problem:** Wenn der Start-Node `{data: {...}}` zurückgibt (ohne `json` und `metadata`), dann:
- Wird es nicht als NodeData erkannt
- Wird zu `{json: {data: {...}}, metadata: {...}}` gewrappt
- `{{input.json.userPrompt}}` funktioniert nicht, weil die Daten in `json.data` sind

## 7. Zusammenfassung: Was der execution-service braucht

### 7.1 `execution.input`
- **Format:** Beliebiger Typ (wird normalisiert)
- **Nach Normalisierung:** NodeData mit `json` und `metadata`
- **Beispiel:** `{userPrompt: "..."}` → `{json: {userPrompt: "..."}, metadata: {...}}`

### 7.2 `execution.trace[].output`
- **Format:** NodeData mit `json` und `metadata` (ERFORDERLICH)
- **Struktur:**
  ```javascript
  {
      json: {...},  // ERFORDERLICH - die eigentlichen Daten
      metadata: {   // ERFORDERLICH
          nodeId: string,
          nodeType: string,
          timestamp: string,
          source: string
      }
  }
  ```
- **WICHTIG:** Sollte NICHT `{data: {...}}` sein (ohne `json` und `metadata`)

### 7.3 `secrets`
- **Format:** `Record<string, string>`
- **Beispiel:** `{PIPEDRIVE_API_KEY: "abc123"}`

## 8. Aktuelles Problem

**Problem:** `traceEntry.output` hat `{data: {...}}` statt `{json: {...}, metadata: {...}}`

**Ursache:** Der Start-Node gibt möglicherweise nicht NodeData zurück, oder die Datenstruktur geht beim Übergang verloren.

**Lösung:** Sicherstellen, dass:
1. `execution.input` korrekt gesetzt wird
2. `traceEntry.output` IMMER NodeData-Format hat (mit `json` und `metadata`)
3. Der Start-Node NodeData zurückgibt (nicht `{data: {...}}`)

