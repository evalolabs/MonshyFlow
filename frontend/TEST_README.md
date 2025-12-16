# 🧪 Test-System für Frontend

## Übersicht

Das Projekt verwendet **Vitest** als Test-Framework für Frontend-Tests.

## Installation

Die Test-Dependencies sind bereits in `package.json` definiert. Installiere sie mit:

```bash
npm install
```

## Test-Struktur

```
frontend/
├── src/
│   ├── utils/
│   │   ├── __tests__/
│   │   │   └── nodeGroupingUtils.test.ts  # Tests für nodeGroupingUtils
│   │   └── nodeGroupingUtils.ts
│   └── test/
│       └── setup.ts                        # Test-Setup (läuft vor allen Tests)
├── vitest.config.ts                        # Vitest-Konfiguration
└── package.json
```

## Test-Befehle

### Alle Tests ausführen
```bash
npm run test
```

### Tests im Watch-Mode (automatisch neu ausführen bei Änderungen)
```bash
npm run test:watch
```

### Tests mit UI (interaktive Test-UI)
```bash
npm run test:ui
```

### Coverage-Report generieren
```bash
npm run test:coverage
```

## Neue Tests schreiben

### 1. Test-Datei erstellen

Erstelle eine Test-Datei neben der zu testenden Datei:

```
src/utils/myUtils.ts
src/utils/__tests__/myUtils.test.ts  ← Test-Datei
```

### 2. Test schreiben

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myUtils';

describe('myUtils', () => {
  describe('myFunction', () => {
    it('should do something', () => {
      const result = myFunction();
      expect(result).toBe(expected);
    });
  });
});
```

### 3. Test ausführen

```bash
npm run test:watch
```

## Beispiel: nodeGroupingUtils Tests

Die Tests für `nodeGroupingUtils` sind bereits implementiert:

- ✅ `findToolNodesForAgent` - Findet Tool-Nodes für einen Agent
- ✅ `findLoopBlockNodes` - Findet Nodes in einem Loop-Block
- ✅ `findBranchNodes` - Findet Nodes in einem Branch
- ✅ `isParentNode` - Prüft ob ein Node ein Parent ist
- ✅ `findAllChildNodes` - Findet alle Children für einen Parent
- ✅ `getNodeGroup` - Gibt Parent + Children zurück
- ✅ `isChildOf` - Prüft ob ein Node ein Child ist
- ✅ `findParentNode` - Findet Parent für einen Child

## Test-Konfiguration

Die Konfiguration befindet sich in `vitest.config.ts`:

- **Environment:** `jsdom` (für DOM-Tests)
- **Setup:** `src/test/setup.ts` (läuft vor allen Tests)
- **Coverage:** V8 Provider mit HTML/JSON Reports

## Best Practices

1. **Test-Namen:** Beschreibe was getestet wird
2. **Arrange-Act-Assert:** Strukturiere Tests klar
3. **Isolation:** Jeder Test sollte unabhängig sein
4. **Edge Cases:** Teste auch Grenzfälle
5. **Coverage:** Strebe nach hoher Test-Coverage

## Nächste Schritte

- [ ] Tests für `useNodeGrouping` Hook schreiben
- [ ] Tests für `useClipboard` Hook schreiben (wenn implementiert)
- [ ] Integration-Tests für Copy/Paste
- [ ] E2E-Tests mit Playwright (optional)


