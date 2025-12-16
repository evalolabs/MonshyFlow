# Vorschläge: Node-Gruppierung für Move, Copy-Paste und Auto-Layout

## Übersicht

Das System benötigt erweiterte Funktionalitäten für Node-Gruppierungen, damit bei Operationen wie Verschieben, Kopieren und Duplizieren auch die Child-Nodes entsprechend behandelt werden. Auto-Layout sollte diese Gruppierungen berücksichtigen.

## Aktueller Status

### ✅ Bereits implementiert:
- **Agent + Tools**: Löschen funktioniert (Tool-Nodes werden mit entfernt)
- **Agent + Tools**: Verschieben funktioniert teilweise (`useAgentToolPositioning`)

### ❌ Fehlend:
- **Copy-Paste**: Komplett fehlend im System
- **Duplizieren mit Children**: Aktuell werden nur einzelne Nodes dupliziert
- **Gruppiertes Verschieben**: Nur Agent+Tools funktioniert, andere Gruppierungen nicht
- **Auto-Layout für Gruppen**: Berücksichtigt keine Gruppierungen

---

## 1. Erweiterte Node-Gruppierung für Verschieben

### Problem
Aktuell funktioniert das Verschieben nur für Agent+Tools. Andere Gruppierungen (While/ForEach Loops, IfElse Branches) werden nicht berücksichtigt.

### Lösung: Generischer `useNodeGrouping` Hook

**Neue Datei:** `frontend/src/components/WorkflowBuilder/hooks/useNodeGrouping.ts`

```typescript
/**
 * useNodeGrouping Hook
 * 
 * Generischer Hook für alle Node-Gruppierungen:
 * - Agent + Tools
 * - While/ForEach + Loop-Block
 * - IfElse + Branches
 * 
 * Behandelt Verschieben, Kopieren und Duplizieren von Parent-Nodes mit ihren Children.
 */

import { useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { findToolNodesConnectedToAgent } from '../../../utils/edgeUtils';
import { findLoopBlockNodes, findBranchNodes } from '../../../utils/nodeGroupingUtils';

interface UseNodeGroupingProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
}

/**
 * Findet alle Child-Nodes eines Parent-Nodes
 */
function findAllChildNodes(
  parentNodeId: string,
  parentNodeType: string | undefined,
  edges: Edge[],
  nodes: Node[]
): string[] {
  const childIds: string[] = [];
  
  switch (parentNodeType) {
    case 'agent':
      // Tool-Nodes über 'tool' handle
      childIds.push(...findToolNodesConnectedToAgent(edges, parentNodeId, nodes));
      break;
      
    case 'while':
    case 'forEach':
      // Loop-Block Nodes
      childIds.push(...findLoopBlockNodes(parentNodeId, edges, nodes));
      break;
      
    case 'ifElse':
      // True und False Branch Nodes
      const trueBranch = findBranchNodes(parentNodeId, 'true', edges, nodes);
      const falseBranch = findBranchNodes(parentNodeId, 'false', edges, nodes);
      childIds.push(...trueBranch, ...falseBranch);
      break;
  }
  
  return childIds;
}

export function useNodeGrouping({
  nodes,
  edges,
  onNodesChange,
}: UseNodeGroupingProps) {
  const previousPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const relativePositionsRef = useRef<Map<string, Map<string, { x: number; y: number }>>>(new Map());

  useEffect(() => {
    // Finde alle Parent-Nodes (Agent, While, ForEach, IfElse)
    const parentNodes = nodes.filter(node => 
      node.type === 'agent' || 
      node.type === 'while' || 
      node.type === 'forEach' || 
      node.type === 'ifElse'
    );

    const movedParents: Array<{
      node: Node;
      deltaX: number;
      deltaY: number;
      childIds: string[];
    }> = [];

    // Track welche Parent-Nodes verschoben wurden
    for (const parentNode of parentNodes) {
      const previousPos = previousPositionsRef.current.get(parentNode.id);
      const currentPos = parentNode.position;

      if (previousPos) {
        const deltaX = currentPos.x - previousPos.x;
        const deltaY = currentPos.y - previousPos.y;

        // Wenn Parent verschoben wurde (mehr als 1px für Floating-Point-Präzision)
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          const childIds = findAllChildNodes(parentNode.id, parentNode.type, edges, nodes);
          movedParents.push({ node: parentNode, deltaX, deltaY, childIds });
        }
      }

      // Speichere aktuelle Position
      previousPositionsRef.current.set(parentNode.id, { ...currentPos });
    }

    // Wenn Parent-Nodes verschoben wurden, verschiebe auch ihre Children
    if (movedParents.length > 0) {
      const updatedNodes = nodes.map(node => {
        // Prüfe ob dieser Node ein Child eines verschobenen Parents ist
        for (const { deltaX, deltaY, childIds } of movedParents) {
          if (childIds.includes(node.id)) {
            // Verschiebe Child um gleichen Delta
            return {
              ...node,
              position: {
                x: node.position.x + deltaX,
                y: node.position.y + deltaY,
              },
            };
          }
        }
        return node;
      });

      onNodesChange(updatedNodes);
    }

    // Speichere relative Positionen für alle Child-Nodes (falls noch nicht gespeichert)
    // Dies ermöglicht späteres manuelles Verschieben von Children
    for (const parentNode of parentNodes) {
      const childIds = findAllChildNodes(parentNode.id, parentNode.type, edges, nodes);
      
      if (!relativePositionsRef.current.has(parentNode.id)) {
        relativePositionsRef.current.set(parentNode.id, new Map());
      }
      
      const relativePosMap = relativePositionsRef.current.get(parentNode.id)!;
      
      for (const childId of childIds) {
        if (!relativePosMap.has(childId)) {
          const childNode = nodes.find(n => n.id === childId);
          if (childNode) {
            const relativePos = {
              x: childNode.position.x - parentNode.position.x,
              y: childNode.position.y - parentNode.position.y,
            };
            relativePosMap.set(childId, relativePos);
          }
        }
      }
    }
  }, [nodes, edges, onNodesChange]);
}
```

