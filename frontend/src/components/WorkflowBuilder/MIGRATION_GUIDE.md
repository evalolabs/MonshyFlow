# Migration Guide: WorkflowCanvas Refactoring

## 📋 Übersicht

Dieser Guide erklärt die Änderungen zwischen der alten (`WorkflowCanvas.backup.tsx`) und der neuen refactored Version (`WorkflowCanvas.tsx`).

---

## 🎯 Warum wurde refactored?

### Probleme der alten Version:
❌ **1358 Zeilen** - sehr schwer zu warten  
❌ **Exzessives Console-Logging** - unübersichtlich  
❌ **Komplexe Zustandsverwaltung** - viele verschachtelte useEffect/useCallback  
❌ **Keine Trennung von Concerns** - alles in einer Datei  
❌ **Schwierig zu testen** - zu viele Abhängigkeiten  

### Vorteile der neuen Version:
✅ **~400 Zeilen** - 70% kleiner und übersichtlich  
✅ **Strukturiertes Logging** - Logger-Utility mit Levels  
✅ **Custom Hooks** - Logik in wiederverwendbare Hooks  
✅ **Helper-Funktionen** - Utils für Node/Edge-Operationen  
✅ **Konstanten zentral** - Einfach zu ändern  
✅ **Performance-optimiert** - React.memo und useMemo  
✅ **Gut dokumentiert** - README und Type-Definitionen  

---

## 🔄 Hauptänderungen

### 1. Extraktion in Custom Hooks

| **Alt (in WorkflowCanvas.tsx)**        | **Neu (Custom Hook)**                  |
|----------------------------------------|----------------------------------------|
| Auto-Save Logik (100+ Zeilen)         | `useAutoSave` Hook                     |
| Auto-Layout Logik (80+ Zeilen)        | `useAutoLayout` Hook                   |
| Node Operations (200+ Zeilen)         | `useNodeOperations` Hook               |
| Edge Handling (150+ Zeilen)           | `useEdgeHandling` Hook                 |
| Node Selector (300+ Zeilen)           | `useNodeSelector` Hook                 |
| Phantom Edges (100+ Zeilen)           | `usePhantomEdges` Hook                 |
| Workflow Execution (150+ Zeilen)      | `useWorkflowExecution` Hook            |

---

### 2. Helper-Funktionen ausgelagert

#### **Alt:**
```typescript
// Direkt in WorkflowCanvas.tsx
const hasStartNode = nodes.some(node => node.type === 'start');

const newNodeId = `${type}-${Date.now()}`;

const position = {
  x: (sourceNode.position.x + targetNode.position.x) / 2 - 75,
  y: (sourceNode.position.y + targetNode.position.y) / 2 - 50,
};
```

#### **Neu:**
```typescript
// In utils/nodeUtils.ts
import { hasStartNode, generateNodeId, calculateMidpoint } from '@/utils/nodeUtils';

const hasStart = hasStartNode(nodes);
const newNodeId = generateNodeId(type);
const position = calculateMidpoint(sourceNode, targetNode);
```

---

### 3. Konstanten zentral

#### **Alt:**
```typescript
// Hardcoded überall im Code
const VERTICAL_SPACING = 150;
setTimeout(() => autoSave(), 2000);
if (node.type === 'start') { ... }
alert('⚠️ Es kann nur EINEN Start Node geben!');
```

#### **Neu:**
```typescript
// In constants.ts
import {
  VERTICAL_SPACING,
  AUTO_SAVE_DELAY,
  NODE_TYPE_START,
  VALIDATION_MESSAGES,
} from './constants';

setTimeout(() => autoSave(), AUTO_SAVE_DELAY);
if (node.type === NODE_TYPE_START) { ... }
alert(VALIDATION_MESSAGES.MULTIPLE_START_NODES);
```

---

### 4. Logging strukturiert

#### **Alt:**
```typescript
console.log('🚨🚨🚨 [onAddNode] CALLED WITH TYPE:', type);
console.log('   ✅ Edge found:', edge);
console.error('❌ Failed to delete node:', error);
```

#### **Neu:**
```typescript
import { nodeLogger, edgeLogger } from '@/utils/logger';

nodeLogger.info('Adding node', { type });
edgeLogger.debug('Edge found', { edge });
nodeLogger.error('Failed to delete node', error);
```

**Vorteil:** Kann in Production deaktiviert werden!

---

### 5. Performance-Optimierung

#### **Alt:**
```typescript
// Keine Memoization - alle Nodes re-rendern bei jeder Änderung
const nodeTypes = {
  start: StartNode,
  end: EndNode,
  // ...
};
```

#### **Neu:**
```typescript
// React.memo verhindert unnötige Re-Renders
import { StartNode, EndNode } from './NodeTypes/OptimizedNodes';

// Nodes re-rendern nur wenn sich ihre Props ändern
```

---

## 📦 Neue Dateien

### Hooks
- `hooks/useAutoSave.ts`
- `hooks/useAutoLayout.ts`
- `hooks/usePhantomEdges.ts`
- `hooks/useNodeOperations.ts`
- `hooks/useEdgeHandling.ts`
- `hooks/useNodeSelector.ts`
- `hooks/useWorkflowExecution.ts`
- `hooks/index.ts` (Export alle Hooks)

