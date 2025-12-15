# Animation System - Architektur Übersicht

## 🏗️ Aktuelle Architektur

Das Animationssystem wurde refactored und besteht aus mehreren Schichten:

```
┌─────────────────────────────────────────────────────────────┐
│                    WorkflowCanvas.tsx                        │
│  Verwendet: useSequentialNodeAnimation()                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         useSequentialNodeAnimation (Facade Hook)             │
│  - Berechnet Execution Order                                 │
│  - Kombiniert alle Sub-Hooks                                 │
│  - Gibt API zurück: { currentAnimatedNodeId, ... }          │
└───────┬───────────────┬───────────────┬─────────────────────┘
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ State        │ │ Event        │ │ Scheduler   │
│ Machine      │ │ Handler      │ │             │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Animation    │ │ SSE Event   │ │ Timing      │
│ State        │ │ Bus         │ │ Logic       │
│ Machine      │ │             │ │             │
└──────────────┘ └──────────────┘ └──────────────┘
```

## 📁 Datei-Struktur

```
hooks/animation/
├── index.ts                              # Public API Export
├── useSequentialNodeAnimation.refactored.ts  # Facade Hook (NEU)
│
├── useAnimationStateMachine.ts           # State Management Hook
├── useSSEAnimationEvents.ts              # Event Handling Hook
├── useAnimationScheduler.ts              # Timing Logic Hook
│
├── animationStateMachine.ts              # State Machine Definition
├── animationEventBus.ts                  # Event Bus Interface & SSE Adapter
└── animationExtensionPoints.ts           # Extension Points für Loops/Conditionals
```

## 🔄 Datenfluss

### 1. Initialisierung
```
WorkflowCanvas
  → useSequentialNodeAnimation()
    → useAnimationStateMachine()     [State: 'idle']
    → useSSEAnimationEvents()        [Event Bus Setup]
    → useAnimationScheduler()        [Timing Setup]
```

### 2. Execution Start
```
isExecuting = true
  → State Machine: 'idle' → 'waiting_for_start'
  → Execution Order berechnet
  → moveToNextNode() aufgerufen
```

### 3. Node Animation
```
Fast Node:
  → State: 'waiting_for_start' → 'animating'
  → Timeout: 200ms
  → State: 'animating' → 'waiting_for_start' (next node)

Slow Node:
  → State: 'waiting_for_start' (wait for node.start)
  → SSE Event: 'node.start' → State: 'waiting_for_end'
  → SSE Event: 'node.end' → State: 'waiting_for_start' (next node)
```

### 4. Event Flow
```
SSE Connection
  → SSEAnimationEventBus
    → node.start → 'node_start_received'
    → node.end → 'node_end_received'
      → State Machine Dispatch
        → State Transition
```

## 🧩 Komponenten-Details

### 1. Animation State Machine (`animationStateMachine.ts`)

**Zustände:**
- `idle` - Keine Animation aktiv
- `waiting_for_start` - Wartet auf node.start Event (slow nodes)
- `animating` - Node wird animiert (fast nodes)
- `waiting_for_end` - Wartet auf node.end Event (slow nodes)
- `completed` - Alle Nodes animiert
- `error` - Fehlerzustand

**Events:**
- `execution_started` - Execution beginnt
- `execution_stopped` - Execution stoppt
- `node_start_received` - node.start Event empfangen
- `node_end_received` - node.end Event empfangen
- `timeout` - Timeout für fast nodes
- `testing_node_changed` - Testing Node geändert
- `move_to_next` - Zum nächsten Node wechseln

**Vorteile:**
- ✅ Eliminiert Race Conditions
- ✅ Klare State-Transitions
- ✅ Ein einziger State statt 7+ Refs
- ✅ Extension Points im Context

### 2. Event Bus (`animationEventBus.ts`)

**Interface:**
```typescript
IAnimationEventBus {
  on(event, handler)
  off(event, handler)
  emit(event, payload)
  isConnected()
  disconnect()
}
```

**Implementierungen:**
- `SSEAnimationEventBus` - Wrappt SSEConnection
- `MockAnimationEventBus` - Für Tests

**Features:**
- Event-Buffering für frühe Events
- Abstraktion von SSE-Details
- Testbar durch Mock

### 3. State Machine Hook (`useAnimationStateMachine.ts`)

**Verantwortlichkeiten:**
- State Machine Instanz verwalten
- State-Transitions auslösen
- State an React weitergeben

**API:**
```typescript
{
  state: AnimationState,
  dispatch: (event, payload) => void,
  getCurrentAnimatedNodeId: () => string | null,
  isNodeAnimating: (nodeId) => boolean,
  getStateType: () => AnimationStateType,
  getContext: () => AnimationContext
}
```

