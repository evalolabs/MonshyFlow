# Nodes und Registry-System Dokumentation

## 📋 Übersicht

Das Registry-System ist die **zentrale Quelle der Wahrheit** für alle Nodes im Monshy-System. Es ermöglicht eine konsistente Konfiguration über Frontend, Backend (C#) und TypeScript Execution Service hinweg.

### Hauptkomponenten

1. **`shared/registry.json`** - Zentrale Konfigurationsdatei (Single Source of Truth)
   - Node-Definitionen (`nodes`)
   - Tool-Definitionen (`tools`)
   - **Hinweis:** API-Integrationen sind in separaten Dateien gespeichert (siehe unten)
2. **`shared/apiIntegrations/`** - Verzeichnis für API-Integrationen
   - Jede API hat eine eigene JSON-Datei (z.B. `pipedrive.json`, `salesforce.json`)
   - `index.json` - Metadaten-Index aller verfügbaren APIs
   - Pre-konfigurierte HTTP-Request Nodes für beliebte APIs
3. **`shared/scripts/generateRegistry.ts`** - Code-Generator für alle Systeme
4. **Frontend Metadaten** - Automatisch generiert in `generatedMetadata.ts`
5. **Expression Editor Integration** - Automatische Variable-Unterstützung
6. **API-Selection-Modal** - UI für Auswahl von API-Endpoints

---

## 🏗️ Architektur

```
shared/
    ├─── registry.json (Nodes + Tools)
    │       │
    │       └─── generateRegistry.ts (Generator)
    │                 │
    │                 ├─── Frontend: generatedMetadata.ts
    │                 ├─── C#: generatedNodeProcessorRegistration.cs
    │                 └─── TypeScript: generatedRegisterBuiltIns.ts
    │
    └─── apiIntegrations/ (API-Integrationen)
            │
            ├─── index.json (Metadaten-Index)
            ├─── pipedrive.json
            ├─── salesforce.json
            ├─── slack.json
            └─── ... (weitere APIs)

Frontend Integration
    ├─── apiIntegrations.ts (Lädt APIs aus apiIntegrations/)
    ├─── nodeFieldConfig.ts (Expression-Felder)
    ├─── AutoConfigForm.tsx (Automatische Formulare)
    └─── ExpressionEditor (Variable Popover)
```

---

## 📝 Node in registry.json hinzufügen

### Schnellstart: Delay-Node Beispiel

**3 einfache Schritte:**

1. **Node in `shared/registry.json` hinzufügen** (siehe Beispiel unten)
2. **Code generieren:** `cd shared && npm run generate:registry`
   - ✅ Frontend-Metadaten werden automatisch generiert
   - ✅ **Template-Code wird automatisch in `registerBuiltIns.ts` hinzugefügt** (in AUTO-GENERATED Sektion)
3. **Backend-Prozessor implementieren** in `execution-service/src/nodes/registerBuiltIns.ts`
   - Öffne die Datei und finde die AUTO-GENERATED Sektion
   - Ersetze den Template-Code mit deiner Implementierung
   - Verschiebe die Implementierung außerhalb der AUTO-GENERATED Sektion

**Das war's!** Der Node erscheint automatisch im Frontend (via Fallback-System) und ist im Backend registriert.

### Grundstruktur

```json
{
  "type": "my-node",
  "name": "My Node",
  "icon": "🎯",
  "description": "Beschreibung des Nodes",
  "category": "integration",
  "animationSpeed": "slow",
  "csharpProcessor": "MyNodeProcessor",
  "typescriptProcessor": "./nodes/registerBuiltIns#my-node",
  "inputSchema": {
    "type": "object",
    "description": "Input Schema für Validierung",
    "additionalProperties": true
  },
  "outputSchema": {
    "type": "object",
    "description": "Output Schema für Type Hints",
    "additionalProperties": true
  },
  "frontend": {
    "hasConfigForm": true,
    "useAutoConfigForm": true,
    "fields": {
      "label": {
        "type": "text",
        "placeholder": "Node Name"
      },
      "url": {
        "type": "expression",
        "placeholder": "URL oder {{steps.nodeId.json}}"
      }
    }
  }
}
```

### Frontend-Konfiguration

#### `hasConfigForm`
- **`true`**: Node hat ein Konfigurationsformular
- **`false`**: Node hat kein Konfigurationsformular (z.B. End-Node)

#### `useAutoConfigForm`
- **`true`**: Automatische Formular-Generierung aus `fields`
- **`false`**: Benutzerdefiniertes Formular (z.B. Agent-Node mit spezieller UI)

#### `animationSpeed`
- **`"fast"`**: Fixed-duration Animation (z. B. Start/End/Transform)
- **`"slow"`**: Animiert live anhand `node.start`/`node.end` SSE Events (z. B. Agent, HTTP Request)
- Wird vom Hook `useSequentialNodeAnimation` automatisch aus der Registry gelesen – keine Hardcodierung mehr nötig.

#### `fields` - Feldkonfiguration

Die `fields`-Konfiguration definiert, welche Felder im Konfigurationsformular angezeigt werden und wie sie gerendert werden.

**Feldtypen:**

1. **`text`** - Einzeiliges Textfeld
   ```json
   {
     "type": "text",
     "placeholder": "Enter text"
   }
   ```

2. **`expression`** - Expression-Feld mit Variable Popover ⭐
   ```json
   {
     "type": "expression",
     "multiline": true,
     "rows": 4,
     "placeholder": "Use {{variables}} for dynamic content"
   }
   ```

3. **`number`** - Zahlenfeld
   ```json
   {
     "type": "number",
     "min": 0,
     "max": 100,
     "step": 1
   }
   ```

4. **`select`** - Dropdown-Auswahl
   ```json
   {
     "type": "select",
     "options": [
       { "value": "option1", "label": "Option 1" },
       { "value": "option2", "label": "Option 2" }
     ]
   }
   ```

5. **`textarea`** - Mehrzeiliges Textfeld (ohne Expression-Unterstützung)
   ```json
   {
     "type": "textarea",
     "rows": 6
   }
   ```

6. **`secret`** - Secret-Selektor
   ```json
   {
     "type": "secret",
     "secretType": "ApiKey",
     "placeholder": "Select a secret"
   }
   ```

7. **`smtpProfile`** - SMTP-Profil-Selektor
   ```json
   {
     "type": "smtpProfile",
     "placeholder": "Select or create an SMTP profile"
   }
   ```

**Erweiterte Optionen:**

- **`multiline`**: Für Expression-Felder - mehrzeiliges Eingabefeld
- **`rows`**: Anzahl der Zeilen (für multiline Felder)
- **`placeholder`**: Platzhaltertext
- **`required`**: Ob das Feld erforderlich ist
- **`default`**: Standardwert
- **`label`**: Überschreibt den automatisch generierten Label
- **`displayCondition`**: Bedingte Anzeige
  ```json
  {
    "displayCondition": {
      "field": "emailFormat",
      "operator": "in",
      "value": ["html", "both"]
    }
  }
  ```

---

## 🗑️ Node löschen

### 3 einfache Schritte:

1. **Node aus `shared/registry.json` entfernen** (Eintrag aus `nodes`-Array löschen)
2. **Code neu generieren:** `cd shared && npm run generate:registry`
   - Frontend-Metadaten werden automatisch aktualisiert
   - Template-Code wird automatisch aus AUTO-GENERATED Sektion entfernt
3. **Backend-Prozessor entfernen** aus `execution-service/src/nodes/registerBuiltIns.ts`
   - Falls der Node bereits implementiert wurde (außerhalb AUTO-GENERATED), entferne die Implementierung manuell

**Das war's!** Der Node ist vollständig entfernt.

**⚠️ Wichtig:** Prüfe vor dem Löschen, ob der Node noch in bestehenden Workflows verwendet wird.

---

## 🔄 Automatisches Fallback-System

### Übersicht

Das Registry-System verfügt über ein **robustes Fallback-System**, das sicherstellt, dass alle Nodes korrekt gerendert werden, auch wenn keine explizite React-Komponente vorhanden ist.

### Funktionsweise

1. **Priorität 1: Explizite Komponente**
   - Nodes mit manuell registrierten Komponenten (z.B. `StartNode`, `AgentNode`) werden direkt verwendet
   - Registriert in `NODE_COMPONENTS` in `nodeRegistry.ts`

2. **Priorität 2: Automatisches BaseNode-Fallback**
   - Nodes aus `generatedMetadata.ts` (aus `registry.json` generiert) werden automatisch mit `BaseNode` gerendert
   - Verwendet Metadaten (Icon, Name, Kategorie) aus der Registry
   - Unterstützt vollständige Funktionalität: Animation, Comments, Validation

3. **Priorität 3: Dynamisches Fallback**
   - Nodes, die zur Laufzeit hinzugefügt werden (z.B. vom Backend), werden automatisch erkannt
   - Verwendet `default` Node-Type für React Flow
   - Fallback auf Basis-Node, wenn keine Metadaten verfügbar sind

### Vorteile

- ✅ **Keine manuelle Komponente nötig**: Nodes aus `registry.json` funktionieren automatisch
- ✅ **Konsistente Darstellung**: Alle Nodes verwenden `BaseNode` als Basis
- ✅ **Performance-Optimiert**: Komponenten werden gecacht, um Re-Renders zu vermeiden
- ✅ **Robust**: Unbekannte Node-Types werden nicht zu Fehlern führen

### Beispiel: Delay-Node

Der Delay-Node wurde in `registry.json` definiert:

```json
{
  "type": "delay",
  "name": "Delay",
  "icon": "⏱️",
  "category": "utility",
  "frontend": {
    "hasConfigForm": true,
    "useAutoConfigForm": true,
    "fields": {
      "delaySeconds": {
        "type": "number",
        "placeholder": "Delay in seconds"
      }
    }
  }
}
```

**Ergebnis:**
- ✅ Node wird automatisch mit `BaseNode` gerendert
- ✅ Verwendet Icon ⏱️ und Name "Delay"
- ✅ Unterstützt Animation, Comments, Validation
- ✅ Keine manuelle `DelayNode.tsx` Komponente nötig

### Performance-Optimierungen

- **Component Caching**: Default-Komponenten werden gecacht, um Re-Erstellung zu vermeiden
- **Memoization**: `createNodeTypesMap` wird nur bei Änderungen neu berechnet
- **Lazy Loading**: Komponenten werden nur bei Bedarf geladen

### Technische Details

**Zentrale Funktionen:**
- `getNodeComponent(nodeType)`: Gibt Komponente mit automatischem Fallback zurück
- `createDefaultNodeComponent(nodeType)`: Erstellt BaseNode-Komponente aus Metadaten
- `hasNodeComponent(nodeType)`: Prüft, ob Node eine Komponente hat (inkl. Fallback)

**Cache-Mechanismus:**
```typescript
const defaultComponentCache = new Map<string, ComponentType<any>>();
```

Komponenten werden einmal erstellt und dann gecacht, um Performance zu optimieren.

---

## 🎨 Expression-Felder und Variable-Unterstützung

### Was sind Expression-Felder?

Expression-Felder ermöglichen es Benutzern, **dynamische Werte** aus vorherigen Nodes zu verwenden. Sie erhalten automatisch:

- ✅ **ExpressionEditor** Komponente
- ✅ **"Available Variables" Popover** mit Variable-Baum
- ✅ **Live Preview** der aufgelösten Werte
- ✅ **Syntax-Highlighting** für `{{...}}` Ausdrücke

### Expression-Feld definieren

```json
{
  "frontend": {
    "fields": {
      "prompt": {
        "type": "expression",
        "multiline": true,
        "rows": 6,
        "placeholder": "Enter prompt... Use {{steps.nodeId.json.field}} for dynamic content"
      }
    }
  }
}
```

### Unterstützte Expression-Syntax

1. **Workflow-Input:**
   - `{{input.field}}` - Direkter Zugriff auf Input-Felder
   - `{{input.json.field}}` - Expliziter Zugriff auf JSON-Daten
   - `{{input.data.field}}` - Legacy-Syntax (wird zu json umgeleitet)

2. **Vorherige Nodes:**
   - `{{steps.nodeId.json.field}}` - Zugriff auf Node-Output
   - `{{steps.nodeId.data.field}}` - Legacy-Syntax (wird zu json umgeleitet)
   - `{{steps.nodeId.metadata.field}}` - Zugriff auf Metadaten

3. **Workflow-Style (neu):**
   - `{{$json.field}}` - Aktueller Node-Daten
   - `{{$node["NodeName"].json.field}}` - Anderer Node-Daten
   - `{{$input.first().json.field}}` - Input-Daten

4. **Secrets:**
   - `{{secret:secretName}}` - Secret-Wert
   - `{{secrets.secretName}}` - Alternative Syntax (für Kompatibilität)

5. **Array-Zugriff (neu):**
   - `{{steps.nodeId.json.data.field}}` - Automatischer Zugriff auf erstes Array-Element
     - Wenn `data` ein Array ist, wird automatisch `data[0].field` aufgelöst
     - Beispiel: `{{steps.http-request-1.json.data.user_id}}` → greift auf `data[0].user_id` zu
   - `{{steps.nodeId.json.data[0].field}}` - Expliziter Array-Index
   - `{{steps.nodeId.json.data.0.field}}` - Alternative Index-Syntax
   - `{{steps.nodeId.json.data.length}}` - Array-Länge
   - `{{steps.nodeId.json.data[0].items[1].name}}` - Verschachtelte Arrays

### Praktisches Beispiel: Pipedrive API mit Array-Zugriff

**Szenario:** Pipedrive API gibt eine Liste von Activities zurück:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 24655120,
      "subject": "Meeting",
      "person_name": "John Doe"
    },
    {
      "id": 2,
      "user_id": 24655121,
      "subject": "Call",
      "person_name": "Jane Smith"
    }
  ]
}
```

**Verwendung in Email Node:**
- `{{steps.pipedrive-request.json.data.user_id}}` → `24655120` (automatisch erstes Element)
- `{{steps.pipedrive-request.json.data[0].subject}}` → `"Meeting"` (expliziter Index)
- `{{steps.pipedrive-request.json.data.length}}` → `2` (Array-Länge)
- `{{steps.pipedrive-request.json.data[1].person_name}}` → `"Jane Smith"` (zweites Element)

**Hinweis:** Die automatische Array-Auflösung macht die Expression-Syntax benutzerfreundlicher, da `data.field` auch funktioniert, wenn `data` ein Array ist.

### Beispiel: Agent-Node

```json
{
  "type": "agent",
  "frontend": {
    "fields": {
      "systemPrompt": {
        "type": "expression",
        "multiline": true,
        "rows": 4,
        "placeholder": "Enter system prompt. Use {{variables}} for dynamic content"
      },
      "userPrompt": {
        "type": "expression",
        "multiline": true,
        "rows": 3,
        "placeholder": "Use {{input.userPrompt}} or {{steps.nodeId.json}}"
      }
    }
  }
}
```

---

## 🔄 Workflow: Node hinzufügen

### Schritt 1: Node in registry.json definieren

```json
{
  "type": "my-new-node",
  "name": "My New Node",
  "icon": "🎯",
  "description": "Does something cool",
  "category": "utility",
  "csharpProcessor": "MyNewNodeProcessor",
  "typescriptProcessor": "./nodes/registerBuiltIns#my-new-node",
  "inputSchema": {
    "type": "object",
    "additionalProperties": true
  },
  "outputSchema": {
    "type": "object",
    "additionalProperties": true
  },
  "frontend": {
    "hasConfigForm": true,
    "useAutoConfigForm": true,
    "fields": {
      "label": {
        "type": "text",
        "placeholder": "Node Name"
      },
      "message": {
        "type": "expression",
        "multiline": true,
        "rows": 4,
        "placeholder": "Message or {{steps.nodeId.json}}"
      }
    }
  }
}
```

### Schritt 2: Metadaten generieren ⚠️ ERFORDERLICH

```bash
cd shared
npm run generate:registry
```

**Wichtig:** Dieser Schritt ist **erforderlich** für Nodes! Er generiert die Frontend-Metadaten aus `registry.json` und fügt automatisch Template-Code für neue Nodes hinzu.

Dies generiert:
- ✅ `frontend/src/components/WorkflowBuilder/nodeRegistry/generatedMetadata.ts` - Frontend-Metadaten
- ✅ `AgentBuilder.AgentService/Processors/generatedNodeProcessorRegistration.cs` - C# Registrierung (deprecated)
- ✅ `execution-service/src/nodes/generatedRegisterBuiltIns.ts` - TypeScript Dokumentation
- ✅ **Automatisch:** Template-Code in `execution-service/src/nodes/registerBuiltIns.ts` (AUTO-GENERATED Sektion)

**Generator-Ausgabe:**
- Zeigt, welche neuen Templates hinzugefügt wurden
- Zeigt, welche Nodes bereits implementiert sind
- Warnt nur für Templates, die auf Implementierung warten (nicht für alle Nodes)

### Schritt 3: Backend-Implementierung

Der Generator hat automatisch einen **Template-Code** in der AUTO-GENERATED Sektion von `registerBuiltIns.ts` hinzugefügt. Jetzt musst du:

1. **Datei öffnen:** `execution-service/src/nodes/registerBuiltIns.ts`
2. **AUTO-GENERATED Sektion finden:** Suche nach `// AUTO-GENERATED REGISTRATIONS - DO NOT EDIT`
3. **Template ersetzen:** Ersetze den Template-Code mit deiner tatsächlichen Implementierung
4. **Außerhalb verschieben:** Verschiebe die Implementierung außerhalb der AUTO-GENERATED Sektion

