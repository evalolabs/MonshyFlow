# Testing im Animation System

## 🎯 Übersicht

Das Animation System unterstützt **zwei Modi**:

1. **Full Workflow Execution** - Animiert alle Nodes im Workflow
2. **Node Testing** - Animiert nur den Pfad von Start bis zum getesteten Node

---

## 🔄 Test-Flow

### 1. User klickt "Play" Button im DebugPanel

```
DebugPanel
  ↓ handlePlayNode()
  ↓ onTestStart(nodeId, step)
  ↓
WorkflowCanvas.handleDebugTestStart()
  ↓
setTestingNodeId(nodeId)  ← WICHTIG: Startet Animation sofort!
```

### 2. Animation startet SOFORT (vor Backend-Call)

**Warum sofort?**
- Bessere UX: User sieht sofort Feedback
- Animation läuft parallel zum Backend-Call
- Keine Verzögerung durch Netzwerk-Latenz

### 3. Execution Order wird berechnet

```typescript
if (testingNodeId) {
  // Berechne Pfad von Start bis zum getesteten Node
  const fullOrder = buildNodeOrderForDebugPanel(nodes, edges);
  const testNodeIndex = fullOrder.findIndex(n => n.id === testingNodeId);
  
  // Nur Nodes bis zum getesteten Node animieren
  return fullOrder.slice(0, testNodeIndex + 1);
}
```

**Beispiel:**
```
Workflow: Start → Node1 → Node2 → Node3 → Node4
Test Node: Node3

Execution Order für Animation:
  [Start, Node1, Node2, Node3]  ← Nur bis Node3!
```

### 4. Animation läuft sequenziell

```
Start (fast, 200ms)
  ↓
Node1 (slow, wartet auf node.start → node.end)
  ↓
Node2 (fast, 200ms)
  ↓
Node3 (slow, wartet auf node.start → node.end) ← Getesteter Node
  ↓
STOPP ← Animation stoppt hier!
```

### 5. Backend-Call läuft parallel

```
Frontend: Animation startet
  ↓
Backend: testNodeWithContext() wird aufgerufen
  ↓
Backend: Führt Workflow aus (Start → Node3)
  ↓
Backend: Sendet SSE Events (node.start, node.end)
  ↓
Frontend: Empfängt Events, synchronisiert Animation
  ↓
Backend: Gibt Result zurück
  ↓
Frontend: handleDebugTestResult() → setTestingNodeId(null)
```

---

## 🎬 Animation-Verhalten bei Tests

### Fast Nodes (Start, End, Transform)

```typescript
// Fast Node Animation
1. Node wird animiert (200ms)
2. Timeout läuft ab
3. Prüfe: Ist das der getestete Node?
   - JA → Animation stoppt
   - NEIN → Weiter zum nächsten Node
```

**Code:**
```typescript
if (isTestedNode) {
  // Stoppe Animation - getesteter Node erreicht
  setAnimationState({
    currentAnimatedNodeId: null,
    waitingForEvent: false,
  });
} else {
  moveToNextNode(); // Weiter zum nächsten
}
```

### Slow Nodes (Agent, LLM, HTTP-Request)

```typescript
// Slow Node Animation
1. Warte auf node.start Event
2. Node wird animiert
3. Warte auf node.end Event
4. Prüfe: Ist das der getestete Node?
   - JA → Animation stoppt
   - NEIN → Weiter zum nächsten Node
```

**Code:**
```typescript
if (nodeId === prev.currentAnimatedNodeId && waitingForEventRef.current) {
  if (currentTestingNodeId && nodeId === currentTestingNodeId) {
    // Getesteter Node abgeschlossen → Stoppe Animation
    return {
      currentAnimatedNodeId: null,
      waitingForEvent: false,
    };
  } else {
    // Weiter zum nächsten Node
    moveToNextNode();
  }
}
```

---

## 🛡️ Race Condition Protection

### Problem: testingNodeId kann sich ändern

**Szenario:**
1. User testet Node A
2. Animation läuft
3. User testet Node B (bevor A fertig ist)
4. Alte Animation sollte gestoppt werden

### Lösung: Mehrfache Checks

**1. Beim Timeout:**
```typescript
const timeoutTestingNodeId = testingNodeId; // Capture
setTimeout(() => {
  if (timeoutTestingNodeId !== testingNodeId) {
    // testingNodeId hat sich geändert → Stoppe Animation
    return;
  }
  // ... weiter mit Animation
}, duration);
```

**2. Bei SSE Events:**
```typescript
const currentTestingNodeId = testingNodeId; // Capture
// ... Event Processing ...
if (currentTestingNodeId !== testingNodeId) {
  // testingNodeId hat sich geändert → Ignoriere Event
  return prev;
}
```

**3. Beim State Reset:**
```typescript
if (testingNodeChanged && prevTestingNodeIdRef.current !== null) {
  // Sofortiger Reset aller Refs und State
  waitingForEventRef.current = false;
  hasStartedRef.current = false;
  receivedNodeStartEventsRef.current.clear();
  // ... Reset State
}
```

---

## 📊 Execution Order Berechnung

### Full Workflow Execution

