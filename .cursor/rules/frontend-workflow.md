# Frontend Workflow Builder - Development Rules

**Kritische Regeln für die Weiterentwicklung des WorkflowBuilder-Systems**

---

## 🎯 Überblick

Der WorkflowBuilder ist ein komplexes System mit vielen interdependenten Komponenten. Diese Rules stellen sicher, dass Änderungen das System nicht kaputt machen und die Architektur konsistent bleibt.

**Kernprinzipien:**
1. **Separation of Concerns** - Logik in Hooks, UI in Komponenten
2. **Single Source of Truth** - Registry-System für Nodes/Tools
3. **Immutable State** - Nie State direkt mutieren
4. **Type Safety** - TypeScript überall, keine `any` ohne Grund
5. **Performance** - React.memo, useMemo, useCallback wo nötig
6. **Node Grouping** - Parent-Child-Beziehungen respektieren (Agent+Tools, Loops, IfElse)
7. **Event-Driven** - SSE Events → Execution Steps → Animation (keine manuellen State-Updates)
8. **Test-Driven** - Tests schreiben für jede Funktion, Tests müssen bestehen bevor wir weitermachen

---

## 🏗️ Architektur-Übersicht

### Komponenten-Hierarchie

```
WorkflowCanvas (Haupt-Komponente)
├── ResizableWorkflowLayout (Layout-Wrapper)
│   ├── ReactFlow (Canvas)
│   │   ├── NodeTypes (dynamisch aus Registry)
│   │   ├── EdgeTypes (ButtonEdge, LoopEdge)
│   │   └── Controls, MiniMap, Background
│   ├── Toolbar
│   ├── NodeConfigPanel
│   ├── DebugPanel
│   └── ExecutionMonitor
└── Custom Hooks (Logik ausgelagert)
```

### Wichtige Dateien

- `WorkflowCanvas.tsx` - Haupt-Komponente (~1200 Zeilen)
- `nodeRegistry/` - Node-Registry-System (Single Source of Truth)
- `hooks/` - Alle Custom Hooks für Logik
- `utils/` - Helper-Funktionen
- `constants.ts` - Alle Konstanten zentral

---

## ⚠️ KRITISCHE REGELN - NIE VERLETZEN

> **🔴 PRIORITÄT 1 - System-Breaking:** Diese Regeln müssen IMMER eingehalten werden. Verletzung führt zu System-Fehlern.

### 1. Node Data Struktur

**❌ NIE:**
```typescript
// Node.data als String speichern
node.data = JSON.stringify({...});

// Node.data direkt mutieren
node.data.label = 'new label';
```

**✅ IMMER:**
```typescript
// Node.data ist IMMER ein Object
const updatedNode = {
  ...node,
  data: {
    ...node.data,
    label: 'new label',
  },
};

// Beim Laden vom Backend: String → Object konvertieren
if (typeof node.data === 'string') {
  node.data = JSON.parse(node.data);
}
```

**Warum:** Backend erwartet Object, nicht String. String führt zu `InvalidCastException`.

---

### 2. State Updates - Immutable

**❌ NIE:**
```typescript
// Direktes Mutieren
nodes.push(newNode);
setNodes(nodes);

// Direktes Ändern
node.data.label = 'new';
```

**✅ IMMER:**
```typescript
// Immutable Updates
setNodes([...nodes, newNode]);

// Node Update
const updatedNodes = nodes.map(node =>
  node.id === nodeId
    ? { ...node, data: { ...node.data, label: 'new' } }
    : node
);
setNodes(updatedNodes);
```

**Warum:** React erkennt Änderungen nur bei neuen Referenzen.

---

### 3. Edge Type Bestimmung

**❌ NIE:**
```typescript
// Edge Type manuell setzen ohne Logik
edge.type = 'buttonEdge';

// Edge Type ignorieren
const edge = { source, target }; // Fehlt type!
```

**✅ IMMER:**
```typescript
// useEdgeHandling Hook verwenden
const { handleConnect } = useEdgeHandling({...});

// Edge Type wird automatisch bestimmt:
// 1. Loop Edge (handle-based: 'loop', 'back', 'loop-back')
// 2. Tool Edge (tool → agent tool handle)
// 3. Button Edge (default)
```

**Warum:** Edge Type bestimmt Rendering und Verhalten. Falscher Type = falsches Rendering.