**TypeScript Processor Template (automatisch generiert):**
```typescript
// In AUTO-GENERATED Sektion (Template - muss ersetzt werden)
registerNodeProcessor({
    type: 'my-new-node',
    name: 'My New Node',
    description: 'Does something cool',
    processNodeData: async (node, input, context) => {
        // TODO: Implement My New Node processor logic
        // Template: For now, just pass through the input
        if (input) {
            return input;
        }
        return createNodeData(
            context.input || {},
            node.id,
            node.type || 'my-new-node',
            undefined
        );
    },
});
```

**TypeScript Processor Implementierung (deine Version):**
```typescript
// Außerhalb AUTO-GENERATED Sektion (deine Implementierung)
registerNodeProcessor({
    type: 'my-new-node',
    name: 'My New Node',
    description: 'Does something cool',
    processNodeData: async (node, input, context) => {
        // Deine tatsächliche Implementierung
        const nodeData = node.data || {};
        const configValue = nodeData.someField || 'default';
        
        // Deine Logik hier
        const result = await yourLogic(configValue);
        
        return createNodeData(
            result,
            node.id,
            node.type || 'my-new-node',
            undefined
        );
    },
});
```

**C# Processor** (falls benötigt, optional):
```csharp
public class MyNewNodeProcessor : INodeProcessor
{
    public async Task<object> ProcessAsync(Node node, object input, WorkflowContext context)
    {
        // Node-Logik implementieren
    }
}
```