### Utils
- `utils/logger.ts`
- `utils/nodeUtils.ts`
- `utils/edgeUtils.ts`

### Andere
- `constants.ts`
- `NodeTypes/OptimizedNodes.tsx`
- `README.md`
- `MIGRATION_GUIDE.md` (diese Datei)

---

## 🔧 Code Migration

### Beispiel 1: Node hinzufügen

#### **Alt:**
```typescript
const onAddNode = useCallback((type: string) => {
  console.log('🚨🚨🚨 [onAddNode] CALLED WITH TYPE:', type);
  
  if (type === 'start') {
    setNodes((currentNodes) => {
      const hasStartNode = currentNodes.some(node => node.type === 'start');
      if (hasStartNode) {
        alert('⚠️ Es kann nur EINEN Start Node geben!');
        return currentNodes;
      }
      
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        },
        data: { label: type.charAt(0).toUpperCase() + type.slice(1) },
      };
      
      return [...currentNodes, newNode];
    });
    return;
  }
  
  // ... mehr Code für andere Node-Typen
}, [setNodes]);
```

#### **Neu:**
```typescript
// In Hook: useNodeOperations.ts
const addNode = useCallback((type: string) => {
  logger.info('Adding node', { type });

  if (type === 'start' && hasStartNode(nodes)) {
    alert(VALIDATION_MESSAGES.MULTIPLE_START_NODES);
    return null;
  }

  const newNode = createNode(type);
  onNodesChange([...nodes, newNode]);
  
  return newNode;
}, [nodes, onNodesChange]);

// In WorkflowCanvas.tsx
const { addNode } = useNodeOperations({ ... });
```

---

### Beispiel 2: Edge erstellen

#### **Alt:**
```typescript
const onConnect = useCallback((connection: Connection) => {
  console.log('🔗 [MANUAL CONNECTION]');
  
  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);
  
  let isLoopBack = targetNode?.type === 'while' && connection.targetHandle === 'loop-back';
  const isGoingBackwards = sourceNode && targetNode && targetNode.position.y < sourceNode.position.y;
  
  const edgeType = (isLoopBack || isGoingBackwards) ? 'loopEdge' : 'buttonEdge';
  
  // ... viel mehr Code
  
  setEdges((eds) => addEdge(newEdge, eds));
}, [setEdges, nodes]);
```

#### **Neu:**
```typescript
// In Hook: useEdgeHandling.ts
const handleConnect = useCallback((connection: Connection) => {
  logger.info('Manual connection created', { connection });

  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);

  const isLoopEdge = shouldBeLoopEdge(connection, sourceNode, targetNode);
  const targetHandle = getWhileNodeTargetHandle(connection, targetNode, isLoopEdge);

  const newEdge = createButtonEdge(
    connection.source!,
    connection.target!,
    onAddNodeCallback,
    connection.sourceHandle,
    targetHandle
  );
  
  onEdgesChange([...edges, newEdge]);
}, [nodes, edges, onEdgesChange]);

// In WorkflowCanvas.tsx
const { handleConnect } = useEdgeHandling({ ... });
```

---

## 🧪 Testing

### Alt
```typescript
// Schwer zu testen - alles in einer Komponente
// Mock für WorkflowCanvas benötigt alle Dependencies
```

### Neu
```typescript
// Einfach zu testen - jeder Hook isoliert
import { renderHook } from '@testing-library/react-hooks';
import { useNodeOperations } from './hooks/useNodeOperations';

test('should add node', () => {
  const { result } = renderHook(() => useNodeOperations({ ... }));
  result.current.addNode('llm');
  // assertions...
});
```

---

## 🚀 Deployment

### Alte Version behalten?

Die alte Version wurde gesichert als `WorkflowCanvas.backup.tsx`. 

**Falls Rollback nötig:**
```powershell
Copy-Item WorkflowCanvas.backup.tsx WorkflowCanvas.tsx -Force
```

**Aber:** Die neue Version ist abwärtskompatibel und sollte keine Breaking Changes haben!

---

## ✅ Checkliste für Migration

Falls du eigenen Code auf Basis der alten WorkflowCanvas hast:

- [ ] Console.logs durch Logger ersetzen
- [ ] Hardcoded Konstanten durch Imports ersetzen
- [ ] Duplizierte Node/Edge-Logik durch Utils ersetzen
- [ ] Große useEffect/useCallback in Custom Hooks auslagern
- [ ] Performance mit React.memo verbessern
- [ ] README lesen und Best Practices befolgen

---

## 📚 Weitere Ressourcen

- [README.md](./README.md) - Vollständige Dokumentation
- [constants.ts](./constants.ts) - Alle Konstanten
- [hooks/](./hooks/) - Custom Hooks mit JSDoc
- [utils/](../../utils/) - Helper-Funktionen

---

**Bei Fragen:** Schaue in den Code - er ist jetzt viel lesbarer! 🎉