---

### 4. Node Registry - Single Source of Truth

**❌ NIE:**
```typescript
// Node manuell in WorkflowCanvas registrieren
const nodeTypes = {
  'my-node': MyNode,
  // ...
};

// Node-Metadaten hardcoden
if (node.type === 'my-node') {
  // ...
}
```

**✅ IMMER:**
```typescript
// 1. Node in shared/registry.json definieren
// 2. Metadaten in nodeMetadata.ts (oder auto-generiert)
// 3. Component in nodeRegistry.ts registrieren
// 4. Registry lädt automatisch alle Nodes

// Metadaten aus Registry holen
import { getNodeMetadata } from './nodeRegistry/nodeMetadata';
const metadata = getNodeMetadata(nodeType);
```

**Warum:** Registry ist Single Source of Truth. Änderungen an einer Stelle wirken überall.

---

### 5. Tool Nodes - Relative Positionierung

**❌ NIE:**
```typescript
// Tool Nodes im Auto-Layout verschieben
if (isToolNode(node)) {
  // Position ändern - FALSCH!
  node.position = calculatePosition(...);
}

// Tool Position manuell ohne Hook
useEffect(() => {
  // Tool Position direkt ändern - FALSCH!
}, [agentPosition]);
```

**✅ IMMER:**
```typescript
// useAgentToolPositioning Hook verwenden
useAgentToolPositioning({
  nodes,
  edges,
  onNodesChange,
});

// Tool Position wird automatisch relativ zum Agent gehalten
// Auto-Layout überspringt Tool Nodes (siehe LayoutV1.ts)
```

**Warum:** Tools müssen relativ zum Agent bleiben. Auto-Layout würde das zerstören.

---

### 6. Auto-Layout - Tool Nodes ausschließen

**❌ NIE:**
```typescript
// Alle Nodes im Layout verschieben
const layoutedNodes = nodes.map(node => ({
  ...node,
  position: calculatePosition(node),
}));
```

**✅ IMMER:**
```typescript
// Tool Nodes ausschließen (siehe LayoutV1.ts)
const layoutedNodes = nodes.map(node => {
  if (isToolNode(node) || isToolWithRelativePosition(node, edges)) {
    return node; // Position unverändert
  }
  return { ...node, position: calculatePosition(node) };
});
```

**Warum:** Tool Nodes haben relative Position zum Agent. Auto-Layout würde das zerstören.

---

### 7. Animation System

**❌ NIE:**
```typescript
// Alte Animation verwenden
import { useSequentialNodeAnimation } from './hooks/useSequentialNodeAnimation';

// Animation State direkt manipulieren
setCurrentAnimatedNodeId(nodeId);
```

**✅ IMMER:**
```typescript
// Neue vereinfachte Animation verwenden
import { useWorkflowAnimation } from './hooks/useWorkflowAnimation';

const { currentAnimatedNodeId, isNodeAnimating } = useWorkflowAnimation({
  executionSteps,
  isExecuting,
});
```

**Warum:** Neue Animation ist einfacher, wartbarer, keine Race Conditions.

---

### 8. API Calls - Data Sanitization

**❌ NIE:**
```typescript
// Nodes direkt an API senden
await api.put(`/api/workflows/${id}`, { nodes, edges });
```

**✅ IMMER:**
```typescript
// workflowService verwenden (sanitized automatisch)
await workflowService.updateWorkflow(id, {
  nodes: nodes.map(node => ({
    ...node,
    data: typeof node.data === 'string' 
      ? JSON.parse(node.data) 
      : node.data || {},
  })),
});
```

**Warum:** workflowService stellt sicher, dass node.data immer Object ist.

---

## 📋 Node Registry System

### Neuen Node hinzufügen

**Schritt 1: Registry definieren**
```json
// shared/registry.json
{
  "nodes": {
    "my-new-node": {
      "type": "my-new-node",
      "name": "My New Node",
      "icon": "🎯",
      "description": "Does something",
      "category": "utility"
    }
  }
}
```