### Schritt 4: Frontend-Komponente (optional)

Falls `useAutoConfigForm: false`, erstelle ein benutzerdefiniertes Formular:

```tsx
// NodeConfigForms/MyNewNodeConfigForm.tsx
export function MyNewNodeConfigForm({ config, onConfigChange, ... }) {
  return (
    <div>
      {/* Custom form UI */}
    </div>
  );
}
```

---

## 🎯 Best Practices

### 1. Expression-Felder verwenden

**✅ RICHTIG:**
```json
{
  "url": {
    "type": "expression",
    "placeholder": "URL or {{steps.nodeId.json.url}}"
  }
}
```

**❌ FALSCH:**
```json
{
  "url": {
    "type": "text",
    "placeholder": "URL"
  }
}
```

### 2. Sinnvolle Placeholder

Placeholder sollten zeigen, wie Expressions verwendet werden können:

```json
{
  "placeholder": "Enter value or use {{steps.nodeId.json.field}} for dynamic content"
}
```

### 3. Multiline für längere Inhalte

Für längere Texte (Prompts, Bodies, etc.):

```json
{
  "prompt": {
    "type": "expression",
    "multiline": true,
    "rows": 6
  }
}
```

### 4. Kategorien konsistent verwenden

Verfügbare Kategorien:
- `core` - Kern-Nodes (Start, End, Transform)
- `ai` - AI-Nodes (Agent, LLM)
- `logic` - Logik-Nodes (Condition, Switch)
- `data` - Daten-Nodes (Database, API)
- `integration` - Integration-Nodes (Email, HTTP)
- `utility` - Utility-Nodes
- `tools` - Tool-Nodes

