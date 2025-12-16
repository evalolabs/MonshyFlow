# 🧪 Testing Guide - Frontend Workflow Builder

**Datum:** 2024  
**Zweck:** Umfassende Dokumentation des Test-Systems für den Workflow Builder

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Test-Setup](#test-setup)
3. [Test-Struktur](#test-struktur)
4. [Test-Befehle](#test-befehle)
5. [Test-Typen](#test-typen)
6. [Best Practices](#best-practices)
7. [Aktuelle Test-Coverage](#aktuelle-test-coverage)
8. [Nächste Schritte](#nächste-schritte)

---

## 📊 Übersicht

Das Frontend verwendet **Vitest** als Test-Framework mit **React Testing Library** für Component-Tests und **jsdom** als DOM-Environment.

### Technologie-Stack

- **Vitest** v2.1.9 - Test-Runner und Framework
- **React Testing Library** v16.3.1 - Component-Testing
- **jsdom** v23.2.0 - DOM-Environment für Tests
- **@testing-library/jest-dom** v6.9.1 - DOM-Matchers
- **@testing-library/user-event** v14.6.1 - User-Event-Simulation

### Warum Vitest?

- ✅ Schnell (Vite-basiert)
- ✅ TypeScript-Support out-of-the-box
- ✅ Kompatibel mit Jest-APIs
- ✅ Gute React-Integration
- ✅ Watch-Mode und UI-Mode

---

## 🛠️ Test-Setup

### Installation

Die Test-Dependencies sind bereits in `frontend/package.json` definiert:

```json
{
  "devDependencies": {
    "vitest": "^2.1.9",
    "jsdom": "^23.2.0",
    "@testing-library/react": "^16.3.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/user-event": "^14.6.1"
  }
}
```

Installation:

```bash
cd frontend
pnpm install
```

### Konfiguration

**Datei:** `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

**Setup-Datei:** `frontend/src/test/setup.ts`

- Läuft vor allen Tests
- Konfiguriert `@testing-library/jest-dom` Matchers
- Cleanup nach jedem Test

---

## 📁 Test-Struktur

### Verzeichnisstruktur

```
frontend/
├── src/
│   ├── utils/
│   │   ├── __tests__/
│   │   │   └── nodeGroupingUtils.test.ts    # Utility-Funktionen Tests
│   │   └── nodeGroupingUtils.ts
│   ├── components/
│   │   └── WorkflowBuilder/
│   │       └── hooks/
│   │           ├── __tests__/
│   │           │   └── useKeyboardShortcuts.test.ts  # Hook Tests
│   │           └── useKeyboardShortcuts.ts
│   └── test/
│       └── setup.ts                          # Globales Test-Setup
├── vitest.config.ts                          # Vitest-Konfiguration
└── package.json
```

### Naming-Konventionen

- **Test-Dateien:** `*.test.ts` oder `*.spec.ts`
- **Test-Verzeichnisse:** `__tests__/` neben der zu testenden Datei
- **Test-Namen:** Beschreibend, z.B. `should find tool nodes connected to an agent`

---

## 🚀 Test-Befehle

### Alle Tests ausführen

```bash
cd frontend
pnpm test
```

### Watch-Mode (automatisch neu ausführen bei Änderungen)

```bash
pnpm test:watch
```

### UI-Mode (interaktive Test-UI)

```bash
pnpm test:ui
```

### Coverage-Report generieren

```bash
pnpm test:coverage
```

### Spezifische Tests ausführen

```bash
# Nur nodeGroupingUtils Tests
pnpm test -- nodeGroupingUtils

# Nur useKeyboardShortcuts Tests
pnpm test -- useKeyboardShortcuts

# Mit Filter
pnpm test -- --grep "should find tool nodes"
```

### Verbose Output

```bash
pnpm test -- --reporter=verbose
```

---

## 🧩 Test-Typen

### 1. Unit Tests

**Zweck:** Testen einzelner Funktionen/Utilities isoliert

**Beispiel:** `nodeGroupingUtils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { findToolNodesForAgent } from '../nodeGroupingUtils';

describe('findToolNodesForAgent', () => {
  it('should find tool nodes connected to an agent', () => {
    const edges = [
      { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
    ];
    const result = findToolNodesForAgent('agent-1', edges);
    expect(result).toContain('tool-1');
  });
});
```

**Aktuelle Coverage:**
- ✅ `nodeGroupingUtils` - 20 Tests
  - `findToolNodesForAgent` (3 Tests)
  - `findLoopBlockNodes` (2 Tests)
  - `findBranchNodes` (2 Tests)
  - `isParentNode` (5 Tests)
  - `findAllChildNodes` (3 Tests)
  - `getNodeGroup` (1 Test)
  - `isChildOf` (2 Tests)
  - `findParentNode` (2 Tests)

### 2. Hook Tests

**Zweck:** Testen von React Hooks mit `renderHook`

**Beispiel:** `useKeyboardShortcuts.test.ts`

```typescript
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  it('should register and trigger a simple keyboard shortcut', () => {
    const mockHandler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        shortcuts: { 'ctrl+z': mockHandler },
      })
    );

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
});
```

**Aktuelle Coverage:**
- ✅ `useKeyboardShortcuts` - 9 Tests
  - Shortcut-Registrierung
  - Ctrl/Cmd-Unterstützung
  - Shift-Modifier
  - Input-Detection
  - Delete/Escape-Keys
  - Multiple Shortcuts
  - Disable-Mechanismus

### 3. Component Tests (Geplant)

**Zweck:** Testen von React-Komponenten

**Beispiel (zukünftig):**

```typescript
import { render, screen } from '@testing-library/react';
import { WorkflowCanvas } from './WorkflowCanvas';

describe('WorkflowCanvas', () => {
  it('should render nodes', () => {
    render(<WorkflowCanvas nodes={mockNodes} edges={mockEdges} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
  });
});
```

### 4. Integration Tests (Geplant)

**Zweck:** Testen von Interaktionen zwischen mehreren Komponenten/Hooks

**Beispiel (zukünftig):**

```typescript
describe('Copy/Paste Integration', () => {
  it('should copy and paste nodes with children', () => {
    // Test Copy/Paste mit Agent + Tools
  });
});
```

---

## ✅ Best Practices

### 1. Test-Struktur (AAA-Pattern)

```typescript
it('should do something', () => {
  // Arrange: Setup
  const input = { ... };
  
  // Act: Execute
  const result = functionUnderTest(input);
  
  // Assert: Verify
  expect(result).toBe(expected);
});
```

### 2. Test-Namen

- ✅ **Gut:** `should find tool nodes connected to an agent`
- ❌ **Schlecht:** `test1` oder `works`

### 3. Isolation

- Jeder Test sollte unabhängig sein
- Keine Abhängigkeiten zwischen Tests
- Cleanup nach jedem Test (automatisch durch `setup.ts`)

### 4. Edge Cases

Teste auch Grenzfälle:

```typescript
it('should return empty array if no tools connected', () => {
  const edges = [];
  const result = findToolNodesForAgent('agent-1', edges);
  expect(result).toHaveLength(0);
});
```

### 5. Mocking

Verwende `vi.fn()` für Mocks:

```typescript
const mockHandler = vi.fn();
// ... test code ...
expect(mockHandler).toHaveBeenCalledTimes(1);
```

### 6. Async Tests

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

---

## 📈 Aktuelle Test-Coverage

### Implementierte Tests

| Komponente | Tests | Status | Coverage |
|------------|-------|--------|----------|
| `nodeGroupingUtils` | 20 | ✅ | Vollständig |
| `useKeyboardShortcuts` | 9 | ✅ | Vollständig |
| **Gesamt** | **29** | ✅ | **Grundlagen** |

### Test-Statistiken

- **Test-Dateien:** 2
- **Tests:** 29
- **Durchschnittliche Ausführungszeit:** ~6-7 Sekunden
- **Alle Tests bestanden:** ✅

### Getestete Features

#### Phase 0: Node-Gruppierung ✅
- ✅ `findToolNodesForAgent` - Agent + Tools
- ✅ `findLoopBlockNodes` - While/ForEach Loop-Blocks
- ✅ `findBranchNodes` - IfElse Branches
- ✅ `isParentNode` - Dynamische Parent-Erkennung
- ✅ `findAllChildNodes` - Rekursive Child-Suche
- ✅ `getNodeGroup` - Komplette Node-Gruppen
- ✅ `isChildOf` - Parent-Child-Beziehungen
- ✅ `findParentNode` - Parent-Suche

#### Phase 1.1: Keyboard Shortcuts ✅
- ✅ Shortcut-Registrierung
- ✅ Ctrl/Cmd-Unterstützung (Windows/Mac)
- ✅ Shift-Modifier
- ✅ Input/Textarea-Detection
- ✅ Delete/Escape-Keys
- ✅ Multiple Shortcuts
- ✅ Disable-Mechanismus

---

## 🔄 Nächste Schritte

### Geplante Tests

#### Phase 1.2: Multi-Select (Geplant)
- [ ] Multi-Select mit React Flow
- [ ] Gruppierungs-Auswahl
- [ ] Visual Feedback

#### Phase 1.3: Delete-Key Shortcut (Geplant)
- [ ] Delete mit Multi-Select
- [ ] Delete mit Gruppierungen
- [ ] Bestätigung für mehrere Nodes

#### Phase 2: Copy/Paste (Geplant)
- [ ] `useClipboard` Hook Tests
- [ ] Copy mit Gruppierungen
- [ ] Paste mit ID-Mapping
- [ ] Edge-Verbindungen beim Paste
- [ ] Nested Gruppierungen

#### Phase 3: Alignment (Geplant)
- [ ] `alignmentUtils` Tests
- [ ] Alignment mit Multi-Select
- [ ] Alignment mit Gruppierungen

### Integration Tests

- [ ] Copy/Paste Workflow (Agent + Tools)
- [ ] Copy/Paste Workflow (While + Loop-Block)
- [ ] Copy/Paste Workflow (IfElse + Branches)
- [ ] Multi-Select + Delete
- [ ] Multi-Select + Alignment
- [ ] Undo/Redo nach Copy/Paste

### E2E Tests (Optional)

- [ ] Vollständiger Copy/Paste-Workflow
- [ ] Multi-Select + Alignment Workflow
- [ ] Keyboard Shortcuts in verschiedenen Kontexten

---

## 🐛 Troubleshooting

### Tests schlagen fehl

1. **Prüfe Dependencies:**
   ```bash
   pnpm install
   ```

2. **Prüfe TypeScript-Fehler:**
   ```bash
   pnpm build
   ```

3. **Führe Tests im Verbose-Mode aus:**
   ```bash
   pnpm test -- --reporter=verbose
   ```

### jsdom-Fehler

Falls DOM-APIs fehlen, prüfe `vitest.config.ts`:

```typescript
test: {
  environment: 'jsdom', // Muss gesetzt sein
}
```

### React Testing Library Fehler

Stelle sicher, dass `@testing-library/jest-dom` in `setup.ts` importiert ist:

```typescript
import '@testing-library/jest-dom';
```

---

## 📚 Ressourcen

### Dokumentation

- [Vitest Dokumentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Jest DOM](https://github.com/testing-library/jest-dom)

### Interne Dokumentation

- `frontend/TEST_README.md` - Kurze Übersicht
- `frontend/vitest.config.ts` - Konfiguration
- `frontend/src/test/setup.ts` - Setup-Datei

---

## 📝 Changelog

### 2024 - Initial Setup
- ✅ Vitest konfiguriert
- ✅ Test-Setup erstellt
- ✅ `nodeGroupingUtils` Tests (20 Tests)
- ✅ `useKeyboardShortcuts` Tests (9 Tests)
- ✅ Dokumentation erstellt

---

**Status:** ✅ Grundlagen implementiert  
**Nächster Schritt:** Tests für Phase 1.2 (Multi-Select) und Phase 1.3 (Delete-Key)  
**Ziel:** 80%+ Test-Coverage für alle kritischen Features