**Schritt 2: Metadaten (optional, falls nicht auto-generiert)**
```typescript
// frontend/src/components/WorkflowBuilder/nodeRegistry/nodeMetadata.ts
'my-new-node': {
  id: 'my-new-node',
  name: 'My New Node',
  icon: '🎯',
  description: 'Does something',
  category: 'utility',
  component: () => null, // Wird in nodeRegistry.ts gesetzt
  hasConfigForm: true,
  useAutoConfigForm: true, // Auto-generiert Form aus fields
  fields: {
    label: { type: 'text', placeholder: 'Node Label' },
  },
}
```

**Schritt 3: Component registrieren**
```typescript
// frontend/src/components/WorkflowBuilder/nodeRegistry/nodeRegistry.ts
import { MyNewNode } from '../NodeTypes/OptimizedNodes';

const NODE_COMPONENTS: Record<string, ComponentType<any>> = {
  // ...
  'my-new-node': MyNewNode,
};
```

**Schritt 4: Component erstellen**
```typescript
// frontend/src/components/WorkflowBuilder/NodeTypes/MyNewNode.tsx
export function MyNewNode({ data }: BaseNodeProps) {
  return (
    <BaseNode
      label={data.label || 'My New Node'}
      icon="🎯"
      category="utility"
    />
  );
}

// In OptimizedNodes.tsx registrieren
export const MyNewNode = React.memo(MyNewNodeBase, areNodePropsEqual);
```

**✅ WICHTIG:**
- Node erscheint automatisch in UI (durch Registry)
- Auto-Config-Form wird generiert (wenn `useAutoConfigForm: true`)
- Backend muss Node Processor haben (`nodes/myNewNodeProcessor.ts`)

---

## 🔗 Edge System

### Edge Types

1. **Button Edge** (`buttonEdge`) - Standard Edge mit + Button
2. **Loop Edge** (`loopEdge`) - Für While/Foreach Loops
3. **Tool Edge** (`default`) - Für Tool → Agent Verbindungen
4. **Phantom Edge** (`phantomAddButton`) - UI-only, für Nodes ohne Output

### Edge Type Bestimmung (automatisch)

```typescript
// useEdgeHandling.ts bestimmt automatisch:
// 1. Loop Edge: Handle-basiert ('loop', 'back', 'loop-back')
// 2. Tool Edge: Tool Node → Agent Tool Handle
// 3. Button Edge: Alles andere
```

**❌ NIE Edge Type manuell setzen!** Hook macht das automatisch.

### Phantom Edges

**Zweck:** Nodes ohne Output (z.B. End Node) bekommen + Button

**Implementierung:**
```typescript
// Phantom Edge ist UI-only, nicht in edges Array
// Wird in ButtonEdge Component gerendert
const phantomEdge = createPhantomEdge(nodeId, onAddNode);
```

**Wichtig:**
- Phantom Edges haben `source === target` (selber Node)
- React Flow wirft Warnung (erwartet, wird ignoriert)
- Phantom Edges sind NICHT in `edges` Array

### Loop Edges - Spezielle Regeln

**Handle-basierte Erkennung:**
```typescript
// Loop Edges werden anhand von Handles erkannt, nicht Node-Typ
const isLoopEdge = isLoopHandle(sourceHandle) || isLoopHandle(targetHandle);

// Loop Handles:
// - 'loop' (Source: Loop-Node Output)
// - 'back' (Source: Loop-Block zurück zum Loop-Node)
// - 'loop-back' (Target: Loop-Node Input)
```

**Auto-Erstellung von Loop-Back:**
```typescript
// Wenn von Loop-Node zu Loop-Node verbunden wird
// UND targetHandle ist 'back'
// → Auto-Erstellung von Loop-Back Edge
const shouldAutoCreateLoopBack = 
  isConnectingToLoopNode && 
  (isConnectingToBackHandle || (isConnectingFromLoopNode && isNormalOutput));
```

**❌ NIE Loop Edge manuell erstellen!** useEdgeHandling macht das automatisch.

---

## 🎨 Auto-Layout System

### Layout Versionen

- **V1** (default): Horizontal Flow (Left → Right)
- Erweiterbar über `utils/layouts/`

### Wichtige Regeln

1. **Tool Nodes NIE verschieben**
   ```typescript
   // LayoutV1.ts macht das automatisch
   if (isToolNode(node)) {
     return node; // Position unverändert
   }
   ```

2. **Loop Nodes speziell behandeln**
   ```typescript
   // Loop Nodes werden relativ zum Loop-Node positioniert
   if (isInLoop(node)) {
     // Relative Position zum Loop-Node
   }
   ```