### 5. Schemas definieren

Definiere immer `inputSchema` und `outputSchema` für:
- ✅ Type Hints im Frontend
- ✅ Validierung im Backend
- ✅ Dokumentation

---

## 🔍 System-Integration

### Frontend

1. **Metadaten-Loading:**
   ```typescript
   import { getNodeMetadata } from './nodeRegistry/nodeMetadata';
   
   const metadata = getNodeMetadata('my-node');
   // Priorität: Manual > Generated > Auto-discovered
   ```

2. **Field-Config:**
   ```typescript
   import { getFieldConfig } from './nodeFieldConfig';
   
   const fieldConfig = getFieldConfig('my-node', 'url');
   // Automatisch aus registry.json generiert
   ```

3. **Auto-Config-Form:**
   ```tsx
   <AutoConfigForm
     nodeType="my-node"
     nodeMetadata={metadata}
     config={config}
     onConfigChange={setConfig}
     nodes={nodes}
     edges={edges}
     currentNodeId={nodeId}
   />
   ```

### Backend (C#)

Die generierte Registrierung wird automatisch verwendet:

```csharp
// In Program.cs oder Startup
NodeProcessorRegistration.RegisterFromRegistry(serviceProvider, registry);
```

### TypeScript Execution Service

Die Prozessoren werden in `registerBuiltIns.ts` registriert (manuell oder automatisch).

