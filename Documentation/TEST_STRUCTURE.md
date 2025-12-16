# 📁 Test-System Struktur

**Zweck:** Dokumentation der Test-Struktur und wo Test-Daten angelegt werden

---

## 📂 Verzeichnisstruktur

```
frontend/
├── src/
│   ├── test/
│   │   └── setup.ts                    # ⚙️ Globales Test-Setup (läuft vor ALLEN Tests)
│   │
│   ├── utils/
│   │   ├── nodeGroupingUtils.ts        # 📄 Produktions-Code
│   │   └── __tests__/                  # 🧪 Test-Verzeichnis
│   │       ├── nodeGroupingUtils.test.ts              # Unit-Tests
│   │       └── nodeGroupingUtils.integration.test.ts   # Integration-Tests
│   │
│   └── components/
│       └── WorkflowBuilder/
│           └── hooks/
│               ├── useKeyboardShortcuts.ts            # 📄 Produktions-Code
│               └── __tests__/                         # 🧪 Test-Verzeichnis
│                   ├── useKeyboardShortcuts.test.ts              # Unit-Tests
│                   └── useKeyboardShortcuts.integration.test.ts  # Integration-Tests
│
├── vitest.config.ts                    # ⚙️ Vitest-Konfiguration
└── package.json                        # 📦 Test-Scripts
```

---

## 🎯 Naming-Konventionen

### Test-Dateien:
- **Format:** `*.test.ts` oder `*.spec.ts`
- **Beispiel:** `nodeGroupingUtils.test.ts`
- **Integration:** `nodeGroupingUtils.integration.test.ts`

### Test-Verzeichnisse:
- **Format:** `__tests__/` (doppelter Unterstrich)
- **Lage:** Neben der zu testenden Datei
- **Beispiel:** 
  ```
  utils/
  ├── nodeGroupingUtils.ts
  └── __tests__/
      └── nodeGroupingUtils.test.ts
  ```

---

## 📊 Wo werden Test-Daten angelegt?

### 1. **In den Test-Dateien selbst** (Inline)

**Beispiel:** `nodeGroupingUtils.test.ts`

```typescript
describe('findToolNodesForAgent', () => {
  it('should find tool nodes connected to an agent', () => {
    // ✅ Test-Daten werden HIER direkt im Test erstellt
    const edges: Edge[] = [
      { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
      { id: 'e2', source: 'tool-2', target: 'agent-1', targetHandle: 'tool' },
    ];

    const result = findToolNodesForAgent('agent-1', edges);
    expect(result).toContain('tool-1');
  });
});
```

**Vorteile:**
- ✅ Einfach und direkt
- ✅ Test ist selbsterklärend
- ✅ Keine externe Abhängigkeit

**Nachteile:**
- ❌ Code-Duplikation bei ähnlichen Tests
- ❌ Schwer zu warten bei vielen Tests

---

### 2. **In Helper-Funktionen** (Wiederverwendbar)

**Beispiel:** Test-Daten-Factory

```typescript
// In der Test-Datei oder separater Helper-Datei
function createMockNodes(count: number): Node[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    type: 'transform',
    position: { x: i * 100, y: 0 },
    data: {},
  }));
}

function createMockEdges(nodes: Node[]): Edge[] {
  return nodes.slice(1).map((node, i) => ({
    id: `edge-${i}`,
    source: nodes[i].id,
    target: node.id,
  }));
}

// Verwendung im Test:
it('should handle many nodes', () => {
  const nodes = createMockNodes(10);
  const edges = createMockEdges(nodes);
  // ... test
});
```

**Vorteile:**
- ✅ Wiederverwendbar
- ✅ Einfach zu warten
- ✅ Konsistente Test-Daten

**Nachteile:**
- ❌ Zusätzliche Abstraktion
- ❌ Kann komplex werden

---

### 3. **In beforeEach/afterEach** (Setup/Teardown)

**Beispiel:** Gemeinsame Test-Daten

```typescript
describe('nodeGroupingUtils', () => {
  let mockNodes: Node[];
  let mockEdges: Edge[];

  // ✅ Wird vor JEDEM Test ausgeführt
  beforeEach(() => {
    mockNodes = [
      { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
      { id: 'tool-1', type: 'tool', position: { x: 0, y: 0 }, data: {} },
    ];

    mockEdges = [
      { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
    ];
  });

  // ✅ Wird nach JEDEM Test ausgeführt
  afterEach(() => {
    // Cleanup falls nötig
    mockNodes = [];
    mockEdges = [];
  });

  it('should find tool nodes', () => {
    // mockNodes und mockEdges sind verfügbar
    const result = findToolNodesForAgent('agent-1', mockEdges);
    expect(result).toContain('tool-1');
  });
});
```

**Vorteile:**
- ✅ Gemeinsame Setup-Daten
- ✅ Cleanup nach jedem Test
- ✅ Isolation zwischen Tests

**Nachteile:**
- ❌ Kann zu viel Setup sein
- ❌ Nicht immer nötig

---

### 4. **In separaten Mock-Dateien** (Für komplexe Daten)

**Struktur:**
```
src/
├── utils/
│   └── __tests__/
│       ├── nodeGroupingUtils.test.ts
│       └── mocks/
│           └── testData.ts          # 📦 Test-Daten
```

**Beispiel:** `mocks/testData.ts`