3. **Layout nur aufrufen über Hook**
   ```typescript
   const { applyLayout } = useAutoLayout({...});
   // Nicht direkt applyLayout() aufrufen!
   ```

---

## 🎬 Animation System

### Status-basierte Animation

```typescript
// useWorkflowAnimation.ts (NEU, vereinfacht)
const { currentAnimatedNodeId, isNodeAnimating } = useWorkflowAnimation({
  executionSteps, // Wird von SSE Events aktualisiert
  isExecuting,
});
```

### Execution Steps Format

```typescript
interface ExecutionStep {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  // ...
}
```

**Animation läuft automatisch basierend auf Status:**
- `running` → Node animiert
- `completed` → Node grün
- `failed` → Node rot

**❌ NIE manuell Animation State setzen!**

---

## 🔌 API Interaktionen

### Workflow Service

**✅ IMMER workflowService verwenden:**
```typescript
import { workflowService } from '../../services/workflowService';

// Workflow laden
const workflow = await workflowService.getWorkflowById(id);

// Workflow speichern (automatisch sanitized)
await workflowService.updateWorkflow(id, { nodes, edges });

// Node testen
await workflowService.testNode(workflowId, nodeId, input);
```

**Warum:** workflowService stellt sicher, dass:
- `node.data` immer Object ist (nicht String)
- Fehler korrekt behandelt werden
- Response-Format konsistent ist

---

## 🛠️ Custom Hooks

### Hook-Struktur

Alle Hooks sind in `hooks/`:
- `useAutoSave.ts` - Auto-Save mit Debouncing
- `useAutoLayout.ts` - Auto-Layout Logik
- `useNodeOperations.ts` - Node CRUD
- `useEdgeHandling.ts` - Edge Management
- `useWorkflowExecution.ts` - Execution & Publishing
- `useWorkflowAnimation.ts` - Animation (NEU)
- `useAgentToolPositioning.ts` - Tool Positionierung

### Hook-Regeln

1. **Hooks NUR in WorkflowCanvas verwenden**
   ```typescript
   // ✅ RICHTIG
   const { addNode } = useNodeOperations({...});
   
   // ❌ FALSCH - Hook in Komponente
   function MyComponent() {
     const { addNode } = useNodeOperations({...}); // FALSCH!
   }
   ```

2. **Hooks NIE direkt in Node Components**
   ```typescript
   // ❌ FALSCH
   function MyNode({ data }) {
     const { updateNode } = useNodeOperations({...}); // FALSCH!
   }
   
   // ✅ RICHTIG - Props verwenden
   function MyNode({ data, onUpdate }) {
     // onUpdate wird von WorkflowCanvas übergeben
   }
   ```

---

## 🎯 Performance

> **🟡 PRIORITÄT 2 - Performance:** Diese Regeln sollten eingehalten werden für optimale Performance.

### React.memo für Node Components

**✅ IMMER:**
```typescript
// OptimizedNodes.tsx
export const MyNode = React.memo(MyNodeBase, areNodePropsEqual);
```

**Warum:** Verhindert unnötige Re-Renders bei vielen Nodes.

**Performance-Impact:**
- **Ohne memo:** Alle Nodes re-rendern bei jedem State-Update
- **Mit memo:** Nur geänderte Nodes re-rendern
- **Ersparnis:** ~80% weniger Re-Renders bei 50+ Nodes

### useMemo für teure Berechnungen

**✅ IMMER:**
```typescript
const nodeTypes = useMemo(
  () => createNodeTypesMap(isExecuting, executionSteps, ...),
  [isExecuting, executionSteps, ...]
);
```

**Warum:** Verhindert Neuberechnung bei jedem Render.

**Performance-Impact:**
- **Ohne useMemo:** `createNodeTypesMap()` wird bei jedem Render neu berechnet (~50ms)
- **Mit useMemo:** Nur bei Dependency-Änderung (~50ms einmalig)
- **Ersparnis:** ~50ms pro Render bei komplexen Workflows

### useCallback für Event Handlers

**✅ IMMER:**
```typescript
const handleNodeClick = useCallback((event, node) => {
  // ...
}, [dependencies]);
```

**Warum:** Verhindert Neu-Erstellung bei jedem Render.