---

## 🤖 Automatische Template-Generierung

### Übersicht

Der Generator (`npm run generate:registry`) erkennt automatisch neue Nodes und fügt Template-Code in `registerBuiltIns.ts` hinzu. Dies macht das Hinzufügen neuer Nodes viel einfacher!

### Funktionsweise

1. **Automatische Erkennung:** Der Generator prüft, welche Nodes bereits implementiert sind (außerhalb AUTO-GENERATED Sektion)
2. **Template-Generierung:** Neue Nodes erhalten automatisch einen Template-Code in der AUTO-GENERATED Sektion
3. **Hilfreiche Kommentare:** Jeder Template enthält:
   - TODO-Hinweise
   - Verfügbare Context-Variablen (`context.input`, `context.secrets`, etc.)
   - Verfügbare Helper-Funktionen (`createNodeData`, `extractData`, etc.)
   - Schritt-für-Schritt-Beispiele
   - Code-Templates

### Generator-Ausgabe

Nach `npm run generate:registry` siehst du:

**Wenn neue Templates hinzugefügt wurden:**
```
📝 Updating registerBuiltIns.ts with new node registrations...
   ✅ Added 1 new node registration template(s):
      ✨ delay (Delay)
   📝 Templates added to AUTO-GENERATED section in:
      .../registerBuiltIns.ts
   ⚠️  Next steps:
      1. Open the file and find the AUTO-GENERATED section
      2. Replace the template with your actual implementation
      3. Move it outside the AUTO-GENERATED section when done
```

**Wenn alle Nodes implementiert sind:**
```
📝 Updating registerBuiltIns.ts with new node registrations...
   ✅ All nodes already registered (no new templates needed)
   ℹ️  Already implemented (8): start, end, transform, agent, llm, email, http-request, delay
✅ All node processors are fully implemented (no templates waiting)
```

**Wenn Templates auf Implementierung warten:**
```
⚠️  TEMPLATES WAITING FOR IMPLEMENTATION:
   The following 1 node(s) have template code that needs to be implemented:
   
   📁 File: execution-service/src/nodes/registerBuiltIns
      ⏳ delay (Delay) - Template code waiting for implementation
   
   📝 Next steps:
      1. Open execution-service/src/nodes/registerBuiltIns.ts
      2. Find the AUTO-GENERATED section
      3. Replace the template code with your actual implementation
      4. Move the implementation outside the AUTO-GENERATED section
```

