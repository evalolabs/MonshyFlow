# 🔄 Loop Node System - Implementierungs-Checkliste

## ✅ Anforderungen

### 1. **While Node Komponente** ✅
- [x] WhileNode.tsx erstellt
- [x] Normaler Input/Output (wie alle anderen Nodes)
- [x] Zwei zusätzliche Handles unten:
  - [x] `loop` Handle (links, lila) - setzt Loop fort
  - [x] `back` Handle (rechts, rot) - empfängt Loop-Back
- [x] BaseNode verwendet für konsistentes Design
- [x] Kategorie: `logic`
- [x] Icon: 🔄

### 2. **Loop Edge System** ✅
- [x] LoopEdge.tsx erstellt
- [x] Separater Edge-Type: `loopEdge` (nicht `buttonEdge`)
- [x] Gestrichelte Linie (unterscheidet sich von normalen Edges)
- [x] Eigene Farben: Lila für Loop, Rot für Back
- [x] Separates + Button System (andere Farbe/Design als normale Buttons)
- [x] Keine Konflikte mit normalen Workflow Edges

### 3. **Constants & Konfiguration** ✅
- [x] `EDGE_TYPE_LOOP = 'loopEdge'` definiert
- [x] `NODE_TYPE_WHILE = 'while'` definiert
- [x] `LOOP_HANDLE_IDS` Objekt mit:
  - [x] `LOOP: 'loop'`
  - [x] `BACK: 'back'`
  - [x] `LOOP_BACK: 'loop-back'`
- [x] `isLoopHandle()` Funktion für robuste Erkennung
- [x] While Node Farbe in `NODE_COLORS` hinzugefügt

### 4. **Edge Utils** ✅
- [x] `createLoopEdge()` Funktion erstellt
- [x] Handle-basierte Loop-Erkennung
- [x] Loop-Type Bestimmung (loop/back)

### 5. **Edge Handling (useEdgeHandling)** ✅
- [x] Loop Edge Erkennung in `handleConnect()`:
  - [x] Handle-basiert (nicht Node-Type-basiert)
  - [x] Priorität: Loop > Tool > Button
- [x] Automatische Konvertierung in `useEffect`:
  - [x] Bestehende Loop Edges werden korrekt konvertiert
  - [x] Loop Edges bleiben erhalten

### 6. **Node Selector (useNodeSelector)** ✅
- [x] Automatische Loop-Back Edge Erstellung:
  - [x] Wenn Node in Loop Edge eingefügt wird
  - [x] Wenn Target = While Node → automatisch Loop-Back Edge
- [x] Loop Handle Erhaltung beim Einfügen
- [x] Korrekte Edge-Types beim Hinzufügen von Loop Nodes

### 7. **ButtonEdge Schutz** ✅
- [x] ButtonEdge rendert keine Loop Edges
- [x] Warnung wenn Loop Edge fälschlicherweise gerendert wird

### 8. **Node Registry** ✅
- [x] WhileNode in `nodeRegistry.ts` registriert
- [x] WhileNode in `OptimizedNodes.tsx` memoized
- [x] WhileNode Metadaten in `nodeMetadata.ts`
- [x] WhileNode in `generatedMetadata.ts` (nach Registry-Generierung)

### 9. **Registry.json** ✅
- [x] While Node Definition in `shared/registry.json`
- [x] Alle erforderlichen Felder:
  - [x] `type: "while"`
  - [x] `category: "logic"`
  - [x] `fields`: label, condition, maxIterations
  - [x] Frontend-Konfiguration

### 10. **WorkflowCanvas Integration** ✅
- [x] LoopEdge in `edgeTypes` registriert
- [x] WhileNode in `nodeTypes` verfügbar

### 11. **WorkflowEditorPage** ✅
- [x] Loop Edge Erkennung beim Laden
- [x] Korrekte Edge-Type-Zuweisung

### 12. **AddNodeButton** ✅
- [x] Positionierung für Loop Handles
- [x] Korrekte Button-Positionen

## 🎯 Wichtige Design-Prinzipien

1. **Handle-basiert, nicht Node-Type-basiert**: Loop-Erkennung funktioniert mit jedem Node
2. **Robustheit**: Neue Registry-Nodes können Loop-System nicht beschädigen
3. **Automatisierung**: Loop-Back Edge wird automatisch erstellt
4. **Separation**: Loop Edges haben komplett separates System

## 📋 Test-Szenarien

- [ ] While Node hinzufügen
- [ ] Loop Handle verbinden → Loop Edge wird erstellt
- [ ] Node in Loop Edge einfügen → Loop-Back Edge wird automatisch erstellt
- [ ] Back Handle verbinden → Loop-Back Edge wird erstellt
- [ ] Normaler Workflow funktioniert weiterhin
- [ ] Neue Registry-Nodes funktionieren mit Loop-System