**Performance-Impact:**
- **Ohne useCallback:** Neue Funktion bei jedem Render → alle Child-Components re-rendern
- **Mit useCallback:** Funktion bleibt gleich → keine unnötigen Re-Renders
- **Ersparnis:** ~30% weniger Re-Renders

### Performance-Grenzwerte

**⚠️ Warnung bei:**
- > 100 Nodes im Workflow → Performance-Probleme möglich
- > 200 Edges → Edge-Rendering kann langsam werden
- > 10 gleichzeitige Animationen → Frame-Drops möglich

**Lösungen:**
- Virtualisierung für große Workflows (TODO)
- Lazy Loading von Node Components
- Debouncing für häufige Updates

---

## 🐛 Debugging & Monitoring

> **🟡 PRIORITÄT 2 - Observability:** Strukturiertes Logging für Debugging und Monitoring.

### Logging

**✅ IMMER strukturiertes Logging:**
```typescript
import { nodeLogger as logger } from '../../../utils/logger';

logger.info('Node added', { nodeId, nodeType, workflowId });
logger.error('Failed to delete node', { error, nodeId, workflowId });
```

**❌ NIE console.log in Production-Code!**

**Log-Level Guidelines:**
- `debug` - Detaillierte Info für Development
- `info` - Wichtige Events (Node added, Workflow saved)
- `warn` - Potenzielle Probleme (Validation warnings)
- `error` - Fehler die behoben werden müssen

### React Flow Errors

**✅ Error Handler:**
```typescript
const handleReactFlowError = useCallback((errorCode, errorMessage) => {
  // Phantom edges ignorieren (erwartet)
  if (errorMessage.includes('phantom')) {
    return;
  }
  logger.error('React Flow error', { errorCode, errorMessage, workflowId });
}, []);
```

### Performance Monitoring

**✅ Wichtige Metriken tracken:**
```typescript
// Render-Performance
const renderStart = performance.now();
// ... render logic
const renderTime = performance.now() - renderStart;
if (renderTime > 16) { // > 1 Frame (60fps)
  logger.warn('Slow render detected', { renderTime, nodeCount: nodes.length });
}
```

**Warnung bei:**
- Render-Zeit > 16ms (60fps)
- Re-Render Count > 10 pro Sekunde
- Memory Usage > 100MB

---

## ✅ Checkliste vor Commit

### 🔴 Kritische Checks (MUSS)
- [ ] `node.data` ist IMMER Object (nicht String)
- [ ] State Updates sind immutable
- [ ] Edge Types werden automatisch bestimmt (useEdgeHandling)
- [ ] Tool Nodes werden NIE im Auto-Layout verschoben
- [ ] Node Grouping berücksichtigt (Agent+Tools, Loops, IfElse)
- [ ] SSE Events aktualisieren executionSteps korrekt
- [ ] Animation verwendet useWorkflowAnimation (nicht useSequentialNodeAnimation)
- [ ] Neue Nodes sind in Registry registriert (wenn neuer Node)
- [ ] API Calls verwenden workflowService

### 🟡 Code Quality (SOLLTE)
- [ ] React.memo für Node Components
- [ ] useMemo/useCallback wo nötig
- [ ] Keine console.log (nur logger)
- [ ] TypeScript-Typen korrekt (keine `any` ohne Grund)
- [ ] Performance-Grenzwerte eingehalten (< 100 Nodes, < 200 Edges)

### 🟢 Testing (EMPFOHLEN)
- [ ] **Unit-Tests:** Alle neuen Funktionen haben Unit-Tests
- [ ] **Integration-Tests:** Komplexe Szenarien haben Integration-Tests
- [ ] **Test-Ausführung:** `pnpm test` muss bestehen
- [ ] **Coverage:** > 80% Coverage für kritische Funktionen
- [ ] Testing-Modus funktioniert (DebugPanel)
- [ ] Full Execution funktioniert
- [ ] Animation läuft korrekt für alle Node-Typen
- [ ] Node Grouping funktioniert (Löschen, Verschieben)
- [ ] Edge Cases getestet (nested loops, tools mit mehreren agents)

---

## 🔗 Node Grouping - Parent-Child-Beziehungen

### Wichtige Gruppierungen

