# WorkflowBuilder Component Documentation

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Architektur](#architektur)
3. [Ordnerstruktur](#ordnerstruktur)
4. [Komponenten](#komponenten)
5. [Custom Hooks](#custom-hooks)
6. [Utilities](#utilities)
7. [Konstanten](#konstanten)
8. [Entwickler-Guide](#entwickler-guide)
9. [Häufige Aufgaben](#häufige-aufgaben)
10. [Best Practices](#best-practices)

---

## 🎯 Übersicht

Der **WorkflowBuilder** ist ein visueller Editor zum Erstellen und Bearbeiten von Workflows. Er basiert auf React Flow und bietet folgende Features:

- ✅ **Drag & Drop** für Nodes und Edges
- ✅ **Auto-Save** mit Debouncing
- ✅ **Auto-Layout** für automatische Anordnung
- ✅ **While-Loops** mit spezieller Visualisierung
- ✅ **Node-Validierung** (z.B. nur ein Start-Node)
- ✅ **Execution Monitoring** in Echtzeit
- ✅ **Context Menus** für schnelle Aktionen
- ✅ **Performance-Optimiert** mit React.memo

---

## 🏗️ Architektur

### Architektur-Prinzipien

1. **Separation of Concerns**: Logik ist in Custom Hooks ausgelagert
2. **Single Responsibility**: Jede Datei hat eine klare Aufgabe
3. **Reusability**: Utilities und Hooks sind wiederverwendbar
4. **Type Safety**: Vollständige TypeScript-Typisierung
5. **Performance**: Memoization und optimierte Re-Renders

### Haupt-Komponenten-Hierarchie

```
WorkflowCanvas (Haupt-Komponente)
├── Toolbar (Aktionen: Save, Execute, etc.)
├── ReactFlow (Canvas)
│   ├── NodeTypes (Start, End, Agent, LLM, etc.)
│   ├── EdgeTypes (ButtonEdge, LoopEdge, PhantomEdge)
│   ├── Controls (Zoom, Pan)
│   ├── MiniMap
│   └── Background
├── NodeConfigPanel (Rechts-Panel für Node-Konfiguration)
├── NodeSelectorPopup (Node-Auswahl beim Hinzufügen)
├── ExecutionMonitor (Execution-Status anzeigen)
├── NodeContextMenu (Rechtsklick-Menü)
└── DeleteNodeModal (Lösch-Bestätigung)
```

---

## 📁 Ordnerstruktur

```
WorkflowBuilder/
├── constants.ts                    # Alle Konstanten zentral
├── WorkflowCanvas.tsx              # Haupt-Komponente (refactored, ~400 Zeilen)
├── WorkflowCanvas.backup.tsx       # Backup der alten Version
├── Toolbar.tsx                     # Toolbar-Komponente
├── NodeConfigPanel.tsx             # Konfigurations-Panel
├── NodeSelectorPopup.tsx           # Node-Auswahl-Popup
├── NodeContextMenu.tsx             # Rechtsklick-Menü
├── DeleteNodeModal.tsx             # Lösch-Bestätigung
│
├── hooks/                          # Custom Hooks
│   ├── index.ts                    # Zentrale Export-Datei
│   ├── useAutoSave.ts              # Auto-Save Logik
│   ├── useAutoLayout.ts            # Auto-Layout Logik
│   ├── usePhantomEdges.ts          # Phantom-Edges für + Buttons
│   ├── useNodeOperations.ts        # Node: Add, Delete, Update, Duplicate
│   ├── useEdgeHandling.ts          # Edge: Connect, Type Detection
│   ├── useNodeSelector.ts          # Node-Selector Popup Logik
│   └── useWorkflowExecution.ts     # Workflow Execution & Publishing
│
├── NodeTypes/                      # Alle Node-Komponenten
│   ├── StartNode.tsx
│   ├── EndNode.tsx
│   ├── AgentNode.tsx
│   ├── LLMNode.tsx
│   ├── WhileNode.tsx
│   ├── ... (weitere Nodes)
│   ├── index.ts                    # Export aller Nodes
│   └── OptimizedNodes.tsx          # React.memo optimierte Versionen
│
└── EdgeTypes/                      # Alle Edge-Komponenten
    ├── ButtonEdge.tsx              # Standard Edge mit + Button
    ├── LoopEdge.tsx                # Loop-Edge für While-Nodes
    └── PhantomAddButtonEdge.tsx    # Unsichtbare Edge nur mit Button
```

### Utils-Ordner (außerhalb WorkflowBuilder)

```
utils/
├── logger.ts                       # Strukturiertes Logging
├── nodeUtils.ts                    # Node-Helper-Funktionen
├── edgeUtils.ts                    # Edge-Helper-Funktionen
└── autoLayout.ts                   # Layout-Algorithmus
```

---

## 🧩 Komponenten

### WorkflowCanvas.tsx

**Hauptkomponente des Workflow-Editors**

```typescript
interface WorkflowCanvasProps {
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  workflowId?: string;
}
```

**Verwendung:**

```tsx
<WorkflowCanvas
  initialNodes={nodes}
  initialEdges={edges}
  onSave={handleSave}
  workflowId="workflow-123"
/>
```

### Toolbar.tsx

Enthält alle Workflow-Aktionen:
- Node hinzufügen (Dropdown)
- Speichern / Auto-Save Status
- Ausführen
- Publishen
- Auto-Layout Toggle
- Fit View

### NodeConfigPanel.tsx

Rechts-Panel zum Konfigurieren von Nodes:
- Node-spezifische Einstellungen
- Tabs für verschiedene Kategorien
- Validierung
- Löschen-Button

---

## 🪝 Custom Hooks

### useAutoSave

**Zweck:** Automatisches Speichern mit Debouncing

```typescript
const { autoSaving, manualSave, triggerImmediateSave } = useAutoSave({
  workflowId,
  nodes,
  edges,
  onSave,
});
```

**Features:**
- Debouncing (2s)
- Verhindert Speichern beim ersten Render
- Manuelles Speichern möglich
- Sofortiges Speichern nach Operationen

---

### useAutoLayout

**Zweck:** Automatisches Layout von Nodes

```typescript
const { enabled, toggleEnabled, applyLayout } = useAutoLayout({
  nodes,
  edges,
  onNodesChange: setNodes,
  onEdgesChange: setEdges,
});
```

**Features:**
- Toggle On/Off
- Automatisches Layout beim Hinzufügen von Nodes
- Manueller Layout-Trigger

---

### useNodeOperations

**Zweck:** Alle Node-Operationen zentral

```typescript
const { addNode, deleteNode, duplicateNode, updateNode } = useNodeOperations({
  nodes,
  edges,
  workflowId,
  onNodesChange: setNodes,
  onEdgesChange: setEdges,
  onAddNodeCallback,
  deleteNodeFromBackend,
});
```

**Funktionen:**
- `addNode(type, position?)` - Fügt Node hinzu mit Validierung
- `deleteNode(nodeId)` - Löscht Node mit automatischer Reconnection
- `duplicateNode(node)` - Dupliziert Node (außer Start)
- `updateNode(nodeId, data)` - Aktualisiert Node-Daten

---

### useEdgeHandling

**Zweck:** Edge-Erstellung und Typ-Erkennung

```typescript
const { handleConnect } = useEdgeHandling({
  nodes,
  edges,
  onEdgesChange: setEdges,
  onAddNodeCallback,
});
```

**Features:**
- Auto-Erkennung von Loop-Edges
- Smart Handle-Management
- Button-Funktionalität für alle Edges

---

### usePhantomEdges

**Zweck:** Phantom-Edges für Nodes ohne Output

```typescript
const phantomEdges = usePhantomEdges({
  nodes,
  edges,
  onAddNode: openPopupFromOutput,
});
```

**Ergebnis:** Array von unsichtbaren Edges mit + Button

---

### useNodeSelector

**Zweck:** Komplexe Logik für Node-Auswahl und -Einfügung

```typescript
const {
  popup,
  openPopupBetweenNodes,
  openPopupFromOutput,
  selectNodeType,
  closePopup,
} = useNodeSelector({
  nodes,
  edges,
  onNodesChange: setNodes,
  onEdgesChange: setEdges,
  onAddNodeCallback,
  autoLayoutEnabled,
});
```

**Szenarien:**
1. Node zwischen zwei anderen Nodes einfügen
2. Node von Node-Output hinzufügen
3. Node in While-Loop einfügen

---

### useWorkflowExecution

**Zweck:** Workflow ausführen und publishen

```typescript
const {
  executing,
  publishing,
  currentExecutionId,
  showExecutionMonitor,
  execute,
  publish,
  closeExecutionMonitor,
} = useWorkflowExecution({ workflowId });
```

---

## 🛠️ Utilities

### logger.ts

**Strukturiertes Logging mit verschiedenen Levels**

```typescript
import { workflowLogger, nodeLogger, edgeLogger } from '@/utils/logger';

workflowLogger.info('Workflow saved');
nodeLogger.debug('Node added', { nodeId: 'node-123' });
edgeLogger.error('Edge creation failed', error);
```

**Log Levels:** debug, info, warn, error

**Environment:**
- Development: Alle Logs aktiv
- Production: Nur errors (konfigurierbar)

---

### nodeUtils.ts

**Helper-Funktionen für Nodes**

```typescript
import {
  hasStartNode,
  isWhileNode,
  createNode,
  generateNodeId,
  calculateRelativePosition,
  getSourceHandle,
  getTargetHandle,
} from '@/utils/nodeUtils';

// Beispiele:
const hasStart = hasStartNode(nodes);
const newNode = createNode('llm', { x: 100, y: 200 });
const pos = calculateRelativePosition(sourceNode, 'below', 150);
```

**Wichtige Funktionen:**
- `hasStartNode(nodes)` - Prüft ob Start-Node existiert
- `createNode(type, position?, data?)` - Erstellt neuen Node
- `calculateRelativePosition(node, direction, spacing)` - Position relativ zu Node
- `getSourceHandle(nodeType)` - Richtiges Source-Handle für Typ
- `getTargetHandle(nodeType)` - Richtiges Target-Handle für Typ

---

### edgeUtils.ts

**Helper-Funktionen für Edges**

```typescript
import {
  createButtonEdge,
  createLoopEdge,
  createPhantomEdge,
  isLoopEdge,
  shouldBeLoopEdge,
  findDownstreamNodes,
  buildEdgeLookup,
} from '@/utils/edgeUtils';

// Beispiele:
const edge = createButtonEdge(sourceId, targetId, onAddNode);
const loopEdge = createLoopEdge(whileNodeId, onAddNode);
const downstream = findDownstreamNodes(nodeId, edges);
```

**Wichtige Funktionen:**
- `createButtonEdge(source, target, callback)` - Standard Edge
- `createLoopEdge(whileNodeId, callback)` - Loop Edge für While
- `isLoopEdge(edge)` - Prüft ob Loop-Edge
- `shouldBeLoopEdge(connection, sourceNode, targetNode)` - Auto-Erkennung
- `findDownstreamNodes(nodeId, edges)` - BFS-Suche nach Downstream-Nodes

---

## 📊 Konstanten

### constants.ts

**Alle Konstanten zentral definiert**

```typescript
import {
  VERTICAL_SPACING,
  NODE_TYPE_START,
  EDGE_TYPE_BUTTON,
  VALIDATION_MESSAGES,
  NODE_COLORS,
} from './constants';
```

**Kategorien:**
- **Layout:** Spacing, Sizing
- **Timing:** Auto-Save-Delays, Polling-Intervalle
- **Edge Types:** buttonEdge, loopEdge, phantomAddButton
- **Node Types:** start, end, while, ifelse, etc.
- **Handle IDs:** input, loop-body, loop-exit, loop-back
- **Validation Messages:** Alle User-Nachrichten
- **Colors:** MiniMap-Farben für Node-Types

---

## 👨‍💻 Entwickler-Guide

### Neuen Node-Typ hinzufügen

**Schritt 1:** Node-Komponente erstellen

```typescript
// NodeTypes/MyNewNode.tsx
import { Handle, Position } from '@xyflow/react';

interface MyNewNodeProps {
  data: {
    label?: string;
    // Weitere Eigenschaften
  };
}

export function MyNewNode({ data }: MyNewNodeProps) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-blue-500">
      <Handle type="target" position={Position.Top} />
      <div>{data.label || 'My New Node'}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

**Schritt 2:** Node registrieren in WorkflowCanvas.tsx

```typescript
import { MyNewNode } from './NodeTypes/MyNewNode';

const nodeTypes = {
  // ... existing nodes
  'my-new-node': MyNewNode,
};
```

**Schritt 3:** Node zur Toolbar hinzufügen

```typescript
// In Toolbar.tsx
const nodeCategories = {
  // ... existing categories
  custom: [
    { type: 'my-new-node', label: 'My New Node', icon: '🆕' },
  ],
};
```

**Schritt 4:** Farbe für MiniMap definieren (optional)

```typescript
// In constants.ts
export const NODE_COLORS = {
  // ... existing colors
  'my-new-node': '#your-color',
};
```

---

### Neuen Edge-Typ hinzufügen

**Schritt 1:** Edge-Komponente erstellen

```typescript
// EdgeTypes/MyNewEdge.tsx
import { BaseEdge, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

export function MyNewEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return <BaseEdge id={id} path={edgePath} style={{ stroke: 'red' }} />;
}
```

**Schritt 2:** Edge registrieren

```typescript
// In WorkflowCanvas.tsx
const edgeTypes = {
  // ... existing edges
  myNewEdge: MyNewEdge,
};
```

---

### Logging aktivieren/deaktivieren

**Development:** Alle Logs aktiv (automatisch)

**Production:** Nur Errors (automatisch)

**Custom Log Level:**

```typescript
// In .env oder .env.local
VITE_LOG_LEVEL=debug  # oder: info, warn, error
```

---

## 🔧 Häufige Aufgaben

### Node-Validierung anpassen

**Datei:** `utils/nodeUtils.ts`

```typescript
export function canHaveMultipleInstances(nodeType: string): boolean {
  // Füge weitere Node-Types hinzu, die nur einmal vorkommen dürfen
  return nodeType !== NODE_TYPE_START && nodeType !== 'my-unique-node';
}
```

### Neue Validierungs-Nachricht hinzufügen

**Datei:** `constants.ts`

```typescript
export const VALIDATION_MESSAGES = {
  // ... existing messages
  MY_NEW_VALIDATION: '⚠️ Deine Validierungsnachricht hier!',
};
```

### Auto-Save-Intervall ändern

**Datei:** `constants.ts`

```typescript
export const AUTO_SAVE_DELAY = 5000; // 5 Sekunden statt 2
```

### Layout-Spacing anpassen

**Datei:** `constants.ts`

```typescript
export const VERTICAL_SPACING = 200; // Statt 150
export const HORIZONTAL_SPACING = 400; // Statt 300
```

---

## ✅ Best Practices

### 1. State Management

❌ **Falsch:**
```typescript
// Direktes Mutieren von State
nodes.push(newNode);
setNodes(nodes);
```

✅ **Richtig:**
```typescript
// Immutable State Updates
setNodes([...nodes, newNode]);
```

---

### 2. Logging

❌ **Falsch:**
```typescript
console.log('Node added', nodeId);
```

✅ **Richtig:**
```typescript
import { nodeLogger } from '@/utils/logger';
nodeLogger.info('Node added', { nodeId });
```

---

### 3. Konstanten verwenden

❌ **Falsch:**
```typescript
if (node.type === 'start') { ... }
```

✅ **Richtig:**
```typescript
import { NODE_TYPE_START } from './constants';
if (node.type === NODE_TYPE_START) { ... }
```

---

### 4. Helper-Funktionen nutzen

❌ **Falsch:**
```typescript
const hasStart = nodes.some(n => n.type === 'start');
```

✅ **Richtig:**
```typescript
import { hasStartNode } from '@/utils/nodeUtils';
const hasStart = hasStartNode(nodes);
```

---

### 5. Type Safety

❌ **Falsch:**
```typescript
function myFunction(data: any) { ... }
```

✅ **Richtig:**
```typescript
import type { Node, Edge } from '@xyflow/react';
function myFunction(nodes: Node[], edges: Edge[]) { ... }
```

---

## 🐛 Debugging

### Logging aktivieren

```typescript
// Temporär alle Logs aktivieren (in logger.ts)
this.config.enabled = true;
this.config.minLevel = 'debug';
```

### React Flow DevTools

```tsx
import { ReactFlowProvider } from '@xyflow/react';

// Wrapper mit DevTools
<ReactFlowProvider>
  <WorkflowCanvas {...props} />
</ReactFlowProvider>
```

### Performance-Profiling

Chrome DevTools → Performance → Record → Interaktion → Stop

**Achte auf:**
- Lange Re-Renders
- Unnötige Component-Updates
- Memory Leaks

---

## 📚 Weitere Ressourcen

- [React Flow Documentation](https://reactflow.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Hooks Documentation](https://react.dev/reference/react)

---

## 🤝 Beitragen

Bei Fragen oder Problemen:
1. Schaue zuerst in dieses README
2. Prüfe die Implementierung in den entsprechenden Dateien
3. Nutze das Logging-System zum Debuggen
4. Erstelle ein Issue mit detaillierten Informationen

---

**Letzte Aktualisierung:** 2024
**Maintainer:** Development Team