### Integration
- Ersetze `useAgentToolPositioning` durch `useNodeGrouping` in `WorkflowCanvas.tsx`
- Oder verwende beide parallel (useNodeGrouping als Erweiterung)

---

## 2. Copy-Paste Funktionalität

### Problem
Es gibt keine Copy-Paste-Funktionalität im System. Benutzer können Nodes nicht kopieren und an anderer Stelle einfügen.

### Lösung: Clipboard-System mit Gruppierung

**Neue Datei:** `frontend/src/components/WorkflowBuilder/hooks/useClipboard.ts`

```typescript
/**
 * useClipboard Hook
 * 
 * Implementiert Copy-Paste für Nodes mit Gruppierung.
 * Unterstützt:
 * - Einzelne Nodes
 * - Parent-Nodes mit ihren Children
 * - Multi-Select
 */

import { useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { generateNodeId } from '../../../utils/nodeUtils';
import { findAllChildNodes } from './useNodeGrouping';

interface ClipboardData {
  nodes: Node[];
  edges: Edge[];
  offset: { x: number; y: number };
}

export function useClipboard({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
}) {
  const clipboardRef = useRef<ClipboardData | null>(null);

  /**
   * Kopiert ausgewählte Nodes (inkl. Children) in die Zwischenablage
   */
  const copyNodes = useCallback((selectedNodeIds: string[]) => {
    if (selectedNodeIds.length === 0) return;

    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    
    // Finde alle Child-Nodes für Parent-Nodes
    const allNodeIds = new Set<string>(selectedNodeIds);
    for (const node of selectedNodes) {
      if (node.type === 'agent' || node.type === 'while' || 
          node.type === 'forEach' || node.type === 'ifElse') {
        const childIds = findAllChildNodes(node.id, node.type, edges, nodes);
        childIds.forEach(id => allNodeIds.add(id));
      }
    }

    const nodesToCopy = nodes.filter(n => allNodeIds.has(n.id));
    
    // Finde alle Edges zwischen kopierten Nodes
    const edgesToCopy = edges.filter(e => 
      allNodeIds.has(e.source) && allNodeIds.has(e.target)
    );

    // Berechne Offset (Position des ersten Nodes)
    const firstNode = nodesToCopy[0];
    const offset = firstNode ? { x: firstNode.position.x, y: firstNode.position.y } : { x: 0, y: 0 };

    clipboardRef.current = {
      nodes: nodesToCopy,
      edges: edgesToCopy,
      offset,
    };

    console.log(`[Clipboard] Copied ${nodesToCopy.length} nodes and ${edgesToCopy.length} edges`);
  }, [nodes, edges]);

  /**
   * Fügt kopierte Nodes an der Mausposition ein
   */
  const pasteNodes = useCallback((pastePosition: { x: number; y: number }) => {
    if (!clipboardRef.current) return;

    const { nodes: nodesToPaste, edges: edgesToPaste, offset } = clipboardRef.current;

    // Erstelle ID-Mapping für neue Nodes
    const idMapping = new Map<string, string>();
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Berechne Delta zwischen Original-Offset und Paste-Position
    const deltaX = pastePosition.x - offset.x;
    const deltaY = pastePosition.y - offset.y;

    // Erstelle neue Nodes mit neuen IDs
    for (const node of nodesToPaste) {
      const newNodeId = generateNodeId(node.type || 'node');
      idMapping.set(node.id, newNodeId);

      const newNode: Node = {
        ...node,
        id: newNodeId,
        position: {
          x: node.position.x + deltaX + 100, // +100 für visuellen Offset
          y: node.position.y + deltaY + 100,
        },
        selected: true,
        data: {
          ...node.data,
          label: `${node.data?.label || node.type} (Copy)`,
        },
      };

      newNodes.push(newNode);
    }

    // Erstelle neue Edges mit neuen IDs
    for (const edge of edgesToPaste) {
      const newSourceId = idMapping.get(edge.source);
      const newTargetId = idMapping.get(edge.target);

      if (newSourceId && newTargetId) {
        newEdges.push({
          ...edge,
          id: `${newSourceId}-${newTargetId}`,
          source: newSourceId,
          target: newTargetId,
        });
      }
    }

    // Deselect alle anderen Nodes
    const updatedNodes = nodes.map(n => ({ ...n, selected: false }));
    
    // Füge neue Nodes hinzu
    onNodesChange([...updatedNodes, ...newNodes]);
    onEdgesChange([...edges, ...newEdges]);

    console.log(`[Clipboard] Pasted ${newNodes.length} nodes and ${newEdges.length} edges`);
  }, [nodes, edges, onNodesChange, onEdgesChange]);

  /**
   * Prüft ob Clipboard Daten vorhanden sind
   */
  const hasClipboardData = useCallback(() => {
    return clipboardRef.current !== null;
  }, []);

  return {
    copyNodes,
    pasteNodes,
    hasClipboardData,
  };
}
```