1. **Agent + Tools**
   - Agent ist Parent, Tool-Nodes sind Children
   - Verbindung über `targetHandle: 'tool'` am Agent
   - **Beim Löschen:** Tools werden automatisch mit entfernt (bereits implementiert)
   - **Beim Verschieben:** Tools bleiben relativ zum Agent (useAgentToolPositioning)
   - **Beim Duplizieren:** Tools werden NICHT automatisch mit dupliziert (TODO)

2. **While/Foreach + Loop-Block**
   - Loop-Node ist Parent, Nodes im Loop sind Children
   - Verbindung über `sourceHandle: 'loop'` und `targetHandle: 'back'`
   - **Beim Löschen:** Loop-Block sollte mit entfernt werden (TODO)
   - **Beim Verschieben:** Loop-Block sollte mit verschoben werden (TODO)

3. **IfElse + Branches**
   - IfElse-Node ist Parent, True/False Branches sind Children
   - Verbindung über `targetHandle: 'true'/'false'`
   - **Beim Löschen:** Branches sollten mit entfernt werden (TODO)

### Edge Cases

**❌ NIE:**
```typescript
// Tool-Node löschen, ohne zu prüfen ob es noch andere Agents hat
const toolNodes = findToolNodesConnectedToAgent(edges, agentId, nodes);
// FALSCH: Alle Tools löschen, auch wenn sie mit anderen Agents verbunden sind
```

**✅ IMMER:**
```typescript
// Prüfen, ob Tool nur mit diesem Agent verbunden ist
const toolNodes = findToolNodesConnectedToAgent(edges, agentId, nodes);
// Diese Funktion prüft bereits, ob Tool nur mit diesem Agent verbunden ist
```

**Nested Loops:**
```typescript
// Beim Löschen von äußerem Loop: Auch innere Loops + deren Blocks löschen
// Beim Löschen von innerem Loop: Nur dessen Block löschen
```

---

## 📡 SSE Events & Execution Steps

### Execution Steps Format

```typescript
interface ExecutionStep {
  nodeId: string;
  nodeType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: any;
  output?: any;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}
```

### SSE Event Flow

```typescript
// WorkflowCanvas.tsx empfängt SSE Events
sseConnection.on('node.start', (event) => {
  // Aktualisiere executionSteps
  setDebugSteps(prev => {
    // Finde oder erstelle Step für nodeId
    // Setze status: 'running'
  });
});

sseConnection.on('node.end', (event) => {
  // Aktualisiere executionSteps
  setDebugSteps(prev => {
    // Finde Step für nodeId
    // Setze status: 'completed' oder 'failed'
    // Setze output, duration, etc.
  });
});
```

### Animation basiert auf Execution Steps

**✅ RICHTIG:**
```typescript
// useWorkflowAnimation analysiert executionSteps
const { currentAnimatedNodeId } = useWorkflowAnimation({
  executionSteps, // Wird von SSE Events aktualisiert
  isExecuting,
});

// Animation läuft automatisch basierend auf Status
// - 'running' → Node animiert
// - 'completed' → Node grün
// - 'failed' → Node rot
```

**❌ FALSCH:**
```typescript
// Animation State manuell setzen
setCurrentAnimatedNodeId(nodeId); // FALSCH!
```

**Warum:** Animation muss mit Execution Steps synchronisiert sein. Manuelles Setzen führt zu Race Conditions.

---

## 🧪 Testing vs. Full Execution

### Testing-Modus (DebugPanel)

**Verhalten:**
- Animation startet SOFORT (vor Backend-Call)
- Nur Nodes bis zum getesteten Node werden animiert
- Execution Order wird berechnet: `Start → ... → TestNode`

**Code:**
```typescript
// WorkflowCanvas.tsx
const isExecuting = executing || testingNodeId !== null;

// Animation berechnet Pfad nur bis TestNode
if (testingNodeId) {
  const fullOrder = buildNodeOrderForDebugPanel(nodes, edges);
  const testNodeIndex = fullOrder.findIndex(n => n.id === testingNodeId);
  return fullOrder.slice(0, testNodeIndex + 1);
}
```

### Full Execution-Modus

**Verhalten:**
- Animation folgt SSE Events
- Alle Nodes werden animiert
- Execution Order: Kompletter Workflow