### 4. SSE Event Handler (`useSSEAnimationEvents.ts`)

**Verantwortlichkeiten:**
- SSE Events abonnieren
- Events in State Machine Events konvertieren
- Event-Relevanz prüfen (testingNodeId)

**Features:**
- Automatisches Event-Buffering
- Filterung für Node-Tests
- Cleanup bei Unmount

### 5. Animation Scheduler (`useAnimationScheduler.ts`)

**Verantwortlichkeiten:**
- Fast/Slow Node Erkennung
- Timeout-Management
- Animation-Duration Berechnung

**Node-Kategorisierung:**
- Fast: start, end, transform, logic, core, utility, data
- Slow: agent, llm, http-request, email, tool, ai, integration

### 6. Facade Hook (`useSequentialNodeAnimation.refactored.ts`)

**Verantwortlichkeiten:**
- Kombiniert alle Sub-Hooks
- Orchestriert Animation-Flow
- Backward-Compatible API

**API (gleich wie alt):**
```typescript
{
  currentAnimatedNodeId: string | null,
  isNodeAnimating: (nodeId: string) => boolean,
  executionOrder: Node[]
}
```

## 🔌 Extension Points

### Für zukünftige Erweiterungen (Loops, Conditionals, Parallel)

**1. State Machine Context Extensions:**
```typescript
context.extensions = {
  loop?: { loopNodeId, iteration, loopBodyNodes },
  conditional?: { activeBranch, branchNodes },
  parallel?: { parallelNodeIds }
}
```

**2. Extension Registry:**
```typescript
animationExtensionRegistry.registerLoopHandler(handler)
animationExtensionRegistry.registerConditionalHandler(handler)
animationExtensionRegistry.registerParallelHandler(handler)
```

**3. Interfaces:**
- `ILoopAnimationHandler` - Für foreach/while
- `IConditionalAnimationHandler` - Für ifelse
- `IParallelAnimationHandler` - Für parallele Execution

## 📊 Vergleich: Alt vs. Neu

| Aspekt | Alt (useSequentialNodeAnimation.ts) | Neu (Refactored) |
|--------|-----------------------------------|------------------|
| **State Management** | 7+ Refs + useState | State Machine |
| **Event Handling** | Direkt in useEffect | Event Bus |
| **Timing** | Inline in moveToNextNode | Separater Scheduler Hook |
| **Code-Zeilen** | 544 Zeilen | ~235 Zeilen (Facade) + Module |
| **Testbarkeit** | Schwer (viele Refs) | Einfach (State Machine + Mock) |
| **Wartbarkeit** | Komplex | Modulare Struktur |
| **Race Conditions** | Viele bekannte | Eliminiert durch State Machine |
| **Extension Points** | Keine | Definiert |

## 🚀 Aktueller Status

### ✅ Implementiert:
- State Machine
- Event Bus
- Alle Sub-Hooks
- Facade Hook
- Extension Points (Interfaces)

### ⚠️ Noch nicht aktiv:
- **WorkflowCanvas verwendet noch die alte Implementierung**
- Neue Architektur ist bereit, aber noch nicht integriert

### 📝 Nächste Schritte:
1. Integration in WorkflowCanvas (alte durch neue ersetzen)
2. Testing
3. Extension Implementierung (Loops, Conditionals, Parallel)

## 🔍 Integration Point

**Aktuell:**
```typescript
// WorkflowCanvas.tsx (Zeile 807)
import { useSequentialNodeAnimation } from './hooks/useSequentialNodeAnimation';

const { currentAnimatedNodeId } = useSequentialNodeAnimation({...});
```

**Nach Migration:**
```typescript
// WorkflowCanvas.tsx
import { useSequentialNodeAnimation } from './hooks/animation';

const { currentAnimatedNodeId } = useSequentialNodeAnimation({...});
// Gleiche API, neue Architektur!
```

## 📈 Vorteile der neuen Architektur

1. **State Machine Pattern**
   - Eliminiert Race Conditions
   - Klare State-Transitions
   - Ein zentraler State

2. **Event-Driven**
   - Abstraktion von SSE
   - Testbar durch Mock
   - Event-Buffering zentralisiert

3. **Separation of Concerns**
   - State Management: `useAnimationStateMachine`
   - Event Handling: `useSSEAnimationEvents`
   - Timing: `useAnimationScheduler`
   - Orchestration: `useSequentialNodeAnimation`

4. **Extension Points**
   - Vorbereitet für Loops
   - Vorbereitet für Conditionals
   - Vorbereitet für Parallel Execution

5. **Testbarkeit**
   - State Machine isoliert testbar
   - Event Bus mockbar
   - Hooks einzeln testbar