```typescript
import type { Node, Edge } from '@xyflow/react';

export const MOCK_AGENT_NODES: Node[] = [
  { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
  { id: 'agent-2', type: 'agent', position: { x: 200, y: 0 }, data: {} },
];

export const MOCK_TOOL_NODES: Node[] = [
  { id: 'tool-1', type: 'tool', position: { x: 0, y: 100 }, data: {} },
  { id: 'tool-2', type: 'tool', position: { x: 100, y: 100 }, data: {} },
];

export const MOCK_AGENT_TOOL_EDGES: Edge[] = [
  { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
  { id: 'e2', source: 'tool-2', target: 'agent-1', targetHandle: 'tool' },
];

// Verwendung im Test:
import { MOCK_AGENT_NODES, MOCK_TOOL_NODES, MOCK_AGENT_TOOL_EDGES } from './mocks/testData';
```

**Vorteile:**
- ✅ Sehr wiederverwendbar
- ✅ Getrennt von Test-Logik
- ✅ Kann in mehreren Test-Dateien verwendet werden

**Nachteile:**
- ❌ Zusätzliche Dateien
- ❌ Kann zu viel werden

---

## 🔄 Aktuelle Struktur in unserem Projekt

### Wie wir es aktuell machen:

#### ✅ **Meistens: Inline im Test** (Einfach und direkt)

```typescript
// nodeGroupingUtils.test.ts
it('should find tool nodes connected to an agent', () => {
  // Daten direkt im Test
  const edges: Edge[] = [
    { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
  ];
  // ... test
});
```

#### ✅ **Für komplexe Szenarien: Inline mit mehr Daten**

```typescript
// nodeGroupingUtils.integration.test.ts
it('should handle complex workflow with Agent + Tools + While Loop', () => {
  // Komplexe Daten direkt im Test
  const nodes: Node[] = [
    { id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: {} },
    { id: 'agent-1', type: 'agent', position: { x: 100, y: 0 }, data: {} },
    // ... mehr Nodes
  ];
  // ... test
});
```

#### ✅ **Für Hooks: beforeEach für Mocks**

```typescript
// useKeyboardShortcuts.test.ts
describe('useKeyboardShortcuts', () => {
  let mockHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockHandler = vi.fn(); // Mock-Funktion vor jedem Test
  });

  afterEach(() => {
    vi.clearAllMocks(); // Cleanup
  });
});
```

---

## ⚙️ Test-Setup (Global)

### `src/test/setup.ts`

**Wird vor ALLEN Tests ausgeführt:**

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup nach jedem Test
afterEach(() => {
  cleanup(); // Bereinigt React-Komponenten
});
```

**Was hier passiert:**
- ✅ Globales Setup für alle Tests
- ✅ Cleanup nach jedem Test
- ✅ Jest-DOM Matchers aktivieren

---

## 📋 Test-Daten Lebenszyklus

### 1. **Vor allen Tests** (`setup.ts`)
```typescript
// src/test/setup.ts läuft
// - Konfiguriert Test-Environment
// - Aktiviert Jest-DOM Matchers
```

### 2. **Vor jedem Test** (`beforeEach`)
```typescript
beforeEach(() => {
  // Test-Daten werden erstellt
  mockNodes = [...];
  mockEdges = [...];
});
```

### 3. **Während des Tests**
```typescript
it('should do something', () => {
  // Test-Daten werden verwendet
  const result = function(mockNodes, mockEdges);
  expect(result).toBe(...);
});
```

### 4. **Nach jedem Test** (`afterEach`)
```typescript
afterEach(() => {
  // Cleanup
  vi.clearAllMocks();
  cleanup();
});
```

---

## 🎯 Best Practices

### ✅ Empfohlen:

1. **Einfache Tests:** Daten inline im Test
   ```typescript
   it('should find tool', () => {
     const edges = [{ ... }]; // Inline
   });
   ```

2. **Wiederholte Daten:** Helper-Funktionen
   ```typescript
   function createMockAgent() { return {...}; }
   ```

3. **Komplexe Daten:** Separates Mock-File
   ```typescript
   // mocks/testData.ts
   export const COMPLEX_WORKFLOW = { ... };
   ```

4. **Hooks:** beforeEach für Mocks
   ```typescript
   beforeEach(() => {
     mockHandler = vi.fn();
   });
   ```

### ❌ Nicht empfohlen:

1. **Globale Test-Daten** (außer in setup.ts)
   ```typescript
   // ❌ Schlecht: Globale Variable
   const globalNodes = [...];
   ```

2. **Geteilte State zwischen Tests**
   ```typescript
   // ❌ Schlecht: State wird zwischen Tests geteilt
   let sharedState = {};
   ```

3. **Externe Abhängigkeiten** (ohne Mocking)
   ```typescript
   // ❌ Schlecht: Echte API-Calls
   const data = await fetch('/api/nodes');
   ```

---

## 📊 Zusammenfassung

### Wo werden Test-Daten angelegt?

| Ort | Wann | Beispiel |
|-----|------|----------|
| **Inline im Test** | Meistens | `const edges = [{...}];` |
| **beforeEach** | Für gemeinsame Setup | `beforeEach(() => { mockData = {...}; });` |
| **Helper-Funktionen** | Für Wiederholung | `createMockNodes(10)` |
| **Mock-Dateien** | Für komplexe Daten | `mocks/testData.ts` |
| **setup.ts** | Für globale Konfiguration | `afterEach(() => cleanup());` |

### Aktuelle Struktur:

```
✅ Einfache Tests: Daten inline
✅ Komplexe Tests: Daten inline (aber detailliert)
✅ Hook-Tests: beforeEach für Mocks
✅ Integration-Tests: Real-World-Daten inline
```

---

**Status:** Dokumentation erstellt  
**Nächster Schritt:** Optional: Mock-Dateien für komplexe Test-Daten erstellen