### Sicherheit

- ✅ **Bestehende Implementierungen werden NICHT überschrieben**
- ✅ **Nur neue Nodes erhalten Templates**
- ✅ **Templates werden in separater AUTO-GENERATED Sektion gespeichert**
- ✅ **Implementierte Nodes werden automatisch erkannt und übersprungen**

### Template-Struktur

Jeder generierte Template enthält:

```typescript
// Node Name Node Processor
// Description
// 
// ⚠️  TODO: Implement the processor logic below
// This is a template generated by npm run generate:registry
// Replace this template with your actual implementation
//
// Available in context:
//   - context.input: The workflow input data
//   - context.secrets: Object with resolved secrets
//   - context.execution: Execution context with trace, workflow, etc.
//   - context.workflow: Workflow configuration
//
// Available helpers:
//   - createNodeData(data, nodeId, nodeType, previousNodeId)
//   - extractData(nodeData)
//   - expressionResolutionService.resolveExpressions(...)
//
// Example: Access node configuration
//   const configValue = node.data?.fieldName || defaultValue;
//
registerNodeProcessor({
    type: 'node-type',
    name: 'Node Name',
    description: 'Description',
    processNodeData: async (node, input, context) => {
        // TODO: Implement processor logic
        // Template: For now, just pass through the input
        if (input) {
            return input;
        }
        return createNodeData(
            context.input || {},
            node.id,
            node.type || 'node-type',
            undefined  // previousNodeId: optional
        );
    },
});
```

---

## 🐛 Troubleshooting

### Problem: Expression-Felder zeigen kein Variable Popover

**Lösung:**
1. Prüfe, ob `type: 'expression'` in `registry.json` gesetzt ist
2. Führe `npm run generate:registry` aus
3. Prüfe `generatedMetadata.ts` - sollten `fields` enthalten sein
4. Prüfe `nodeFieldConfig.ts` - sollte automatisch generiert sein

### Problem: Node erscheint nicht im Frontend

**Lösung:**
1. Prüfe, ob Node in `registry.json` definiert ist
2. Führe `npm run generate:registry` aus
3. Prüfe `generatedMetadata.ts` - sollte Node enthalten sein
4. Prüfe Browser-Konsole auf Fehler

### Problem: Formular wird nicht angezeigt

**Lösung:**
1. Prüfe `hasConfigForm: true` in `registry.json`
2. Falls `useAutoConfigForm: true`, prüfe ob `fields` definiert sind
3. Falls `useAutoConfigForm: false`, prüfe ob Custom-Form existiert

### Problem: Template-Code wird nicht generiert

**Lösung:**
1. Prüfe, ob `typescriptProcessor` in `registry.json` definiert ist
2. Prüfe, ob der Pfad korrekt ist: `"./nodes/registerBuiltIns#node-type"`
3. Führe `npm run generate:registry` erneut aus
4. Prüfe die Ausgabe auf Fehler oder Warnungen

### Problem: Bestehende Implementierung wurde überschrieben

**Lösung:**
1. Stelle die Datei aus Git wieder her: `git checkout execution-service/src/nodes/registerBuiltIns.ts`
2. Der Generator sollte nur Templates für neue Nodes hinzufügen
3. Falls das Problem weiterhin besteht, prüfe ob der Node außerhalb der AUTO-GENERATED Sektion ist

---

## 📚 Weitere Ressourcen

- **Node Registry Guide:** `frontend/src/components/WorkflowBuilder/nodeRegistry/NODE_REGISTRY_GUIDE.md`
- **Expression Editor:** `frontend/src/components/WorkflowBuilder/ExpressionEditor.tsx`
- **Auto Config Form:** `frontend/src/components/WorkflowBuilder/NodeConfigForms/AutoConfigForm.tsx`
- **Registry Generator:** `shared/scripts/generateRegistry.ts`

---

## 🔌 API-Integrationen (Pre-konfigurierte HTTP-Request Nodes)

### Übersicht

Das System unterstützt **pre-konfigurierte HTTP-Request Nodes** für beliebte APIs. Benutzer können aus einer Liste von APIs (z.B. Pipedrive, Salesforce, Slack) wählen und dann einen spezifischen Endpoint auswählen. Das System erstellt automatisch einen vorkonfigurierten HTTP-Request-Node mit korrekter URL, Method, Headers und Body-Schema.

### Struktur

API-Integrationen werden in **separaten JSON-Dateien** im Verzeichnis `shared/apiIntegrations/` gespeichert. Jede API hat eine eigene Datei, um die Wartbarkeit und Skalierbarkeit zu verbessern:

```
shared/apiIntegrations/
    ├─── index.json          # Metadaten-Index aller APIs
    ├─── pipedrive.json      # Pipedrive API-Integration
    ├─── salesforce.json     # Salesforce API-Integration
    ├─── slack.json          # Slack API-Integration
    └─── ...                 # Weitere APIs
```

### API-Integration in separater Datei definieren