**Code:**
```typescript
// useWorkflowAnimation.ts
// Analysiert alle executionSteps
// Zeigt Status für jeden Node
```

**❌ NIE:** Testing und Full Execution mischen!

---

## 🚨 Häufige Fehler

### 1. Node.data als String

**Symptom:** Backend `InvalidCastException`

**Lösung:**
```typescript
// Beim Laden
if (typeof node.data === 'string') {
  node.data = JSON.parse(node.data);
}

// Beim Speichern (workflowService macht das automatisch)
```

### 2. Tool Nodes werden verschoben

**Symptom:** Tools springen beim Auto-Layout

**Lösung:** LayoutV1.ts überspringt Tool Nodes automatisch

### 3. Edge Type falsch

**Symptom:** Edges rendern falsch

**Lösung:** useEdgeHandling Hook verwenden, nie manuell setzen

### 4. Animation funktioniert nicht

**Symptom:** Nodes animieren nicht während Execution

**Lösung:** useWorkflowAnimation verwenden (NEU), nicht useSequentialNodeAnimation

### 5. Node Grouping ignoriert

**Symptom:** Beim Löschen von Agent bleiben Tools übrig (oder umgekehrt)

**Lösung:** 
- Agent löschen: `findToolNodesConnectedToAgent()` verwenden
- Loop löschen: Loop-Block finden und mit löschen (TODO)
- IfElse löschen: Branches finden und mit löschen (TODO)

### 6. SSE Events nicht synchronisiert

**Symptom:** Animation hängt oder zeigt falschen Status

**Lösung:**
- Execution Steps IMMER über SSE Events aktualisieren
- NIE manuell Status setzen
- useWorkflowAnimation verwendet executionSteps automatisch

### 7. Testing-Animation vs. Full Execution verwechselt

**Symptom:** Animation läuft falsch bei Node-Tests

**Lösung:**
- `testingNodeId` setzen für Testing-Modus
- Execution Order nur bis TestNode berechnen
- Animation startet sofort (vor Backend-Call)

---

## 🎨 Config Panel System

### Auto-Config Forms

**✅ EMPFOHLEN für 80% der Nodes:**
```typescript
// nodeMetadata.ts
'my-node': {
  // ...
  hasConfigForm: true,
  useAutoConfigForm: true, // Auto-generiert Form
  fields: {
    label: { 
      type: 'text', 
      placeholder: 'Node Label',
      required: true,
    },
    instructions: {
      type: 'expression', // Expression Editor Integration
      multiline: true,
      rows: 4,
    },
  },
}
```

**Vorteile:**
- Minimaler Code-Aufwand
- Konsistentes Design
- Automatische Expression Editor Integration
- Automatische VariableTreePopover Integration
- Automatische Debug-Integration

### Custom Config Forms

**Nur für komplexe Nodes:**
```typescript
// nodeMetadata.ts
'complex-node': {
  // ...
  hasConfigForm: true,
  configFormComponent: MyCustomConfigForm, // Custom Component
}
```

**Wann Custom Form:**
- Komplexe Interaktionen
- Spezielle Validierung
- Custom Components nötig

---

## 🔧 Expression Editor Integration

### Fields mit Expression Editor

```typescript
// nodeMetadata.ts
fields: {
  instructions: {
    type: 'expression', // Aktiviert Expression Editor
    multiline: true,
    rows: 4,
  },
}
```

**Features:**
- VariableTreePopover (verfügbare Variablen)
- Syntax-Highlighting
- Auto-Completion
- Validierung

**❌ NIE Expression Editor manuell einbinden!** Auto-Config-Form macht das automatisch.

---

## 🔗 Querverweise zu anderen Rules

- **[Backend Services Rules](../backend-services.md)** - API Interaktionen, Node Data Format
- **[Registry System Rules](../registry-system.md)** - Neue Nodes hinzufügen, Metadaten

---

## 📚 Weitere Ressourcen

- `frontend/src/components/WorkflowBuilder/README.md` - Detaillierte Dokumentation
- `DeveloperRoom/REGISTRY_QUICK_START.md` - Registry-System
- `DeveloperRoom/CONFIG_PANEL_STANDARD.md` - Config-Panel Standards
- `frontend/src/components/WorkflowBuilder/NODE_GROUPING_ANALYSE.md` - Node Grouping Details

---

## 🎓 Entwickler-Workflow

