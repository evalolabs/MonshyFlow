# 🎨 Config Panel Standard - Anleitung

Diese Anleitung erklärt den **Standard** für Config-Panels (Konfigurationsformulare) für Nodes im Monshy-System.

---

## 📋 Übersicht: Zwei Ansätze

Es gibt **zwei Standard-Wege**, um Config-Panels für Nodes zu erstellen:

### 1. **Automatische Config-Form** (Empfohlen für einfache Nodes)
✅ **Vorteile:**
- Minimaler Code-Aufwand
- Konsistentes Design
- Automatische Expression Editor Integration
- Automatische VariableTreePopover Integration
- Automatische Debug-Integration

### 2. **Manuelle Config-Form** (Für komplexe Nodes)
✅ **Vorteile:**
- Vollständige Kontrolle über UI
- Komplexe Interaktionen möglich
- Spezielle Validierung
- Custom Components

---

## 🚀 Ansatz 1: Automatische Config-Form (Empfohlen)

### Schritt 1: Fields in nodeMetadata.ts definieren

Füge `fields` zur Node-Metadaten-Definition hinzu:

```typescript
// frontend/src/components/WorkflowBuilder/nodeRegistry/nodeMetadata.ts

'my-new-node': {
  id: 'my-new-node',
  name: 'My New Node',
  icon: '🎯',
  description: 'Does something awesome',
  category: 'utility',
  component: () => null,
  hasConfigForm: true,
  useAutoConfigForm: true, // ← Aktiviert automatische Form-Generierung
  fields: {
    // Text-Feld
    label: { 
      type: 'text', 
      placeholder: 'Node Label' 
    },
    
    // Expression-Feld (mit Expression Editor)
    prompt: { 
      type: 'expression', 
      multiline: true, 
      rows: 6,
      placeholder: 'Enter prompt... Use {{variables}} for dynamic content'
    },
    
    // Select-Feld
    model: { 
      type: 'select', 
      options: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      ]
    },
    
    // Number-Feld (als Range-Slider)
    temperature: { 
      type: 'number', 
      min: 0, 
      max: 2, 
      step: 0.1 
    },
    
    // Number-Feld (als Input)
    timeout: {
      type: 'number',
      placeholder: 'Timeout in seconds'
    },
    
    // Textarea-Feld (nicht-expression)
    description: {
      type: 'textarea',
      rows: 4,
      placeholder: 'Node description...'
    },
  },
},
```

### Schritt 2: Fertig! 🎉

**Das war's!** Die Config-Form wird automatisch generiert und erscheint im NodeConfigPanel.

### Unterstützte Feldtypen

| Typ | Beschreibung | Beispiel |
|-----|-------------|----------|
| `text` | Einzeiliges Text-Input | `label`, `name` |
| `expression` | Expression Editor (mit `{{variables}}`) | `prompt`, `url`, `query` |
| `select` | Dropdown-Auswahl | `model`, `method`, `format` |
| `number` | Zahl-Input oder Range-Slider | `temperature`, `timeout` |
| `textarea` | Mehrzeiliges Text-Input | `description`, `notes` |

### Field-Config Optionen

```typescript
interface FieldConfig {
  type: 'expression' | 'text' | 'number' | 'select' | 'textarea';
  label?: string; // Optional: Überschreibt automatisches Label
  placeholder?: string; // Placeholder-Text
  multiline?: boolean; // Für expression/text/textarea
  rows?: number; // Für multiline-Felder
  options?: Array<{ value: string; label: string }>; // Für select-Felder
  min?: number; // Für number-Felder
  max?: number; // Für number-Felder
  step?: number; // Für number-Felder
}
```

### Automatische Features

Wenn `useAutoConfigForm: true` gesetzt ist, bekommst du automatisch:

✅ **Expression Editor** für `type: 'expression'` Felder
✅ **VariableTreePopover** für Expression-Felder (Variable-Insertion)
✅ **Debug-Integration** (Preview von Variablen während Execution)
✅ **Konsistentes Styling** (Tailwind CSS)
✅ **Auto-Save** (Änderungen werden automatisch gespeichert)

---

## 🎨 Ansatz 2: Manuelle Config-Form

### Schritt 1: Config-Form Component erstellen

Erstelle eine neue Datei in `frontend/src/components/WorkflowBuilder/NodeConfigForms/`:

```tsx
// NodeConfigForms/MyNewNodeConfigForm.tsx
import { renderField } from '../helpers/renderField';

interface MyNewNodeConfigFormProps {
  config: any;
  onConfigChange: (updates: any) => void;
  nodes?: Node[];
  edges?: Edge[];
  currentNodeId: string;
  debugSteps?: any[];
}

export function MyNewNodeConfigForm({
  config,
  onConfigChange,
  nodes = [],
  edges = [],
  currentNodeId,
  debugSteps = [],
}: MyNewNodeConfigFormProps) {
  return (
    <div className="space-y-4">
      {/* Verwende renderField für konsistentes Styling */}
      {renderField({
        nodeType: 'my-new-node',
        fieldName: 'label',
        label: 'Node Label',
        value: config.label || '',
        onChange: (value) => onConfigChange({ ...config, label: value }),
        nodes,
        edges,
        currentNodeId,
        debugSteps,
      })}
      
      {/* Expression-Feld mit Expression Editor */}
      {renderField({
        nodeType: 'my-new-node',
        fieldName: 'prompt',
        label: 'Prompt',
        value: config.prompt || '',
        onChange: (value) => onConfigChange({ ...config, prompt: value }),
        nodes,
        edges,
        currentNodeId,
        debugSteps,
      })}
      
      {/* Select-Feld */}
      {renderField({
        nodeType: 'my-new-node',
        fieldName: 'model',
        label: 'Model',
        value: config.model || 'gpt-4',
        onChange: (value) => onConfigChange({ ...config, model: value }),
        options: [
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        ],
        nodes,
        edges,
        currentNodeId,
        debugSteps,
      })}
      
      {/* Custom UI-Elemente */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          Advanced Settings
        </h3>
        {/* Deine custom UI hier */}
      </div>
    </div>
  );
}
```

### Schritt 2: In NodeConfigPanel registrieren

Füge den Case zu `frontend/src/components/WorkflowBuilder/NodeConfigPanel.tsx` hinzu:

```tsx
// In renderConfigForm() Funktion:
case 'my-new-node':
  return (
    <MyNewNodeConfigForm
      config={config}
      onConfigChange={(updates) => setConfig({ ...config, ...updates })}
      nodes={nodes}
      edges={edges}
      currentNodeId={selectedNode.id}
      debugSteps={debugSteps}
    />
  );
```

### Schritt 3: Optional: Field-Config für Expression Editor

Falls du Expression Editor verwenden willst, füge Field-Config zu `frontend/src/components/WorkflowBuilder/nodeFieldConfig.ts` hinzu:

```typescript
// nodeFieldConfig.ts
export const nodeFieldConfig: Record<string, Record<string, FieldConfig>> = {
  'my-new-node': {
    prompt: {
      type: 'expression',
      multiline: true,
      rows: 6,
      placeholder: 'Enter prompt... Use {{variables}}',
    },
  },
};
```

---

## 🛠️ renderField Helper

Der `renderField` Helper ist der **Standard** für konsistentes Rendering von Form-Feldern.

### Verwendung

```tsx
import { renderField } from '../helpers/renderField';

renderField({
  nodeType: 'my-node', // Node-Typ
  fieldName: 'myField', // Feld-Name
  label: 'My Field', // Label (optional)
  value: config.myField || '', // Aktueller Wert
  onChange: (value) => onConfigChange({ ...config, myField: value }), // Change-Handler
  nodes, // Node-Array (für Expression Editor)
  edges, // Edge-Array (für Expression Editor)
  currentNodeId, // Aktuelle Node-ID
  debugSteps, // Debug-Steps (für Preview)
  // Optionale Parameter:
  options: [...], // Für select-Felder
  min: 0, // Für number-Felder
  max: 100,
  step: 1,
})
```

### Unterstützte Feldtypen

Der Helper erkennt automatisch den Feldtyp basierend auf:
1. `nodeFieldConfig[nodeType][fieldName]` (falls definiert)
2. `options` Parameter → Select-Feld
3. `min` und `max` Parameter → Range-Slider
4. Default → Text-Input

### Expression Editor Integration

Wenn `nodeFieldConfig[nodeType][fieldName].type === 'expression'`:
- ✅ Wird automatisch Expression Editor verwendet
- ✅ VariableTreePopover wird automatisch integriert
- ✅ Preview wird während Execution angezeigt

---

## 📚 Beispiele

### Beispiel 1: Einfacher Node (Automatische Form)

```typescript
// nodeMetadata.ts
'note': {
  id: 'note',
  name: 'Note',
  icon: '📝',
  description: 'Leave comments',
  category: 'core',
  component: () => null,
  hasConfigForm: true,
  useAutoConfigForm: true, // ← Automatisch
  fields: {
    label: { type: 'text', placeholder: 'Note Label' },
    content: { 
      type: 'expression', 
      multiline: true, 
      rows: 4, 
      placeholder: 'Note content... Use {{variables}}' 
    },
  },
},
```

**Ergebnis:** Vollständige Config-Form ohne zusätzlichen Code!

### Beispiel 2: Komplexer Node (Manuelle Form)