### Keyboard Shortcuts Integration

**In `WorkflowCanvas.tsx` oder `ResizableWorkflowLayout.tsx`:**

```typescript
// Keyboard shortcuts für Copy-Paste
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl+C / Cmd+C
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      const selectedNodes = nodes.filter(n => n.selected);
      if (selectedNodes.length > 0) {
        event.preventDefault();
        copyNodes(selectedNodes.map(n => n.id));
      }
    }
    
    // Ctrl+V / Cmd+V
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      if (hasClipboardData()) {
        event.preventDefault();
        // Paste an aktueller Mausposition oder Canvas-Mitte
        const pastePosition = { x: 400, y: 300 }; // TODO: Mausposition verwenden
        pasteNodes(pastePosition);
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [copyNodes, pasteNodes, hasClipboardData, nodes]);
```

---

## 3. Erweiterte Duplicate-Funktion mit Children

### Problem
Aktuell dupliziert `duplicateNode` nur einzelne Nodes. Child-Nodes werden nicht mit dupliziert.

### Lösung: Erweitere `duplicateNode` in `useNodeOperations.ts`

```typescript
// Duplicate a node with its children
const duplicateNode = useCallback((node: Node) => {
  logger.info(`Duplicating node: ${node.id}`);

  if (!canBeDuplicated(node.type || '')) {
    alert(VALIDATION_MESSAGES.CANNOT_DUPLICATE_START);
    logger.warn('Prevented duplicating Start node');
    return;
  }

  // Finde alle Child-Nodes
  const childIds = findAllChildNodes(node.id, node.type, edges, nodes);
  const allNodeIds = [node.id, ...childIds];
  const nodesToDuplicate = nodes.filter(n => allNodeIds.includes(n.id));

  // Erstelle ID-Mapping
  const idMapping = new Map<string, string>();
  const newNodes: Node[] = [];
  const newEdges: Edge[] = [];

  // Dupliziere alle Nodes
  for (const nodeToDup of nodesToDuplicate) {
    const newNodeId = generateNodeId(nodeToDup.type || 'node');
    idMapping.set(nodeToDup.id, newNodeId);

    const newNode: Node = {
      ...nodeToDup,
      id: newNodeId,
      position: {
        x: nodeToDup.position.x + 200,
        y: nodeToDup.position.y + 100,
      },
      selected: nodeToDup.id === node.id, // Nur Parent-Node ist selected
      data: {
        ...nodeToDup.data,
        label: `${nodeToDup.data?.label || nodeToDup.type} (Copy)`,
      },
    };

    newNodes.push(newNode);
  }

  // Dupliziere Edges zwischen duplizierten Nodes
  const edgesToDuplicate = edges.filter(e => 
    allNodeIds.includes(e.source) && allNodeIds.includes(e.target)
  );

  for (const edge of edgesToDuplicate) {
    const newSourceId = idMapping.get(edge.source);
    const newTargetId = idMapping.get(edge.target);

    if (newSourceId && newTargetId) {
      newEdges.push({
        ...edge,
        id: generateEdgeId(newSourceId, newTargetId),
        source: newSourceId,
        target: newTargetId,
      });
    }
  }

  // Deselect alle anderen Nodes und füge neue hinzu
  const updatedNodes = nodes.map(n => ({ ...n, selected: false }));
  onNodesChange([...updatedNodes, ...newNodes]);
  onEdgesChange([...edges, ...newEdges]);

  logger.info(`Node duplicated with ${childIds.length} children: ${newNodes[0].id}`);
}, [nodes, edges, onNodesChange, onEdgesChange]);
```