Jede API-Integration wird in einer eigenen JSON-Datei gespeichert (z.B. `shared/apiIntegrations/pipedrive.json`):

**Beispiel: `shared/apiIntegrations/pipedrive.json`**

```json
{
  "id": "pipedrive",
  "name": "Pipedrive",
  "icon": "📊",
  "logoUrl": "https://cdn.simpleicons.org/pipedrive/1a7598",
  "description": "CRM and sales pipeline management",
  "baseUrl": "https://api.pipedrive.com/v1",
  "authentication": {
    "type": "apiKey",
    "headerName": "Authorization",
    "headerFormat": "Bearer {apiKey}",
    "secretKey": "PIPEDRIVE_API_KEY"
  },
  "endpoints": [
    {
      "id": "create-deal",
      "name": "Create Deal",
      "description": "Create a new deal in Pipedrive",
      "method": "POST",
      "path": "/deals",
      "headers": {
        "Content-Type": "application/json"
      },
      "bodySchema": {
        "type": "object",
        "properties": {
          "title": { "type": "string", "required": true, "description": "Deal title" },
          "value": { "type": "number", "description": "Deal value" },
          "currency": { "type": "string", "default": "USD" }
        },
        "required": ["title"]
      },
      "urlTemplate": "https://api.pipedrive.com/v1/deals"
    }
  ]
}
```

**Metadaten-Index: `shared/apiIntegrations/index.json`**

```json
{
  "version": "1.0.0",
  "description": "Index of all API integrations",
  "integrations": [
    {
      "id": "pipedrive",
      "file": "pipedrive.json",
      "category": "crm"
    },
    {
      "id": "salesforce",
      "file": "salesforce.json",
      "category": "crm"
    }
  ]
}
```

### Authentifizierung

#### API Key
```json
{
  "authentication": {
    "type": "apiKey",
    "headerName": "Authorization",
    "headerFormat": "Bearer {apiKey}",
    "secretKey": "API_KEY_SECRET_NAME"
  }
}
```

#### OAuth2
```json
{
  "authentication": {
    "type": "oauth2",
    "headerName": "Authorization",
    "headerFormat": "Bearer {accessToken}",
    "secretKey": "OAUTH_ACCESS_TOKEN_SECRET_NAME"
  }
}
```

#### Basic Auth
```json
{
  "authentication": {
    "type": "basic",
    "headerName": "Authorization",
    "headerFormat": "Basic {base64(email:apiToken)}",
    "secretKey": "API_TOKEN_SECRET_NAME",
    "emailSecretKey": "EMAIL_SECRET_NAME"
  }
}
```

### Endpoint-Konfiguration

#### URL-Templates

URL-Templates unterstützen Platzhalter, die vom Benutzer ausgefüllt werden können:

```json
{
  "urlTemplate": "https://api.example.com/v1/deals/{dealId}",
  "path": "/deals/{dealId}"
}
```

Platzhalter werden automatisch in Expression-Syntax umgewandelt: `{{dealId}}`

#### Query Parameters

```json
{
  "queryParams": {
    "term": "{searchTerm}",
    "fields": "name,email,phone"
  }
}
```

#### Body Schema

Das `bodySchema` definiert die Struktur des Request-Bodies. Es wird als JSON-Template verwendet:

```json
{
  "bodySchema": {
    "type": "object",
    "properties": {
      "title": { 
        "type": "string", 
        "required": true,
        "description": "Deal title" 
      },
      "value": { 
        "type": "number",
        "description": "Deal value" 
      }
    },
    "required": ["title"]
  }
}
```

### Verwendung im Frontend

1. **Beim Klick auf "Add Node"** öffnet sich automatisch das API-Selection-Modal
2. **Links:** Liste der verfügbaren APIs
3. **Rechts:** Endpoints der ausgewählten API
4. **Bei Auswahl eines Endpoints** wird automatisch ein vorkonfigurierter HTTP-Request-Node erstellt mit:
   - ✅ Korrekter URL (mit Platzhaltern als Expressions)
   - ✅ HTTP-Method
   - ✅ Headers (inkl. Authentication)
   - ✅ Body-Template (basierend auf bodySchema)

### Beispiel: Pipedrive "Create Deal"

**In registry.json:**
```json
{
  "id": "create-deal",
  "name": "Create Deal",
  "method": "POST",
  "path": "/deals",
  "urlTemplate": "https://api.pipedrive.com/v1/deals",
  "bodySchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string", "required": true },
      "value": { "type": "number" }
    }
  }
}
```

**Erstellter Node:**
```json
{
  "type": "http-request",
  "data": {
    "label": "Pipedrive: Create Deal",
    "url": "https://api.pipedrive.com/v1/deals",
    "method": "POST",
    "headers": "{\"Authorization\": \"Bearer {{secrets.PIPEDRIVE_API_KEY}}\", \"Content-Type\": \"application/json\"}",
    "body": "{\n  \"title\": \"\",\n  \"value\": 0\n}",
    "sendInput": "true"
  }
}
```