```tsx
// StartNodeConfigForm.tsx
export function StartNodeConfigForm({ config, onConfigChange, workflowId }) {
  return (
    <div className="space-y-4">
      {/* Entry Type Selection */}
      <div>
        <label>Entry Type</label>
        <select value={config.entryType} onChange={...}>
          <option value="webhook">Webhook</option>
          <option value="schedule">Schedule</option>
          <option value="manual">Manual</option>
        </select>
      </div>
      
      {/* Conditional Fields */}
      {config.entryType === 'webhook' && (
        <div>
          <label>Webhook URL</label>
          <input type="text" value={config.webhookUrl} onChange={...} />
        </div>
      )}
      
      {config.entryType === 'schedule' && (
        <ScheduleConfigForm 
          config={config.scheduleConfig}
          onChange={...}
        />
      )}
      
      {/* Schema Builder */}
      <SchemaBuilder 
        schema={config.inputSchema}
        onChange={...}
      />
    </div>
  );
}
```

**Ergebnis:** Vollständige Kontrolle über UI und Logik.

### Beispiel 3: Hybrid (renderField + Custom UI)

```tsx
export function AgentNodeConfigForm({ config, onConfigChange, ... }) {
  return (
    <div className="space-y-4">
      {/* Standard-Felder mit renderField */}
      {renderField({
        nodeType: 'agent',
        fieldName: 'label',
        label: 'Agent Name',
        value: config.label || '',
        onChange: (value) => onConfigChange({ ...config, label: value }),
        nodes, edges, currentNodeId, debugSteps,
      })}
      
      {renderField({
        nodeType: 'agent',
        fieldName: 'instructions',
        label: 'System Prompt',
        value: config.instructions || '',
        onChange: (value) => onConfigChange({ ...config, instructions: value }),
        nodes, edges, currentNodeId, debugSteps,
      })}
      
      {/* Custom UI für Tools-Auswahl */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold mb-2">Tools</h3>
        <ToolSelector 
          selectedTools={config.tools || []}
          onChange={(tools) => onConfigChange({ ...config, tools })}
        />
      </div>
    </div>
  );
}
```

**Ergebnis:** Beste aus beiden Welten - konsistente Felder + Custom UI.

---

## ✅ Best Practices

### 1. **Nutze automatische Forms wenn möglich**
- Für 80% der Nodes reicht `useAutoConfigForm: true`
- Spart Zeit und Code
- Konsistentes Design

### 2. **Nutze renderField für manuelle Forms**
- Konsistentes Styling
- Expression Editor Integration
- Debug-Integration

### 3. **Definiere Field-Configs**
- Für Expression-Felder: `nodeFieldConfig.ts`
- Oder direkt in `nodeMetadata.ts` (bei `useAutoConfigForm: true`)

### 4. **Konsistente Labels**
- Verwende klare, beschreibende Labels
- Füge Placeholder-Texte hinzu
- Dokumentiere Expression-Felder ({{variables}})

### 5. **Validierung**
- Client-seitige Validierung in Config-Form
- Server-seitige Validierung in Node Processor
- Zeige Fehler-Messages klar an

### 6. **Auto-Save**
- Config-Änderungen werden automatisch gespeichert
- Zeige "Saving..." Indikator (bereits implementiert)
- Keine "Save"-Button nötig

---

## 🎯 Entscheidungshilfe

### Wann automatische Form?
✅ Einfache Nodes mit Standard-Feldern
✅ Text, Expression, Select, Number Felder
✅ Keine komplexe UI-Logik nötig
✅ Schnelle Implementierung gewünscht

### Wann manuelle Form?
✅ Komplexe UI-Interaktionen (z.B. Schema Builder)
✅ Conditional Fields (wenn X dann Y)
✅ Custom Components (z.B. Tool Selector)
✅ Spezielle Validierung nötig
✅ Multi-Step Forms

---

## 📖 Weitere Ressourcen

- **Node Registry Guide**: `frontend/src/components/WorkflowBuilder/nodeRegistry/NODE_REGISTRY_GUIDE.md`
- **renderField Helper**: `frontend/src/components/WorkflowBuilder/helpers/renderField.tsx`
- **Beispiel: StartNodeConfigForm**: `frontend/src/components/WorkflowBuilder/NodeConfigForms/StartNodeConfigForm.tsx`
- **Beispiel: SchemaBuilder**: `frontend/src/components/WorkflowBuilder/NodeConfigForms/SchemaBuilder.tsx`

---

## 🚀 Zusammenfassung

**Standard für Config-Panels:**

1. **Für einfache Nodes**: `useAutoConfigForm: true` + `fields` in `nodeMetadata.ts`
2. **Für komplexe Nodes**: Custom Component + `renderField` Helper
3. **Für Expression-Felder**: Immer `type: 'expression'` verwenden
4. **Für konsistentes Design**: Immer `renderField` Helper verwenden

**Das war's!** 🎉