---

## 4. Utility-Funktionen für Node-Gruppierung

### Neue Datei: `frontend/src/utils/nodeGroupingUtils.ts`

```typescript
/**
 * Node Grouping Utility Functions
 * 
 * Hilfsfunktionen zum Finden von Child-Nodes in verschiedenen Gruppierungen.
 */

import type { Node, Edge } from '@xyflow/react';
import { LOOP_HANDLE_IDS } from '../components/WorkflowBuilder/constants';

/**
 * Findet alle Nodes in einem Loop-Block (While/ForEach)
 */
export function findLoopBlockNodes(
  loopNodeId: string,
  edges: Edge[],
  nodes: Node[]
): string[] {
  const blockNodeIds = new Set<string>();
  
  // Finde Edge mit sourceHandle='loop' vom Loop-Node
  const loopEdge = edges.find(e => 
    e.source === loopNodeId && 
    (e.sourceHandle === 'loop' || e.sourceHandle === LOOP_HANDLE_IDS.LOOP)
  );
  
  if (!loopEdge) return [];
  
  // Folge allen Edges bis zum 'back' handle
  const visited = new Set<string>();
  const queue = [loopEdge.target];
  
  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);
    
    // Stoppe wenn wir zurück zum Loop-Node gehen
    const backEdge = edges.find(e => 
      e.source === currentNodeId && 
      e.target === loopNodeId &&
      (e.targetHandle === 'back' || e.targetHandle === LOOP_HANDLE_IDS.LOOP_BACK)
    );
    
    if (backEdge) {
      // Wir haben den Loop-Block durchlaufen
      blockNodeIds.add(currentNodeId);
      break;
    }
    
    blockNodeIds.add(currentNodeId);
    
    // Folge allen ausgehenden Edges
    const outgoingEdges = edges.filter(e => e.source === currentNodeId);
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }
  
  return Array.from(blockNodeIds);
}

/**
 * Findet alle Nodes in einem IfElse-Branch
 */
export function findBranchNodes(
  ifElseNodeId: string,
  branchHandle: 'true' | 'false',
  edges: Edge[],
  nodes: Node[]
): string[] {
  const branchNodeIds = new Set<string>();
  
  // Finde Edge mit sourceHandle=branchHandle vom IfElse-Node
  const branchEdge = edges.find(e => 
    e.source === ifElseNodeId && 
    e.sourceHandle === branchHandle
  );
  
  if (!branchEdge) return [];
  
  // Folge allen Edges im Branch
  const visited = new Set<string>();
  const queue = [branchEdge.target];
  
  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);
    
    branchNodeIds.add(currentNodeId);
    
    // Prüfe ob dieser Node ein Merge-Node ist (hat Inputs von beiden Branches)
    const incomingEdges = edges.filter(e => e.target === currentNodeId);
    const hasTrueBranchInput = incomingEdges.some(e => 
      e.source === ifElseNodeId && e.sourceHandle === 'true'
    );
    const hasFalseBranchInput = incomingEdges.some(e => 
      e.source === ifElseNodeId && e.sourceHandle === 'false'
    );
    
    // Wenn Merge-Node erreicht, stoppe
    if (hasTrueBranchInput && hasFalseBranchInput) {
      break;
    }
    
    // Folge allen ausgehenden Edges
    const outgoingEdges = edges.filter(e => e.source === currentNodeId);
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }
  
  return Array.from(branchNodeIds);
}

/**
 * Findet alle Child-Nodes eines Parent-Nodes (generisch)
 */
export function findAllChildNodes(
  parentNodeId: string,
  parentNodeType: string | undefined,
  edges: Edge[],
  nodes: Node[]
): string[] {
  switch (parentNodeType) {
    case 'agent':
      // Wird bereits in edgeUtils.ts implementiert
      const { findToolNodesConnectedToAgent } = require('./edgeUtils');
      return findToolNodesConnectedToAgent(edges, parentNodeId, nodes);
      
    case 'while':
    case 'forEach':
      return findLoopBlockNodes(parentNodeId, edges, nodes);
      
    case 'ifElse':
      const trueBranch = findBranchNodes(parentNodeId, 'true', edges, nodes);
      const falseBranch = findBranchNodes(parentNodeId, 'false', edges, nodes);
      return [...trueBranch, ...falseBranch];
      
    default:
      return [];
  }
}
```