### Secrets

API-Keys werden über **Workflow-Secrets** verwaltet:
- Secret-Name wird in `authentication.secretKey` definiert
- Im erstellten Node wird automatisch `{{secrets.SECRET_NAME}}` verwendet
- Benutzer müssen das Secret im Workflow konfigurieren (nicht im Node)

### Verfügbare APIs

Aktuell verfügbare APIs:
- 📊 **Pipedrive** - CRM and sales pipeline management
- ☁️ **Salesforce** - Customer relationship management
- 💬 **Slack** - Team communication
- 🟠 **HubSpot** - Marketing, sales, and service
- 🛒 **Shopify** - E-commerce platform
- 💳 **Stripe** - Payment processing
- 📊 **Google Sheets** - Spreadsheet management
- 🎯 **Jira** - Project management

### Neue API hinzufügen

1. **Neue JSON-Datei in `shared/apiIntegrations/` erstellen:**
   
   Erstelle z.B. `shared/apiIntegrations/my-api.json`:
   ```json
   {
     "id": "my-api",
     "name": "My API",
     "icon": "🔌",
     "logoUrl": "https://cdn.simpleicons.org/myapi/color",
     "description": "API description",
     "baseUrl": "https://api.example.com",
     "authentication": {
       "type": "apiKey",
       "headerName": "Authorization",
       "headerFormat": "Bearer {apiKey}",
       "secretKey": "MY_API_KEY"
     },
     "endpoints": [
       {
         "id": "create-item",
         "name": "Create Item",
         "description": "Create a new item",
         "method": "POST",
         "path": "/items",
         "headers": {
           "Content-Type": "application/json"
         },
         "bodySchema": {
           "type": "object",
           "properties": {
             "name": { "type": "string", "required": true }
           },
           "required": ["name"]
         },
         "urlTemplate": "https://api.example.com/items"
       }
     ]
   }
   ```

2. **Eintrag in `index.json` hinzufügen:**
   
   Füge einen neuen Eintrag in `shared/apiIntegrations/index.json` hinzu:
   ```json
   {
     "id": "my-api",
     "file": "my-api.json",
     "category": "integration"
   }
   ```

3. **Import in Frontend-Loader hinzufügen:**
   
   In `frontend/src/config/apiIntegrations.ts`:
   ```typescript
   // Import hinzufügen
   import myApiData from '../../../shared/apiIntegrations/my-api.json';
   
   // In apiDataMap hinzufügen
   const apiDataMap: Record<string, ApiIntegration> = {
     // ... bestehende APIs
     'my-api': myApiData as ApiIntegration,
   };
   ```

4. **Endpoints definieren** mit:
   - `id`, `name`, `description`
   - `method` (GET, POST, PUT, DELETE, PATCH)
   - `path` und `urlTemplate`
   - `headers` (optional)
   - `bodySchema` (für POST/PUT/PATCH)
   - `queryParams` (optional)

5. **Fertig!** - API erscheint automatisch im API-Selection-Modal

**Wichtig:** `npm run generate:registry` ist **NICHT erforderlich** für APIs! APIs werden direkt aus den JSON-Dateien geladen.

**Hinweis:** In Zukunft kann der Import-Schritt automatisiert werden, indem der Loader dynamisch alle Dateien aus dem `apiIntegrations/` Verzeichnis lädt.

---

## 🎉 Zusammenfassung

Das Registry-System macht es **super einfach**, neue Nodes hinzuzufügen:

1. ✅ **Definiere Node in `registry.json`**
2. ✅ **Setze `type: 'expression'` für Variable-Unterstützung**
3. ✅ **Führe `npm run generate:registry` aus**
4. ✅ **Fertig!** - Expression-Unterstützung ist automatisch aktiv

**Keine manuelle Konfiguration mehr nötig!** 🚀

### API-Integrationen

Für pre-konfigurierte HTTP-Request Nodes:

1. ✅ **Erstelle neue JSON-Datei in `shared/apiIntegrations/`**
2. ✅ **Füge Eintrag in `index.json` hinzu**
3. ✅ **Import in Frontend-Loader hinzufügen** (wird in Zukunft automatisiert)
4. ✅ **Definiere Endpoints mit URL, Method, Headers und Body-Schema**
5. ✅ **Fertig!** - API erscheint automatisch im API-Selection-Modal
6. ⚠️ **KEIN `npm run generate:registry` nötig** - APIs werden direkt geladen

**Vorteile der neuen Struktur:**
- ✅ **Skalierbar:** Jede API in eigener Datei (keine riesige `registry.json`)
- ✅ **Wartbar:** Einfache Bearbeitung einzelner APIs
- ✅ **Git-freundlich:** Weniger Merge-Konflikte
- ✅ **Performance:** Unverändert (Vite bundelt zur Build-Zeit)

**Benutzer können jetzt einfach APIs auswählen statt manuell HTTP-Requests zu konfigurieren!** 🔌

