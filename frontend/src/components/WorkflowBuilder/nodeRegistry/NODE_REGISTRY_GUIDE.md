# Node Registry Guide - Neue Nodes hinzufügen

## 🎯 Übersicht

Das Node-Registry-System macht es **super einfach**, neue Nodes hinzuzufügen. Entwickler müssen nur:

1. **Node-Komponente erstellen** (in `NodeTypes/`)
2. **Metadaten registrieren** (in `nodeRegistry/nodeMetadata.ts`)
3. **Component importieren & registrieren** (in `nodeRegistry/nodeRegistry.ts`)

**Fertig!** Der Node erscheint automatisch im:
- ✅ Node-Selector (Toolbar)
- ✅ WorkflowCanvas (kann verwendet werden)
- ✅ Node-Kategorien

---

## 📝 Schritt-für-Schritt Anleitung

### Schritt 1: Node-Komponente erstellen

Erstelle eine neue Datei in `frontend/src/components/WorkflowBuilder/NodeTypes/`:

```tsx
// NodeTypes/MyNewNode.tsx
import React from 'react';
import { BaseNode } from './BaseNode';

export function MyNewNode({ data }: any) {
  return (
    <BaseNode
      label={data.label || 'My New Node'}
      icon="🎯"
      category="utility"
      subtitle={data.subtitle}
      hasInput={true}
      hasOutput={true}
    />
  );
}
```

**Tipp:** Nutze `BaseNode` für konsistentes Design. Für komplexe Nodes kannst du auch ein Custom-Design implementieren.

---

### Schritt 2: In OptimizedNodes.tsx hinzufügen

Füge den Node zu `NodeTypes/OptimizedNodes.tsx` hinzu:

```tsx
import { MyNewNode as MyNewNodeBase } from './MyNewNode';

// In der Export-Liste:
export const MyNewNode = React.memo(MyNewNodeBase, areNodePropsEqual);
```

---

### Schritt 3: Metadaten registrieren

Füge Metadaten zu `nodeRegistry/nodeMetadata.ts` hinzu:

```tsx
// In NODE_METADATA_REGISTRY:
'my-new-node': {
  id: 'my-new-node',
  name: 'My New Node',
  icon: '🎯',
  description: 'Does something awesome',
  category: 'utility', // 'core' | 'ai' | 'logic' | 'data' | 'integration' | 'utility' | 'tools'
  component: () => null, // Wird in nodeRegistry.ts gesetzt
  hasConfigForm: true, // Wenn true, brauchst du Config-Form
  canDuplicate: true, // Default: true
  isUnique: false, // Default: false (true für Start-Node)
  hasInput: true, // Default: true
  hasOutput: true, // Default: true
  expressionFields: ['field1', 'field2'], // Optional: Felder mit Expression Editor
},
```

---

### Schritt 4: Component registrieren

Füge den Import und die Registrierung zu `nodeRegistry/nodeRegistry.ts` hinzu:

```tsx
// Import hinzufügen:
import { MyNewNode } from '../NodeTypes/OptimizedNodes';

// In NODE_COMPONENTS:
'my-new-node': MyNewNode,
```

---

### Schritt 5: Config-Form (optional)

Falls `hasConfigForm: true` gesetzt ist, füge Config-Form zu `NodeConfigForms/` hinzu:

```tsx
// NodeConfigForms/MyNewNodeConfigForm.tsx
export function MyNewNodeConfigForm({ config, onConfigChange }: any) {
  return (
    <div className="space-y-4">
      {/* Config-Felder hier */}
    </div>
  );
}
```

Dann in `NodeConfigPanel.tsx` registrieren:

```tsx
case 'my-new-node':
  return <MyNewNodeConfigForm config={config} onConfigChange={...} />;
```

---

### Schritt 6: Field-Konfiguration (optional, aber empfohlen)

**NEU:** Felder können jetzt direkt in `nodeMetadata.ts` konfiguriert werden!

```tsx
// In nodeMetadata.ts
'my-new-node': {
  // ... andere Metadaten
  hasConfigForm: true,
  useAutoConfigForm: true, // ← Aktiviert automatische Config-Form-Generierung
  fields: {
    label: { type: 'text', placeholder: 'Node Label' },
    prompt: { 
      type: 'expression', 
      multiline: true, 
      rows: 6,
      placeholder: 'Enter prompt... Use {{variables}}'
    },
    model: { 
      type: 'select', 
      options: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      ]
    },
    temperature: { 
      type: 'number', 
      min: 0, 
      max: 2, 
      step: 0.1 
    },
  },
},
```

**Vorteile:**
- ✅ **VariableTreePopover automatisch** - Expression-Felder bekommen automatisch Variable-Tree-Popover
- ✅ **Automatische Config-Form** - Kein manueller Code in `NodeConfigPanel.tsx` nötig
- ✅ **Automatische nodeFieldConfig** - Wird automatisch aus Metadaten generiert
- ✅ **Eine einzige Konfiguration** - Alles in `nodeMetadata.ts`