---

## 5. Auto-Layout für Gruppierungen

### Problem
Auto-Layout berücksichtigt keine Gruppierungen. Parent-Nodes und ihre Children sollten als Einheit behandelt werden.

### Lösung: Erweitere `useAutoLayout` Hook

**In `frontend/src/components/WorkflowBuilder/hooks/useAutoLayout.ts`:**

```typescript
/**
 * Erweiterte Layout-Berechnung mit Gruppierung
 */
function calculateGroupedLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): Node[] {
  // 1. Identifiziere Parent-Nodes und ihre Children
  const parentNodes = nodes.filter(n => 
    n.type === 'agent' || n.type === 'while' || 
    n.type === 'forEach' || n.type === 'ifElse'
  );
  
  const nodeGroups = new Map<string, string[]>();
  
  for (const parent of parentNodes) {
    const childIds = findAllChildNodes(parent.id, parent.type, edges, nodes);
    nodeGroups.set(parent.id, childIds);
  }
  
  // 2. Berechne Layout für Parent-Nodes (ohne Children)
  const parentOnlyNodes = nodes.filter(n => 
    !Array.from(nodeGroups.values()).flat().includes(n.id)
  );
  
  const parentLayout = calculateStandardLayout(parentOnlyNodes, edges, direction);
  
  // 3. Positioniere Children relativ zu ihren Parents
  const layoutedNodes = [...parentLayout];
  
  for (const [parentId, childIds] of nodeGroups.entries()) {
    const parentNode = layoutedNodes.find(n => n.id === parentId);
    if (!parentNode) continue;
    
    // Positioniere Children in einem Cluster um den Parent
    const childNodes = nodes.filter(n => childIds.includes(n.id));
    const clusterSpacing = 150;
    const startX = parentNode.position.x;
    const startY = parentNode.position.y + 200; // Unter dem Parent
    
    childNodes.forEach((child, index) => {
      const childLayout = layoutedNodes.find(n => n.id === child.id);
      if (childLayout) {
        childLayout.position = {
          x: startX + (index % 3) * clusterSpacing,
          y: startY + Math.floor(index / 3) * clusterSpacing,
        };
      }
    });
  }
  
  return layoutedNodes;
}
```