### Neues Feature hinzufügen

1. **Planung:**
   - Welche Nodes/Hooks/Utils sind betroffen?
   - Gibt es Node Grouping zu berücksichtigen?
   - Braucht es neue Edge Types?
   - Welche Tests sind nötig? (Unit + Integration)

2. **Implementierung:**
   - Registry erweitern (wenn neuer Node)
   - Hook erweitern oder neuen erstellen
   - Utils erweitern (wenn Helper-Funktion nötig)
   - TypeScript-Fehler beheben
   - Linter-Fehler beheben
   - Build muss erfolgreich sein

3. **Tests schreiben:**
   - **Unit-Tests:** Für jede Funktion
   - **Integration-Tests:** Für komplexe Szenarien
   - **Real-World-Szenarien:** Für echte Anwendungsfälle
   - Tests müssen selbsterklärend sein (AAA-Pattern)

4. **Test-Ausführung:**
   - `pnpm test` muss bestehen
   - Alle Tests müssen grün sein
   - Coverage prüfen (wenn relevant)

5. **Browser-Testing (wenn nötig):**
   - Nur für visuelle/UX-Features
   - Klare Anweisungen für manuelles Testing
   - Feedback einholen

6. **Code Review:**
   - Checkliste durchgehen
   - Performance prüfen (React.memo, useMemo)
   - Type Safety prüfen
   - Tests prüfen (Coverage, Qualität)

### Test-Struktur

**Verzeichnisstruktur:**
```
src/
├── utils/
│   ├── myUtils.ts
│   └── __tests__/
│       ├── myUtils.test.ts              # Unit-Tests
│       └── myUtils.integration.test.ts  # Integration-Tests
```

**Naming:**
- Test-Dateien: `*.test.ts` oder `*.spec.ts`
- Test-Verzeichnisse: `__tests__/`

**Test-Daten:**
- Meistens: Inline im Test
- Für Hooks: `beforeEach` für Mocks
- Für komplexe Daten: Separates Mock-File

**Siehe auch:**
- `Documentation/TESTING_GUIDE.md` - Test-System Übersicht
- `Documentation/TEST_STRUCTURE.md` - Test-Struktur Details
- `Documentation/DEVELOPMENT_WORKFLOW.md` - Entwicklungs-Workflow

---

## 🧪 Test-System

### Test-Framework

- **Vitest** v2.1.9 - Test-Runner
- **React Testing Library** v16.3.1 - Component-Testing
- **jsdom** v23.2.0 - DOM-Environment

### Test-Befehle

```bash
pnpm test              # Alle Tests ausführen
pnpm test:watch        # Watch-Mode
pnpm test:coverage     # Mit Coverage-Report
pnpm test:ui           # UI-Mode
```

### Test-Strategie

1. **Unit-Tests:** Isolierte Funktionen testen
2. **Integration-Tests:** Funktionen zusammen testen
3. **Real-World-Szenarien:** Komplexe, realistische Workflows testen

### Aktuelle Test-Statistiken

- **Test-Dateien:** 4 (2 Unit + 2 Integration)
- **Tests:** 45 (29 Unit + 16 Integration)
- **Status:** ✅ Alle Tests bestanden

### Wichtige Test-Regeln

- ✅ Jede neue Funktion braucht Tests
- ✅ Integration-Tests für komplexe Szenarien
- ✅ Real-World-Szenarien für echte Anwendungsfälle
- ✅ Tests müssen bestehen bevor wir weitermachen
- ❌ Keine console.log in Tests (nur in Test-Daten)

**Siehe auch:**
- `Documentation/TESTING_GUIDE.md` - Vollständige Test-Dokumentation
- `Documentation/TEST_QUALITY_ANALYSIS.md` - Test-Qualitäts-Analyse
- `Documentation/TEST_STRUCTURE.md` - Test-Struktur Details

---

**Letzte Aktualisierung:** 2024  
**Wichtig:** Diese Rules sind kritisch für System-Stabilität. Bei Unsicherheit: Fragen stellen!

**🎯 Ziel:** Jede Änderung sollte das System besser machen, nicht kaputt. Diese Rules helfen dabei.

**🤝 Workflow:** Implementierung → Tests → Test-Ausführung → Browser-Testing (wenn nötig) → Nächstes Feature