```typescript
// Alle Nodes im Workflow
return buildNodeOrderForDebugPanel(nodes, edges);
// Ergebnis: [Start, Node1, Node2, Node3, Node4, End]
```

### Node Test

```typescript
// Nur Pfad von Start bis getesteter Node
const fullOrder = buildNodeOrderForDebugPanel(nodes, edges);
const testNodeIndex = fullOrder.findIndex(n => n.id === testingNodeId);
return fullOrder.slice(0, testNodeIndex + 1);
// Ergebnis: [Start, Node1, Node2, Node3]  ← Nur bis Node3
```

**Wichtig:**
- `buildNodeOrderForDebugPanel()` verwendet Topological Sort
- Berücksichtigt alle Edges
- Sortiert nach Position bei gleicher Priorität

---

## 🔌 SSE Event Filtering

### Problem: Events von anderen Tests

**Szenario:**
1. Test Node A läuft
2. User startet Test Node B
3. Alte Events von Node A kommen noch an

### Lösung: Event-Relevanz prüfen

```typescript
// In useSSEAnimationEvents
const handleNodeStart = (payload: any) => {
  const { nodeId } = payload;
  
  if (testingNodeId) {
    const nodeIndex = executionOrder.findIndex(n => n.id === nodeId);
    const testNodeIndex = executionOrder.findIndex(n => n.id === testingNodeId);
    
    // Nur Events für Nodes bis zum getesteten Node
    if (nodeIndex === -1 || nodeIndex > testNodeIndex) {
      return; // Event nicht relevant
    }
  }
  
  onEvent('node_start_received', { nodeId });
};
```

**Beispiel:**
```
Execution Order: [Start, Node1, Node2, Node3]
Testing Node: Node2

Event node.start für Node3 → IGNORIERT (außerhalb des Pfads)
Event node.start für Node1 → VERARBEITET (innerhalb des Pfads)
```

---

## ⏱️ Timing

### Animation Start

```typescript
// WorkflowCanvas.handleDebugTestStart()
setTestingNodeId(nodeId);  // ← Startet Animation sofort!

// Animation Hook reagiert:
useEffect(() => {
  if (isExecuting && executionOrder.length > 0) {
    moveToNextNode(); // Startet sofort
  }
}, [isExecuting, executionOrder]);
```

### Animation Stop

```typescript
// WorkflowCanvas.handleDebugTestResult()
setTimeout(() => {
  setTestingNodeId(null); // ← Stoppt Animation nach Delay
}, 100); // Kurzer Delay für Animation-Completion
```

**Warum Delay?**
- Gibt Animation Zeit zum Abschluss
- Verhindert abruptes Stoppen
- Bessere UX

---

## 🎨 Visual Flow

### Beispiel: Test Node "http-request-123"

```
1. User klickt "Play" auf http-request-123
   ↓
2. Animation startet SOFORT:
   Start → animiert (200ms)
   ↓
   transform → animiert (200ms)
   ↓
   http-request-123 → wartet auf node.start
   ↓
3. Backend-Call läuft parallel
   ↓
4. SSE Events kommen:
   node.start (http-request-123) → Animation zeigt Node als "running"
   ↓
   node.end (http-request-123) → Animation stoppt
   ↓
5. Backend Result kommt
   ↓
6. DebugPanel zeigt Output
   ↓
7. testingNodeId wird auf null gesetzt
```

---

## 🔍 State Machine (Neue Architektur)

### Test-Modus States

```typescript
// State Machine erkennt Test-Modus durch testingNodeId im Context
context: {
  testingNodeId: 'node-123',
  executionOrder: [Start, Node1, Node2], // Nur bis getesteter Node
  // ...
}

// State Transitions bei Tests:
'waiting_for_end:node_end_received' → {
  if (nodeId === context.testingNodeId) {
    return { type: 'completed' }; // Stoppe bei getestetem Node
  }
  return { type: 'waiting_for_start' }; // Weiter zum nächsten
}
```

---

## ⚠️ Bekannte Probleme

### 1. Race Conditions

**Problem:** testingNodeId kann sich während Animation ändern

**Lösung:** Mehrfache Checks (siehe oben)

### 2. Frühe Events

**Problem:** node.start Event kommt vor Animation

**Lösung:** Event-Buffering in `receivedNodeStartEventsRef`

### 3. Späte Events

**Problem:** node.end Event kommt nach Test-Abbruch

**Lösung:** Event-Relevanz prüfen (siehe oben)

---

## 📝 Zusammenfassung

### Test-Modus Features:

✅ **Sofortige Animation** - Startet vor Backend-Call  
✅ **Pfad-Berechnung** - Nur Start → Test Node  
✅ **Event-Filtering** - Nur relevante Events  
✅ **Race Condition Protection** - Mehrfache Checks  
✅ **Stop bei Test-Node** - Animation stoppt am Ziel  
✅ **SSE Integration** - Real-time Events für Slow Nodes  

### Unterschied zu Full Execution:

| Aspekt | Full Execution | Node Test |
|--------|----------------|-----------|
| **Execution Order** | Alle Nodes | Nur bis Test Node |
| **Animation Stop** | Bei letztem Node | Bei Test Node |
| **Event Filtering** | Alle Events | Nur relevante Events |
| **testingNodeId** | `null` | `nodeId` |