---

## 6. UI-Feedback für Gruppierungen

### Visuelle Gruppierung
- Zeige einen Rahmen um Parent + Children beim Hover
- Highlight alle Children wenn Parent ausgewählt wird
- Multi-Select beim Verschieben von Parent-Nodes

### Context Menu Erweiterung
- "Copy with Children" Option
- "Duplicate with Children" Option
- "Select Group" Option

---

## Implementierungsreihenfolge

1. **Phase 1: Utility-Funktionen** (1-2 Tage)
   - Erstelle `nodeGroupingUtils.ts`
   - Implementiere `findLoopBlockNodes`, `findBranchNodes`
   - Tests schreiben

2. **Phase 2: Erweiterte Gruppierung** (2-3 Tage)
   - Erstelle `useNodeGrouping` Hook
   - Ersetze/erweitere `useAgentToolPositioning`
   - Teste mit verschiedenen Node-Typen

3. **Phase 3: Copy-Paste** (2-3 Tage)
   - Implementiere `useClipboard` Hook
   - Keyboard Shortcuts hinzufügen
   - UI-Integration (Context Menu, Toolbar)

4. **Phase 4: Erweiterte Duplicate** (1-2 Tage)
   - Erweitere `duplicateNode` in `useNodeOperations`
   - Teste mit allen Gruppierungen

5. **Phase 5: Auto-Layout** (2-3 Tage)
   - Erweitere `useAutoLayout` für Gruppierungen
   - Teste Layout-Qualität

6. **Phase 6: UI-Feedback** (1-2 Tage)
   - Visuelle Gruppierung
   - Context Menu Erweiterungen

**Gesamt: ~10-15 Tage**

---

## Edge Cases zu beachten

1. **Nested Gruppierungen**: While-Loop in IfElse-Branch
2. **Shared Children**: Tool-Node mit mehreren Agents
3. **Merge Nodes**: IfElse-Branches die zu gemeinsamem Node führen
4. **Zirkuläre Abhängigkeiten**: Verhindern bei Copy-Paste

---

## Vorteile dieser Lösung

✅ **Konsistenz**: Einheitliche Behandlung aller Gruppierungen  
✅ **Wiederverwendbarkeit**: Utility-Funktionen für verschiedene Operationen  
✅ **Erweiterbarkeit**: Einfach neue Gruppierungen hinzufügen  
✅ **Benutzerfreundlichkeit**: Intuitive Copy-Paste und Duplicate-Funktionen  
✅ **Auto-Layout**: Bessere Layouts durch Gruppierungsbewusstsein