**Legacy-Methode (noch unterstützt):**
Falls du `useAutoConfigForm: false` setzt, kannst du weiterhin manuelle Config-Forms verwenden:
- Füge Config-Form zu `NodeConfigForms/` hinzu
- Füge Felder zu `nodeFieldConfig.ts` hinzu
- Verwende `renderFieldWithDebug` in `NodeConfigPanel.tsx`

---

## ✅ Fertig!

Nach diesen Schritten ist der neue Node:
- ✅ Im Node-Selector sichtbar
- ✅ Im WorkflowCanvas verwendbar
- ✅ Konfigurierbar (automatisch oder manuell)
- ✅ Mit Expression Editor (automatisch durch `fields` Konfiguration)
- ✅ Mit VariableTreePopover (automatisch für Expression-Felder)

---

## 📚 Beispiele

### Einfacher Node (Standard Input/Output) - NEU mit automatischer Config-Form

```tsx
// nodeMetadata.ts
'note': {
  id: 'note',
  name: 'Note',
  icon: '📝',
  description: 'Leave comments',
  category: 'core',
  component: () => null,
  hasConfigForm: true,
  useAutoConfigForm: true, // ← Automatische Config-Form
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

**Das war's!** Kein weiterer Code nötig - die Config-Form wird automatisch generiert und `VariableTreePopover` ist automatisch verfügbar!

### Komplexer Node (Multiple Handles)

```tsx
// nodeMetadata.ts
'ifelse': {
  id: 'ifelse',
  name: 'If / else',
  icon: '↗️',
  description: 'Add conditional logic',
  category: 'logic',
  component: () => null,
  hasConfigForm: true,
  expressionFields: ['condition'],
  additionalHandles: [
    { id: 'true', type: 'source', position: 'right' as any, label: 'Yes' },
    { id: 'false', type: 'source', position: 'right' as any, label: 'No' },
  ],
},
```

### Eindeutiger Node (wie Start)

```tsx
// nodeMetadata.ts
'start': {
  id: 'start',
  name: 'Start',
  icon: '🚀',
  description: 'Entry point',
  category: 'core',
  component: () => null,
  hasConfigForm: true,
  isUnique: true, // ⚠️ Nur ein Start-Node erlaubt
  canDuplicate: false,
  hasInput: false,
  hasOutput: true,
},
```

---

## 🔄 Vergleich: Vorher vs. Nachher

### Vorher (6+ Stellen manuell anpassen):
1. ✅ Node-Komponente erstellen
2. ❌ `WorkflowCanvas.tsx` - `createNodeTypes()` Funktion
3. ❌ `NodeTypes/index.ts` - Export
4. ❌ `NodeTypes/OptimizedNodes.tsx` - React.memo Wrapper
5. ❌ `types/nodeCategories.ts` - Kategorien
6. ❌ `NodeConfigPanel.tsx` - Switch/Case
7. ❌ `nodeFieldConfig.ts` - Expression Editor

### Nachher (3 Schritte):
1. ✅ Node-Komponente erstellen
2. ✅ `nodeMetadata.ts` - Metadaten registrieren
3. ✅ `nodeRegistry.ts` - Component registrieren

**Das war's!** Alles andere passiert automatisch. 🎉

---

## 🎨 Best Practices

1. **Nutze BaseNode:** Für konsistentes Design
2. **Wähle passende Kategorie:** core, ai, logic, data, integration, utility, tools
3. **Nutze `useAutoConfigForm: true`:** Für einfache Nodes - automatische Config-Form-Generierung
4. **Definiere `fields` in Metadaten:** Eine einzige Konfiguration für alles (Config-Form + Expression Editor + VariableTreePopover)
5. **Dokumentiere Expression-Felder:** Nutzer müssen wissen, welche Felder `{{variables}}` unterstützen
6. **Teste Config-Form:** Stelle sicher, dass alle Felder korrekt funktionieren

## 🚀 VariableTreePopover - Automatisch verfügbar!

**Wenn du `fields` mit `type: 'expression'` definierst:**
- ✅ **VariableTreePopover** wird automatisch integriert
- ✅ **Expression Editor** wird automatisch verwendet
- ✅ **Variable-Insertion** funktioniert automatisch
- ✅ **Preview** wird automatisch angezeigt

**Keine zusätzliche Konfiguration nötig!**

---

## 🚀 Nächste Schritte

Nach dem Hinzufügen eines neuen Nodes:
- Teste im Workflow-Editor
- Prüfe, ob alle Felder korrekt funktionieren
- Dokumentiere besondere Features
- Erstelle Beispiel-Workflows (optional)

