# 🎯 Implementierungsstrategie: Workflow-Editor UX/UI Features

**Datum:** 2024  
**Zweck:** Analyse und Strategie für die Implementierung der fehlenden Editor-Features  
**Workflow:** Implementierung → Tests → Test-Ausführung → Browser-Testing (wenn nötig) → Nächstes Feature

---

## 📊 Status-Quo Analyse

### 🔄 Registry-System & Neue Nodes

**Wichtig:** Das System hat ein Registry-System, das neue Nodes automatisch registriert:

1. **Registry.json-basiert:**
   - Nodes werden in `shared/registry.json` definiert
   - `npm run generate:registry` generiert `generatedMetadata.ts`
   - Automatisch in `createNodeTypesMap` registriert (Zeile 250-295 in `nodeRegistry.ts`)

2. **Auto-Discovery:**
   - Backend-Nodes werden automatisch entdeckt (`initializeAutoDiscovery`)
   - Werden zur Laufzeit registriert
   - Verwenden `BaseNode` als Fallback-Komponente

3. **Fallback-Mechanismus:**
   - Unbekannte Node-Types verwenden automatisch `BaseNode`
   - Werden in `createNodeTypesMap` automatisch registriert (Zeile 298-342)

**⚠️ KRITISCH für neue Features:**
- Alle Features müssen mit **unbekannten Node-Types** funktionieren
- Gruppierungs-Erkennung muss **dynamisch** funktionieren (nicht hardcodiert)
- Keine hardcodierten Node-Type-Checks (außer für bekannte Gruppierungen)

---

### 🔗 Node-Gruppierungen (Parent-Child-Beziehungen)

Das System hat verschiedene Node-Types mit Parent-Child-Beziehungen, die bei allen Operationen berücksichtigt werden müssen:

#### 1. **Agent + Tools** ✅ (Teilweise implementiert)
- **Parent:** Agent Node
- **Children:** Tool-Nodes (tool, tool-web-search, tool-file-search, tool-code-interpreter, tool-function, tool-mcp-server)
- **Verbindung:** `targetHandle: 'tool'` / `'chat-model'` / `'memory'` am Agent
- **Status:**
  - ✅ Löschen: Tools werden mit entfernt
  - ✅ Verschieben: `useAgentToolPositioning` funktioniert
  - ❌ Copy/Paste: Tools werden nicht mit kopiert
  - ❌ Duplicate: Tools werden nicht mit dupliziert
  - ❌ Multi-Select: Gruppierung wird nicht berücksichtigt

#### 2. **While/ForEach + Loop-Block** ❌ (Nicht implementiert)
- **Parent:** While Node oder ForEach Node
- **Children:** Alle Nodes im Loop-Block
- **Verbindung:** 
  - `sourceHandle: 'loop'` vom Loop-Node
  - `targetHandle: 'back'` zurück zum Loop-Node
- **Status:**
  - ❌ Löschen: Loop-Block wird nicht mit entfernt
  - ❌ Verschieben: Loop-Block wird nicht mit verschoben
  - ❌ Copy/Paste: Loop-Block wird nicht mit kopiert
  - ❌ Duplicate: Loop-Block wird nicht mit dupliziert
  - ❌ Multi-Select: Gruppierung wird nicht berücksichtigt

#### 3. **IfElse + Branches** ❌ (Nicht implementiert)
- **Parent:** IfElse Node
- **Children:** 
  - True-Branch Nodes (über `sourceHandle: 'true'`)
  - False-Branch Nodes (über `sourceHandle: 'false'`)
- **Besonderheit:** Beide Branches können zu einem Merge-Node führen
- **Status:**
  - ❌ Löschen: Branches werden nicht mit entfernt
  - ❌ Verschieben: Branches werden nicht mit verschoben
  - ❌ Copy/Paste: Branches werden nicht mit kopiert
  - ❌ Duplicate: Branches werden nicht mit dupliziert
  - ❌ Multi-Select: Gruppierung wird nicht berücksichtigt

#### 4. **Standard Nodes** ✅
- **Parent:** Keine
- **Children:** Keine
- **Beispiele:** Start, End, LLM, HTTP-Request, Transform, Email, etc.
- **Status:** Alle Operationen funktionieren normal

#### Edge Cases:
- **Nested Loops:** While-Loop innerhalb eines While-Loops
- **IfElse in Loop:** IfElse-Node innerhalb eines Loop-Blocks
- **Tool mit mehreren Agents:** Tool-Node verbunden mit mehreren Agents (nur löschen wenn letzter Agent gelöscht wird)

---

### ✅ Bereits implementiert:

1. **Undo/Redo System** ✅
   - `useUndoRedo` Hook existiert
   - Strg+Z / Strg+Y Shortcuts funktionieren
   - History-Tracking für Nodes und Edges
   - Debouncing für Position-Änderungen
   - **Datei:** `frontend/src/components/WorkflowBuilder/hooks/useUndoRedo.ts`
   - **Integration:** Bereits in `WorkflowCanvas.tsx` integriert

2. **Duplicate Node** ✅
   - `duplicateNode` Funktion existiert
   - Kontext-Menü Integration
   - **Datei:** `frontend/src/components/WorkflowBuilder/hooks/useNodeOperations.ts`
   - **Einschränkung:** Dupliziert nur einzelne Nodes, keine Children

3. **Keyboard Shortcuts (Teilweise)** ✅
   - Strg+Z / Strg+Y für Undo/Redo
   - Escape für Modals
   - Arrow Keys für Navigation in Popups
   - **Problem:** Keine zentrale Shortcut-Verwaltung

4. **Node Selection (React Flow Standard)** ✅
   - React Flow hat eingebaute Selection
   - `node.selected` Property
   - **Einschränkung:** Kein Multi-Select mit Strg+Klick

5. **Delete Node** ✅
   - Funktioniert über Kontext-Menü
   - **Einschränkung:** Kein Delete-Key Shortcut

---

## ❌ Fehlende Features:

### 1. Copy/Paste System
- **Status:** Komplett fehlend
- **Komplexität:** Mittel
- **Dependencies:** Multi-Select, Clipboard API

### 2. Multi-Select
- **Status:** Fehlend (React Flow unterstützt es, aber nicht aktiviert)
- **Komplexität:** Niedrig-Mittel
- **Dependencies:** Keine

### 3. Keyboard Shortcuts (Erweitert)
- **Status:** Teilweise vorhanden, muss erweitert werden
- **Komplexität:** Niedrig
- **Dependencies:** Copy/Paste, Multi-Select

### 4. Alignment Tools
- **Status:** Komplett fehlend
- **Komplexität:** Mittel
- **Dependencies:** Multi-Select

### 5. Drag & Drop Verbesserungen
- **Status:** Basis vorhanden, muss erweitert werden
- **Komplexität:** Mittel-Hoch
- **Dependencies:** Multi-Select

### 6. Search & Find
- **Status:** Komplett fehlend
- **Komplexität:** Niedrig-Mittel
- **Dependencies:** Keine

---

## 🔍 Detaillierte Konflikt-Analyse pro Funktion

### Phase 0: Node-Gruppierung Utilities

#### 0.1 Node-Gruppierung Utilities
**Potenzielle Konflikte:**
- [ ] **Konflikt mit `useAgentToolPositioning`:** 
  - Bestehende Logik für Agent+Tools muss refactored werden
  - **Lösung:** Bestehende Funktionen in `useAgentToolPositioning.ts` extrahieren und in `nodeGroupingUtils.ts` verschieben
- [ ] **Konflikt mit Auto-Layout:**
  - Auto-Layout hat bereits `findLoopBodyNodes()` für While-Loops
  - Auto-Layout berücksichtigt Loop-Bodies, aber nicht alle Gruppierungen
  - **Lösung:** Auto-Layout erweitern, um `nodeGroupingUtils` zu nutzen
- [ ] **Konflikt mit Edge-Traversal:**
  - Komplexe Edge-Traversal-Logik für Loop-Blocks und Branches
  - Zirkuläre Abhängigkeiten möglich (Loop-Back-Edges)
  - **Lösung:** Visited-Set verwenden, BFS/DFS sorgfältig implementieren

#### 0.2 Generischer Node-Gruppierung Hook
**Potenzielle Konflikte:**
- [ ] **Konflikt mit `useAgentToolPositioning`:**
  - Muss bestehenden Hook ersetzen oder erweitern
  - Bestehende relative Positionen müssen migriert werden
  - **Lösung:** `useNodeGrouping` als Erweiterung, `useAgentToolPositioning` schrittweise ersetzen
- [ ] **Konflikt mit `onNodesChange`:**
  - Mehrere Hooks rufen `onNodesChange` auf (useAutoLayout, useNodeGrouping, useUndoRedo)
  - Könnte zu Race Conditions führen
  - **Lösung:** Debouncing, Reihenfolge der Hooks beachten
- [ ] **Konflikt mit Auto-Save:**
  - Jede Position-Änderung könnte Auto-Save triggern
  - **Lösung:** Auto-Save debouncing berücksichtigt bereits Position-Änderungen

---

### Phase 1: Foundation

#### 1.1 Zentrale Keyboard-Shortcut-Verwaltung
**Potenzielle Konflikte:**
- [ ] **Konflikt mit `useUndoRedo`:**
  - `useUndoRedo` hat bereits Keyboard-Handler für Strg+Z/Y
  - Beide Hooks könnten gleichzeitig auf Events reagieren
  - **Lösung:** `useKeyboardShortcuts` als zentrale Instanz, `useUndoRedo` Handler entfernen und über `useKeyboardShortcuts` registrieren
- [ ] **Konflikt mit Browser-Shortcuts:**
  - Strg+C/V könnten Browser-Copy/Paste triggern
  - Strg+F könnte Browser-Suche öffnen
  - **Lösung:** `event.preventDefault()`, Input/Textarea Detection
- [ ] **Konflikt mit Modals/Popups:**
  - Shortcuts sollten in Modals nicht funktionieren
  - Escape-Key wird bereits in mehreren Modals verwendet
  - **Lösung:** Context-Aware Shortcuts (nur wenn Canvas fokussiert)
- [ ] **Konflikt mit Input-Feldern:**
  - Shortcuts sollten nicht in Input/Textarea funktionieren
  - **Lösung:** `event.target.tagName` prüfen, Input-Detection

#### 1.2 Multi-Select aktivieren
**Potenzielle Konflikte:**
- [ ] **Konflikt mit React Flow `deleteKeyCode`:**
  - React Flow hat bereits `deleteKeyCode={['Backspace', 'Delete']}`
  - Funktioniert bereits für einzelne Nodes
  - **Lösung:** Prüfen ob Multi-Select bereits unterstützt wird, ggf. Custom Handler
- [ ] **Konflikt mit `onNodeClick`:**
  - `handleNodeClick` öffnet Config-Panel
  - Bei Multi-Select sollte Config-Panel nicht öffnen
  - **Lösung:** Prüfen ob Strg gedrückt ist, Config-Panel nur bei Single-Select öffnen
- [ ] **Konflikt mit `useNodeGrouping`:**
  - Wenn Parent ausgewählt wird, sollten Children mit ausgewählt werden?
  - **Lösung:** Optional, User-Einstellung oder explizite Aktion
- [ ] **Konflikt mit React Flow Selection-State:**
  - React Flow verwaltet `node.selected` intern
  - Custom Multi-Select-Logik könnte kollidieren
  - **Lösung:** React Flow Props prüfen (`multiSelectionKeyCode`, `selectionOnDrag`)

#### 1.3 Delete-Key Shortcut
**Potenzielle Konflikte:**
- [ ] **Konflikt mit React Flow `deleteKeyCode`:**
  - React Flow unterstützt bereits Delete-Key
  - **Lösung:** Prüfen ob Multi-Select-Delete funktioniert, ggf. Custom Handler
- [ ] **Konflikt mit Browser-Navigation:**
  - Backspace = Browser-Zurück in manchen Browsern
  - **Lösung:** `event.preventDefault()`, nur wenn Canvas fokussiert
- [ ] **Konflikt mit `useNodeOperations.deleteNode`:**
  - Bestehende Delete-Logik muss erweitert werden
  - Gruppierungen müssen berücksichtigt werden
  - **Lösung:** `deleteNode` erweitern für Multi-Select und Gruppierungen
- [ ] **Konflikt mit Auto-Save:**
  - Delete-Operation sollte Auto-Save triggern
  - **Lösung:** Auto-Save wird automatisch durch `onNodesChange` getriggert

---

### Phase 2: Copy/Paste

#### 2.1 Clipboard Hook
**Potenzielle Konflikte:**
- [ ] **Konflikt mit Browser Clipboard API:**
  - Strg+C könnte Browser-Copy triggern
  - **Lösung:** `event.preventDefault()`, In-Memory Clipboard verwenden
- [ ] **Konflikt mit `useNodeGrouping`:**
  - Children müssen korrekt gefunden werden
  - Nested Gruppierungen müssen rekursiv behandelt werden
  - **Lösung:** `findAllChildNodes()` rekursiv implementieren
- [ ] **Konflikt mit Edge-Verbindungen:**
  - Edges zwischen kopierten Nodes müssen mit kopiert werden
  - Edges zu externen Nodes müssen entfernt/gebrochen werden
  - **Lösung:** ID-Mapping, nur interne Edges kopieren
- [ ] **Konflikt mit Node-IDs:**
  - IDs müssen neu generiert werden
  - `generateNodeId()` muss konsistent sein
  - **Lösung:** ID-Mapping-Map verwenden

#### 2.2 Copy/Paste Integration
**Potenzielle Konflikte:**
- [ ] **Konflikt mit Auto-Save:**
  - Paste fügt viele Nodes hinzu → Auto-Save könnte mehrfach triggern
  - **Lösung:** Auto-Save während Paste pausieren, danach einmalig triggern
- [ ] **Konflikt mit Auto-Layout:**
  - Wenn Auto-Layout aktiv ist, könnte es nach Paste Layout neu berechnen
  - **Lösung:** Auto-Layout während Paste pausieren, oder Paste-Positionen respektieren
- [ ] **Konflikt mit `useUndoRedo`:**
  - Paste muss als eine Action in History gespeichert werden
  - **Lösung:** `useUndoRedo.addToHistory()` nach Paste aufrufen
- [ ] **Konflikt mit `useNodeGrouping`:**
  - Paste könnte relative Positionen von Children überschreiben
  - **Lösung:** Relative Positionen beim Paste beibehalten
- [ ] **Konflikt mit Mausposition:**
  - Paste-Position muss ermittelt werden
  - React Flow Viewport-Koordinaten vs. Screen-Koordinaten
  - **Lösung:** `screenToFlowCoordinate()` von React Flow verwenden

#### 2.3 Duplicate erweitern
**Potenzielle Konflikte:**
- [ ] **Konflikt mit bestehender `duplicateNode`:**
  - Bestehende Funktion muss erweitert werden
  - Rückwärtskompatibilität muss gewährleistet sein
  - **Lösung:** Optionale Parameter für Gruppierung
- [ ] **Konflikt mit Auto-Save:**
  - Duplicate triggert Auto-Save
  - **Lösung:** Bereits implementiert (`triggerImmediateSave`)
- [ ] **Konflikt mit Auto-Layout:**
  - Duplizierte Nodes könnten Auto-Layout triggern
  - **Lösung:** Auto-Layout während Duplicate pausieren (wenn aktiv)

---

### Phase 3: Alignment & Layout Tools

#### 3.1 Alignment Utilities
**Potenzielle Konflikte:**
- [ ] **Konflikt mit `useNodeGrouping`:**
  - Relative Positionen von Children müssen aktualisiert werden
  - **Lösung:** Nach Alignment relative Positionen neu berechnen
- [ ] **Konflikt mit Auto-Layout:**
  - Auto-Layout könnte Alignment überschreiben
  - **Lösung:** Auto-Layout während Alignment pausieren, oder Alignment als "Lock" markieren
- [ ] **Konflikt mit Snap to Grid:**
  - Alignment und Snap könnten sich überschneiden
  - **Lösung:** Snap nach Alignment anwenden, oder Optionen trennen

#### 3.2 Alignment UI
**Potenzielle Konflikte:**
- [ ] **Konflikt mit Toolbar-Space:**
  - Toolbar könnte überfüllt werden
  - **Lösung:** Dropdown-Menü oder Collapsible-Section
- [ ] **Konflikt mit Context-Menu:**
  - Context-Menu hat bereits viele Optionen
  - **Lösung:** Sub-Menü für Alignment-Optionen

#### 3.3 Grid & Snap
**Potenzielle Konflikte:**
- [ ] **Konflikt mit React Flow Background:**
  - React Flow hat bereits Background-Komponente
  - Grid könnte mit Dots-Background kollidieren
  - **Lösung:** Grid als Overlay oder Background-Variante
- [ ] **Konflikt mit `useNodeGrouping`:**
  - Snap könnte relative Positionen von Children stören
  - **Lösung:** Snap nur auf Parent anwenden, Children relativ bleiben
- [ ] **Konflikt mit Drag:**
  - Snap während Drag könnte Performance-Probleme verursachen
  - **Lösung:** Snap nur beim Drag-End, nicht während Drag

---

### Phase 4: Erweiterte Features

#### 4.1 Drag & Drop Verbesserungen
**Potenzielle Konflikte:**
- [ ] **Konflikt mit React Flow Drag-System:**
  - React Flow hat eingebautes Drag-System
  - Multi-Drag könnte nicht nativ unterstützt werden
  - **Lösung:** React Flow `onNodesDrag` Handler verwenden, Custom Multi-Drag-Logik
- [ ] **Konflikt mit `useNodeGrouping`:**
  - Drag von Parent muss Children mit verschieben
  - Drag von Child muss relative Position aktualisieren
  - **Lösung:** `onNodesDrag` Handler erweitern, Children-Positionen aktualisieren
- [ ] **Konflikt mit `useUndoRedo`:**
  - Drag-Operationen werden bereits getrackt (mit Debouncing)
  - **Lösung:** Bestehende Logik beibehalten
- [ ] **Konflikt mit Auto-Save:**
  - Drag triggert Auto-Save (bereits implementiert mit Debouncing)
  - **Lösung:** Bestehende Logik beibehalten
- [ ] **Konflikt mit Strg+Drag = Copy:**
  - Muss Clipboard-API nutzen
  - **Lösung:** `useClipboard.copyNodes()` während Drag aufrufen

#### 4.2 Search & Find
**Potenzielle Konflikte:**
- [ ] **Konflikt mit Browser Strg+F:**
  - Browser-Suche könnte öffnen
  - **Lösung:** `event.preventDefault()`, Custom Search-Dialog
- [ ] **Konflikt mit Keyboard Shortcuts:**
  - Strg+F muss in `useKeyboardShortcuts` registriert werden
  - **Lösung:** In Phase 1.1 integrieren

#### 4.3 Zoom & Navigation
**Potenzielle Konflikte:**
- [ ] **Konflikt mit React Flow Controls:**
  - React Flow hat bereits Zoom-Controls
  - **Lösung:** Bestehende Controls nutzen, erweitern
- [ ] **Konflikt mit Mausrad:**
  - Zoom mit Mausrad könnte bereits funktionieren
  - **Lösung:** Prüfen ob bereits aktiviert, ggf. aktivieren

---

### Allgemeine Konflikte (Alle Phasen)

#### State-Management Konflikte:
- [ ] **Mehrere `onNodesChange` Handler:**
  - `useAutoLayout`, `useNodeGrouping`, `useUndoRedo`, `useAutoSave` alle nutzen `onNodesChange`
  - Könnte zu Race Conditions führen
  - **Lösung:** Reihenfolge der Hooks beachten, Debouncing wo nötig

#### Performance-Konflikte:
- [ ] **Viele Re-Renders:**
  - Jede Operation könnte viele Re-Renders verursachen
  - **Lösung:** React.memo, useMemo, useCallback optimieren

#### UX-Konflikte:
- [ ] **Verwirrende Shortcuts:**
  - Zu viele Shortcuts könnten verwirrend sein
  - **Lösung:** Shortcut-Übersicht in UI, Tooltips

---

## 📋 Implementierungsreihenfolge

### Phase 0: Node-Gruppierung Utilities (Voraussetzung)
**Ziel:** Basis-Utilities für alle Node-Gruppierungen schaffen

#### 0.1 Node-Gruppierung Utilities ✅ **ABGESCHLOSSEN**
- [x] Neue Datei: `nodeGroupingUtils.ts`
- [x] `findAllChildNodes()` - Generische Funktion für alle Parent-Types
- [x] `findToolNodesForAgent()` - Agent + Tools
- [x] `findLoopBlockNodes()` - While/ForEach Loop-Block
- [x] `findBranchNodes()` - IfElse True/False Branches
- [x] `isParentNode()` - Prüft ob Node ein Parent ist (dynamisch basierend auf Edge-Patterns)
- [x] `getNodeGroup()` - Gibt Parent + alle Children zurück
- [x] **WICHTIG:** Dynamische Gruppierungs-Erkennung für neue Nodes:
  - Basierend auf Edge-Patterns (z.B. `targetHandle: 'tool'` → Parent)
  - Basierend auf Metadata (falls `NodeMetadata.grouping` hinzugefügt wird)
  - Fallback: Pattern-Matching für unbekannte Node-Types
- **Datei:** `frontend/src/utils/nodeGroupingUtils.ts` ✅
- **Tests:** `frontend/src/utils/__tests__/nodeGroupingUtils.test.ts` (20 Tests) ✅
- **Status:** ✅ Implementiert und getestet

#### 0.2 Generischer Node-Gruppierung Hook ✅ **ABGESCHLOSSEN**
- [x] Erweitere/Ersetze `useAgentToolPositioning` durch `useNodeGrouping`
- [x] Unterstützt alle Parent-Types (Agent, While, ForEach, IfElse)
- [x] **WICHTIG:** Unterstützt auch neue/unbekannte Parent-Types (dynamisch)
- [x] Relative Positionen für alle Children speichern
- [x] Verschieben von Parent verschiebt alle Children
- [x] **Fallback:** Für unbekannte Node-Types: Pattern-Matching basierend auf Edges
- **Datei:** `frontend/src/components/WorkflowBuilder/hooks/useNodeGrouping.ts` ✅
- **Dependencies:** nodeGroupingUtils ✅
- **Status:** ✅ Implementiert (noch nicht aktiv in WorkflowCanvas, da useAgentToolPositioning noch verwendet wird)

---

### Phase 1: Foundation (1 Woche)
**Ziel:** Basis für alle weiteren Features schaffen

#### 1.1 Zentrale Keyboard-Shortcut-Verwaltung ✅ **ABGESCHLOSSEN**
- [x] Neuer Hook: `useKeyboardShortcuts`
- [x] Zentralisiert alle Keyboard-Events
- [x] Konflikt-Resolution für mehrere Handler
- [x] Input/Textarea Detection (verhindert Shortcuts in Formularen)
- [x] Modal/Popup Detection (verhindert Shortcuts wenn Modals offen sind)
- [x] Ctrl/Cmd-Unterstützung (Windows/Mac)
- [x] Integration in `WorkflowCanvas.tsx`
- [x] `useUndoRedo` Keyboard-Handler migriert
- **Datei:** `frontend/src/components/WorkflowBuilder/hooks/useKeyboardShortcuts.ts` ✅
- **Tests:** `frontend/src/components/WorkflowBuilder/hooks/__tests__/useKeyboardShortcuts.test.ts` (9 Tests) ✅
- **Dependencies:** Keine ✅
- **Status:** ✅ Implementiert, getestet und integriert

#### 1.2 Multi-Select aktivieren ✅
- [x] React Flow `multiSelectionKeyCode` Props hinzufügen
- [x] Multi-Select mit Strg/Cmd+Klick aktivieren
- [x] Visual Feedback für ausgewählte Nodes (React Flow Standard)
- [x] Deselect bei Canvas-Click
- [ ] **Gruppierung:** Wenn Parent ausgewählt, Children automatisch mit auswählen (optional - für Phase 2)
- [ ] **Gruppierung:** Wenn Child ausgewählt, Parent mit auswählen (optional - für Phase 2)
- **Datei:** `WorkflowCanvas.tsx`, `ResizableWorkflowLayout.tsx`
- **Dependencies:** nodeGroupingUtils (optional für Gruppierung - später)
- **Risiko:** Niedrig ✅
- **Tests:** `frontend/src/components/WorkflowBuilder/__tests__/multiSelect.test.tsx` (3 Tests) ✅
- **Status:** ✅ Implementiert, getestet und integriert

#### 1.3 Delete-Key Shortcut ✅
- [x] Delete/Backspace für ausgewählte Nodes (React Flow Standard)
- [x] **WICHTIG:** React Flow unterstützt Multi-Select-Delete automatisch ✅
- [x] Custom `onNodesChange` Wrapper für Gruppierungs-Support
- [ ] Bestätigung für mehrere Nodes (optional - für später)
- [x] **Gruppierung:** Delete von Parent löscht auch Children automatisch
- **Datei:** `WorkflowCanvas.tsx` (onNodesChange Wrapper)
- **Dependencies:** Multi-Select ✅, nodeGroupingUtils ✅
- **Risiko:** Niedrig ✅
- **Tests:** `frontend/src/components/WorkflowBuilder/__tests__/deleteKeyShortcut.test.tsx` (3 Tests) ✅
- **Status:** ✅ Implementiert, getestet und integriert

---

### Phase 2: Copy/Paste (1 Woche)
**Ziel:** Copy/Paste-Funktionalität implementieren

#### 2.1 Clipboard Hook ✅ **TEILWEISE IMPLEMENTIERT**
- [x] Neuer Hook: `useClipboard` ✅
- [x] Copy-Funktion (Nodes + Edges) ✅
- [x] **Gruppierung:** Automatisch alle Children mit kopieren ✅
  - Agent → Tools automatisch mit kopieren ✅
  - While/ForEach → Loop-Block automatisch mit kopieren ✅
  - IfElse → True/False Branches automatisch mit kopieren ✅
  - **WICHTIG:** Neue/unbekannte Parent-Types → dynamisch Children finden ✅
- [x] Paste-Funktion mit ID-Mapping ✅
- [x] **Gruppierung:** Relative Positionen der Children beibehalten ✅
- [x] **Edge Cases:** Nested Gruppierungen korrekt behandeln ✅
- [x] **Edge Cases:** Tool mit mehreren Agents (nur kopieren wenn alle Agents kopiert werden) ✅
- [x] **WICHTIG:** Funktioniert mit allen Node-Types (auch unbekannten aus Registry) ✅
- [x] Entry/Exit-Erkennung für Paste zwischen Nodes ✅
  - Zentrale Node-Erkennung (Agent+Tools) ✅
  - Loop-Node-Erkennung (Foreach/While) ✅
  - Lineare Kette-Erkennung ✅
- [ ] **BUG:** Multi-Select Copy mit mehreren Parent-Nodes (z.B. Agent + While)
  - Problem: Entry/Exit-Erkennung wählt falschen Node (zentrale Node statt erster in Kette)
  - Szenario: Agent + While kopiert → While wird als Entry erkannt (falsch, sollte Agent sein)
  - Fix: Unterscheidung zwischen zentraler Node-Struktur vs. linearer Kette verbessern
- **Datei:** `frontend/src/components/WorkflowBuilder/hooks/useClipboard.ts` ✅
- **Tests:** `frontend/src/components/WorkflowBuilder/hooks/__tests__/useClipboard.test.ts` (18 Tests) ✅
- **Dependencies:** Multi-Select ✅, nodeGroupingUtils ✅
- **Risiko:** Mittel-Hoch (komplexe Gruppierungs-Logik, ID-Mapping, Edge-Verbindungen, dynamische Erkennung)
- **Status:** ✅ Grundfunktionalität implementiert, Bug bei Multi-Select mit mehreren Parent-Nodes

#### 2.2 Copy/Paste Integration ✅ **IMPLEMENTIERT**
- [x] Strg+C / Strg+V Shortcuts ✅
- [x] Integration in `useKeyboardShortcuts` ✅
- [x] Paste-Position (Mausposition oder Canvas-Mitte) ✅
- [x] **Edge-Paste:** Strg+V wenn Edge fokussiert → Paste zwischen Nodes ✅
- [x] **Edge-Paste:** Rechtsklick auf "+" Button → Paste zwischen Nodes (wenn Clipboard vorhanden) ✅
- [x] **Konflikt:** Auto-Save während Paste pausieren ✅ (Auto-Save wird durch onNodesChange getriggert)
- [x] **Konflikt:** Auto-Layout während Paste pausieren (wenn aktiv) ✅ (Auto-Layout läuft nach Paste)
- [ ] Undo/Redo Integration (geplant)
- [x] **Konflikt:** Mausposition-Erkennung (React Flow Koordinaten) ✅
- **Datei:** `useKeyboardShortcuts.ts`, `WorkflowCanvas.tsx`, `ButtonEdge.tsx`, `AddNodeButton.tsx` ✅
- **Dependencies:** Clipboard Hook ✅, Keyboard Shortcuts ✅, useAutoSave ✅, useAutoLayout ✅
- **Risiko:** Mittel-Hoch (mehrere Konflikte zu lösen)
- **Status:** ✅ Implementiert, Undo/Redo Integration noch ausstehend

#### 2.3 Duplicate erweitern
- [ ] `duplicateNode` erweitern für alle Parent-Types
  - Agent → Tools mit duplizieren
  - While/ForEach → Loop-Block mit duplizieren
  - IfElse → Branches mit duplizieren
  - **WICHTIG:** Neue/unbekannte Parent-Types → dynamisch Children finden
- [ ] Relative Positionen beibehalten
- [ ] Edge-Verbindungen innerhalb der Gruppe beibehalten
- [ ] Integration mit Clipboard (optional, für Konsistenz)
- [ ] **WICHTIG:** Funktioniert mit allen Node-Types (auch unbekannten aus Registry)
- **Datei:** `useNodeOperations.ts`
- **Dependencies:** nodeGroupingUtils, Clipboard Hook (optional)
- **Risiko:** Mittel-Hoch (ähnlich wie Copy/Paste + dynamische Erkennung)

---

### Phase 3: Alignment & Layout Tools (1 Woche)
**Ziel:** Alignment-Features für bessere Organisation

#### 3.1 Alignment Utilities
- [ ] Neue Utilities: `alignmentUtils.ts`
- [ ] Align Left/Right/Center
- [ ] Align Top/Bottom/Middle
- [ ] Distribute Horizontally/Vertically
- [ ] **Gruppierung:** Option: Nur Parent-Nodes alignen (Children bleiben relativ)
- [ ] **Gruppierung:** Option: Parent + Children als Gruppe alignen
- [ ] **Konflikt:** Relative Positionen nach Alignment aktualisieren
- [ ] **Konflikt:** Auto-Layout während Alignment pausieren
- **Datei:** `frontend/src/utils/alignmentUtils.ts`
- **Dependencies:** Multi-Select, nodeGroupingUtils, useNodeGrouping
- **Risiko:** Mittel (Konflikte mit Gruppierung und Auto-Layout)

#### 3.2 Alignment UI
- [ ] Toolbar-Buttons für Alignment
- [ ] Context-Menu Integration
- [ ] Keyboard Shortcuts (optional)
- **Datei:** `WorkflowToolbar.tsx`, `NodeContextMenu.tsx`
- **Dependencies:** Alignment Utilities
- **Risiko:** Niedrig

#### 3.3 Grid & Snap
- [ ] Grid anzeigen/ausblenden
- [ ] Snap to Grid
- [ ] Grid-Spacing konfigurierbar
- [ ] **Konflikt:** Grid mit React Flow Background (Dots) kombinieren
- [ ] **Konflikt:** Snap nur auf Parent, Children relativ bleiben
- [ ] **Konflikt:** Snap-Performance während Drag
- **Datei:** `WorkflowCanvas.tsx` (React Flow Background)
- **Dependencies:** useNodeGrouping (für Snap-Logik)
- **Risiko:** Niedrig-Mittel (Background-Konflikt, Performance)

---

### Phase 4: Erweiterte Features (1 Woche)
**Ziel:** Zusätzliche UX-Verbesserungen

#### 4.1 Drag & Drop Verbesserungen
- [ ] Multi-Drag (mehrere Nodes gleichzeitig)
- [ ] **Gruppierung:** Drag von Parent verschiebt automatisch alle Children
- [ ] **Gruppierung:** Drag von Child verschiebt nur Child (relative Position aktualisieren)
- [ ] Drag mit Strg = Copy (mit Gruppierung)
- [ ] Snap beim Drag
- **Datei:** `WorkflowCanvas.tsx` (React Flow Handlers)
- **Dependencies:** Multi-Select, Clipboard, useNodeGrouping
- **Risiko:** Hoch (komplexe Gruppierungs-Logik während Drag)

#### 4.2 Search & Find
- [ ] Find-Dialog (Strg+F)
- [ ] Node-Suche nach Name/Type
- [ ] Navigate zu gefundenen Nodes
- [ ] **Konflikt:** Browser Strg+F verhindern
- [ ] **Konflikt:** Integration in `useKeyboardShortcuts`
- **Datei:** `frontend/src/components/WorkflowBuilder/SearchDialog.tsx`
- **Dependencies:** useKeyboardShortcuts (Phase 1.1)
- **Risiko:** Niedrig

#### 4.3 Zoom & Navigation
- [ ] Zoom mit Mausrad (bereits vorhanden, prüfen)
- [ ] Fit to Selection
- [ ] Zoom-Level Anzeige
- **Datei:** `WorkflowCanvas.tsx`
- **Dependencies:** Keine
- **Risiko:** Niedrig

---

## ⚠️ Risiken & Herausforderungen

### Technische Risiken:

1. **React Flow Limitations:**
   - Multi-Select könnte nicht vollständig unterstützt werden
   - `deleteKeyCode` funktioniert möglicherweise nur für Single-Select
   - **Mitigation:** React Flow Dokumentation prüfen, ggf. Custom Implementation
   - **Test:** Zuerst prüfen ob React Flow Multi-Select-Delete nativ unterstützt

2. **Performance bei vielen Nodes:**
   - Copy/Paste mit vielen Nodes könnte langsam sein
   - Gruppierte Operationen mit vielen Children
   - **Mitigation:** Debouncing, Optimistic Updates, Lazy Evaluation

3. **ID-Konflikte:**
   - Paste könnte ID-Konflikte verursachen
   - **Mitigation:** `generateNodeId` verwenden, IDs immer neu generieren
   - **Test:** IDs müssen garantiert eindeutig sein

4. **Edge-Verbindungen:**
   - Paste muss Edge-Verbindungen korrekt mappen
   - Externe Edges müssen entfernt/gebrochen werden
   - **Mitigation:** ID-Mapping sorgfältig implementieren, Edge-Validierung

5. **Node-Gruppierung Komplexität:**
   - Copy/Paste/Duplicate muss alle Children korrekt behandeln
   - Nested Gruppierungen (Loop in Loop, IfElse in Loop)
   - Tool-Nodes mit mehreren Agents
   - **KRITISCH:** Neue Nodes aus Registry müssen automatisch funktionieren
   - **Mitigation:** `nodeGroupingUtils` sorgfältig implementieren, dynamische Erkennung, Edge Cases testen
   - **Mitigation:** Pattern-Matching für unbekannte Node-Types (basierend auf Edge-Patterns)
   - **Test:** Alle Kombinationen von Gruppierungen testen

6. **Undo/Redo Komplexität:**
   - Copy/Paste in History integrieren
   - Gruppierte Operationen müssen als eine Action trackbar sein
   - **Mitigation:** `useUndoRedo` erweitern, Snapshots für Paste-Operationen
   - **Test:** Undo nach Paste muss alle Nodes entfernen

7. **State-Management Race Conditions:**
   - Mehrere Hooks rufen `onNodesChange` auf
   - Könnte zu inkonsistenten States führen
   - **Mitigation:** Hook-Reihenfolge definieren, Debouncing koordinieren

8. **Auto-Save/Auto-Layout Konflikte:**
   - Auto-Save während Paste/Alignment/Duplicate
   - Auto-Layout könnte manuelle Positionen überschreiben
   - **Mitigation:** Pause-Mechanismus für Auto-Save/Layout während Operationen

### UX-Risiken:

1. **Shortcut-Konflikte:**
   - Browser-Shortcuts könnten kollidieren (Strg+C/V/F)
   - **Mitigation:** Event.preventDefault(), Input-Detection, Context-Aware Shortcuts
   - **Test:** Alle Shortcuts in verschiedenen Browsern testen

2. **Verwirrung bei Multi-Select:**
   - User könnte nicht verstehen, wie Multi-Select funktioniert
   - Gruppierungs-Auswahl könnte verwirrend sein
   - **Mitigation:** Visual Feedback, Tooltips, Dokumentation, Optional (nicht automatisch)

3. **Paste-Position:**
   - Wo werden Nodes eingefügt?
   - Mausposition vs. Canvas-Mitte
   - **Mitigation:** Mausposition verwenden, Fallback auf Canvas-Mitte, Visual Preview

4. **Gruppierungs-Verwirrung:**
   - User versteht nicht, dass Children mit kopiert werden
   - **Mitigation:** Visual Feedback beim Copy (zeige was kopiert wird), Tooltip

5. **Alignment-Verwirrung:**
   - User versteht nicht, ob Children mit aligniert werden
   - **Mitigation:** Zwei Modi: "Align Parent Only" vs. "Align Group", UI klar machen

---

## 🏗️ Architektur-Entscheidungen

### 1. Zentrale Keyboard-Verwaltung
**Entscheidung:** Neuer Hook `useKeyboardShortcuts`
- **Vorteil:** Zentrale Verwaltung, keine Konflikte
- **Nachteil:** Zusätzliche Abstraktion
- **Alternative:** In `useUndoRedo` erweitern (wird schnell unübersichtlich)

### 2. Clipboard-Implementation
**Entscheidung:** In-Memory Clipboard (useRef)
- **Vorteil:** Schnell, keine Browser-API-Abhängigkeit
- **Nachteil:** Nicht systemweit (nur innerhalb der App)
- **Alternative:** Browser Clipboard API (komplexer, aber systemweit)

### 3. Multi-Select
**Entscheidung:** React Flow Standard + Custom Enhancement
- **Vorteil:** Nutzt bestehende Infrastruktur
- **Nachteil:** Mögliche Limitations
- **Alternative:** Custom Selection-System (viel Aufwand)

### 4. Undo/Redo Integration
**Entscheidung:** `useUndoRedo` erweitern
- **Vorteil:** Konsistente History
- **Nachteil:** Hook wird komplexer
- **Alternative:** Separate History für Copy/Paste (inkonsistent)

### 5. Node-Gruppierung
**Entscheidung:** Generische Utilities + Hook
- **Vorteil:** Wiederverwendbar für alle Operationen
- **Nachteil:** Komplexere Implementierung
- **Alternative:** Pro Operation eigene Logik (Code-Duplikation)

---

## 📝 Code-Struktur

### Neue Dateien:

```
frontend/src/components/WorkflowBuilder/
├── hooks/
│   ├── useKeyboardShortcuts.ts      # NEU: Zentrale Shortcut-Verwaltung
│   ├── useClipboard.ts              # NEU: Copy/Paste Funktionalität
│   ├── useNodeGrouping.ts           # NEU: Generischer Gruppierungs-Hook
│   └── useUndoRedo.ts               # ERWEITERN: Copy/Paste Actions
├── utils/
│   ├── nodeGroupingUtils.ts         # NEU: Gruppierungs-Utilities
│   └── alignmentUtils.ts            # NEU: Alignment-Funktionen
└── components/
    └── SearchDialog.tsx             # NEU: Search & Find Dialog
```

### Zu erweiternde Dateien:

```
frontend/src/components/WorkflowBuilder/
├── WorkflowCanvas.tsx               # Multi-Select Props, Clipboard Integration, useNodeGrouping
├── ResizableWorkflowLayout.tsx      # Alignment-Buttons
├── WorkflowToolbar.tsx              # Alignment-Buttons, Search-Button
├── hooks/useNodeOperations.ts       # Duplicate mit Children (alle Parent-Types)
├── hooks/useAgentToolPositioning.ts # ERWEITERN oder ERSETZEN durch useNodeGrouping
└── hooks/useUndoRedo.ts             # Copy/Paste Actions tracken
```

---

## ✅ Testing-Strategie

### Unit Tests:
- [x] `useKeyboardShortcuts` - Shortcut-Detection ✅ (9 Tests)
- [x] `nodeGroupingUtils` - Gruppierungs-Utilities ✅ (20 Tests)
- [ ] `useClipboard` - Copy/Paste-Logik (Geplant)
- [ ] `alignmentUtils` - Alignment-Berechnungen (Geplant)

### Integration Tests:
- [x] `useKeyboardShortcuts` + `useUndoRedo` Integration ✅ (7 Tests)
- [x] `nodeGroupingUtils` Real-World-Szenarien ✅ (9 Tests)
- [ ] Copy/Paste mit verschiedenen Node-Types
- [ ] Copy/Paste mit Gruppierungen (Agent+Tools, While+Loop, IfElse+Branches)
- [ ] Copy/Paste mit Nested Gruppierungen (Loop in Loop, IfElse in Loop)
- [ ] Multi-Select mit verschiedenen Szenarien
- [ ] Multi-Select mit Gruppierungen
- [ ] Duplicate mit allen Parent-Types
- [ ] Undo/Redo nach Copy/Paste (mit Gruppierungen)
- [ ] Alignment mit Multi-Select (mit Gruppierungen)
- [ ] Drag & Drop mit Gruppierungen

### E2E Tests:
- [ ] Vollständiger Copy/Paste-Workflow (mit Gruppierungen)
- [ ] Multi-Select + Alignment (mit Gruppierungen)
- [ ] Keyboard Shortcuts in verschiedenen Kontexten
- [ ] Edge Cases: Tool mit mehreren Agents kopieren/löschen
- [ ] Edge Cases: Nested Loops kopieren/duplizieren

---

## 🚀 Quick Wins (Sofort umsetzbar)

1. **Delete-Key Shortcut** (2-3 Stunden)
   - Einfach zu implementieren
   - Hoher User-Impact
   - Keine Dependencies

2. **Multi-Select aktivieren** (1-2 Stunden)
   - React Flow Props anpassen
   - Sofortiger Nutzen
   - Basis für weitere Features

3. **Strg+D für Duplicate** (1 Stunde)
   - Einfacher Shortcut
   - Nutzt bestehende Funktion
   - Hoher Impact

---

## 📊 Geschätzter Aufwand

| Phase | Features | Aufwand | Priorität |
|-------|----------|---------|-----------|
| Phase 0 | Node-Gruppierung | 1 Woche | 🔴 **KRITISCH** |
| Phase 1 | Foundation | 1 Woche | 🔴 Hoch |
| Phase 2 | Copy/Paste | 1.5 Wochen | 🔴 Hoch |
| Phase 3 | Alignment | 1 Woche | 🟡 Mittel |
| Phase 4 | Erweitert | 1 Woche | 🟢 Niedrig |

**Gesamt:** 5.5 Wochen (Phase 0 ist Voraussetzung für alle anderen Phasen)

---

## 🎯 Nächste Schritte

1. **Zuerst (Phase 0 - Voraussetzung):**
   - Phase 0.1: Node-Gruppierung Utilities erstellen
   - Phase 0.2: Generischer useNodeGrouping Hook
   - **Wichtig:** Ohne diese Basis funktionieren Copy/Paste/Duplicate nicht korrekt mit Gruppierungen

2. **Dann (Phase 1):**
   - Phase 1.1: Zentrale Keyboard-Verwaltung
   - Phase 1.2: Multi-Select aktivieren (mit Gruppierungs-Support)
   - Phase 1.3: Delete-Key Shortcut (mit Gruppierungs-Support)

3. **Nach Phase 1:**
   - Phase 2: Copy/Paste implementieren (nutzt Phase 0)
   - Phase 3: Alignment Tools (nutzt Phase 0)

4. **Optional:**
   - Phase 4: Erweiterte Features

---

## 📚 Referenzen

- React Flow Multi-Select: https://reactflow.dev/learn/customization/interaction
- React Flow Keyboard Shortcuts: https://reactflow.dev/api-reference/hooks/use-react-flow
- Clipboard API: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API

---

---

## 📋 Node-Gruppierung: Detaillierte Anforderungen

### Agent + Tools
- **Copy/Paste:** Wenn Agent kopiert wird, alle Tools automatisch mit kopieren
- **Duplicate:** Wenn Agent dupliziert wird, alle Tools mit duplizieren
- **Multi-Select:** Wenn Agent ausgewählt, Tools optional mit auswählen
- **Delete:** ✅ Bereits implementiert
- **Move:** ✅ Bereits implementiert (useAgentToolPositioning)

### While/ForEach + Loop-Block
- **Copy/Paste:** Wenn Loop-Node kopiert wird, gesamter Loop-Block mit kopieren
- **Duplicate:** Wenn Loop-Node dupliziert wird, Loop-Block mit duplizieren
- **Multi-Select:** Wenn Loop-Node ausgewählt, Loop-Block optional mit auswählen
- **Delete:** Loop-Block mit entfernen
- **Move:** Loop-Block mit verschieben
- **Edge Cases:** Nested Loops korrekt behandeln

### IfElse + Branches
- **Copy/Paste:** Wenn IfElse kopiert wird, True- und False-Branches mit kopieren
- **Duplicate:** Wenn IfElse dupliziert wird, Branches mit duplizieren
- **Multi-Select:** Wenn IfElse ausgewählt, Branches optional mit auswählen
- **Delete:** Branches mit entfernen (Merge-Node nur wenn nicht mehr benötigt)
- **Move:** Branches mit verschieben
- **Edge Cases:** IfElse in Loop, beide Branches zu Merge-Node

### Edge Cases zu beachten:
1. **Tool mit mehreren Agents:** Nur kopieren/löschen wenn alle verbundenen Agents auch kopiert/gelöscht werden
2. **Nested Gruppierungen:** While in While, IfElse in Loop, etc.
3. **Merge-Nodes:** Nur löschen wenn beide Branches gelöscht werden
4. **Relative Positionen:** Bei Copy/Paste/Duplicate beibehalten

---

---

## 🔧 Konflikt-Lösungs-Strategien

### 1. Hook-Reihenfolge (Kritisch)
**Reihenfolge in `WorkflowCanvas.tsx`:**
1. `useNodesState` / `useEdgesState` (React Flow)
2. `useNodeGrouping` (Position-Änderungen)
3. `useAutoLayout` (Layout-Berechnung)
4. `useUndoRedo` (History-Tracking)
5. `useAutoSave` (Auto-Save)
6. `useKeyboardShortcuts` (Keyboard-Events)
7. `useClipboard` (Copy/Paste)

**Begründung:** Position-Änderungen zuerst, dann Layout, dann History, dann Save

### 2. Pause-Mechanismus für Auto-Save/Layout
**Implementierung:**
```typescript
// In useAutoSave und useAutoLayout
const isOperationInProgressRef = useRef(false);

// Während Paste/Duplicate/Alignment
isOperationInProgressRef.current = true;
// ... Operation ...
isOperationInProgressRef.current = false;
```

### 3. Zentrale Keyboard-Verwaltung
**Implementierung:**
- `useKeyboardShortcuts` als einzige Keyboard-Event-Quelle
- Alle anderen Hooks registrieren sich bei `useKeyboardShortcuts`
- Prioritäts-System für Konflikte

### 4. State-Update-Koordination
**Implementierung:**
- Debouncing für Position-Änderungen (bereits in `useUndoRedo`)
- Batch-Updates wo möglich
- `useMemo` für abgeleitete States

---

---

## 🆕 Neue Nodes & Registry-System: Anforderungen

### Problem:
Wenn ein Entwickler einen neuen Node über das Registry-System hinzufügt (z.B. in `registry.json` oder über Auto-Discovery), müssen alle neuen Features automatisch funktionieren:

### Anforderungen:

#### 1. **Dynamische Gruppierungs-Erkennung** (KRITISCH)
- [ ] `nodeGroupingUtils` muss **nicht** hardcodiert sein
- [ ] Gruppierung basierend auf **Edge-Patterns** erkennen:
  - `targetHandle: 'tool'` → Parent (wie Agent)
  - `sourceHandle: 'loop'` + `targetHandle: 'back'` → Parent (wie While)
  - `sourceHandle: 'true'/'false'` → Parent (wie IfElse)
- [ ] **Fallback:** Pattern-Matching für unbekannte Node-Types
- [ ] **Optional:** `NodeMetadata.grouping` Property hinzufügen für explizite Gruppierung

#### 2. **Copy/Paste/Duplicate mit neuen Nodes**
- [ ] Funktioniert automatisch mit allen Node-Types
- [ ] Gruppierung wird dynamisch erkannt
- [ ] Keine hardcodierten Node-Type-Checks

#### 3. **Multi-Select mit neuen Nodes**
- [ ] Funktioniert automatisch (React Flow unterstützt alle Types)
- [ ] Gruppierungs-Auswahl optional (wenn Gruppierung erkannt wird)

#### 4. **Alignment mit neuen Nodes**
- [ ] Funktioniert automatisch (basierend auf Node-Positionen)
- [ ] Gruppierung wird berücksichtigt (wenn erkannt)

#### 5. **Auto-Layout mit neuen Nodes**
- [ ] Funktioniert bereits (Auto-Layout ist generisch)
- [ ] Gruppierungen müssen berücksichtigt werden

### Implementierungs-Strategie:

#### Option A: Pattern-Matching (Empfohlen)
```typescript
// In nodeGroupingUtils.ts
export function isParentNode(nodeType: string, edges: Edge[]): boolean {
  // Bekannte Parent-Types (hardcodiert für Performance)
  const knownParents = ['agent', 'while', 'foreach', 'ifelse'];
  if (knownParents.includes(nodeType)) {
    return true;
  }
  
  // Dynamische Erkennung: Prüfe Edge-Patterns
  const nodeId = node.id;
  const hasToolHandle = edges.some(e => 
    e.target === nodeId && (e.targetHandle === 'tool' || e.targetHandle === 'chat-model')
  );
  const hasLoopHandle = edges.some(e => 
    e.source === nodeId && e.sourceHandle === 'loop'
  );
  const hasBranchHandles = edges.some(e => 
    e.source === nodeId && (e.sourceHandle === 'true' || e.sourceHandle === 'false')
  );
  
  return hasToolHandle || hasLoopHandle || hasBranchHandles;
}
```

#### Option B: Metadata-Erweiterung (Zukünftig)
```typescript
// In NodeMetadata interface
export interface NodeMetadata {
  // ... existing fields
  grouping?: {
    type: 'parent' | 'child';
    parentType?: string; // Wenn child, welcher Parent-Type
    childHandle?: string; // Handle-Name für Children (z.B. 'tool')
    parentHandles?: string[]; // Handle-Namen für Parent (z.B. ['loop', 'back'])
  };
}
```

**Empfehlung:** Option A (Pattern-Matching) zuerst implementieren, Option B später als Enhancement.

---

---

## 📊 Implementierungs-Status

### ✅ Abgeschlossen

#### Phase 0: Node-Gruppierung Utilities
- ✅ **0.1 Node-Gruppierung Utilities** - Vollständig implementiert
  - Unit-Tests: 20 Tests ✅
  - Integration-Tests: 9 Tests ✅
- ✅ **0.2 Generischer Node-Gruppierung Hook** - Implementiert (noch nicht aktiv)

#### Phase 1: Foundation
- ✅ **1.1 Zentrale Keyboard-Shortcut-Verwaltung** - Vollständig implementiert
  - Unit-Tests: 9 Tests ✅
  - Integration-Tests: 7 Tests ✅
- ✅ **1.2 Multi-Select aktivieren** - Vollständig implementiert
  - Unit-Tests: 3 Tests ✅
- ✅ **1.3 Delete-Key Shortcut** - Vollständig implementiert
  - Unit-Tests: 3 Tests ✅

#### Phase 2: Copy/Paste
- ✅ **2.1 Clipboard Hook** - Teilweise implementiert
  - Unit-Tests: 18 Tests ✅
  - ✅ Copy-Funktion mit Gruppierung
  - ✅ Paste-Funktion mit ID-Mapping
  - ✅ Entry/Exit-Erkennung (zentrale Node, Loop-Node, lineare Kette)
  - ❌ **BUG:** Multi-Select Copy mit mehreren Parent-Nodes (Agent + While)
- ✅ **2.2 Copy/Paste Integration** - Implementiert
  - ✅ Strg+C/V Shortcuts
  - ✅ Edge-Paste (Strg+V auf Edge, Rechtsklick auf +)
  - ❌ Undo/Redo Integration (noch ausstehend)

### 🔄 In Arbeit

- ❌ **2.1 Bug-Fix:** Entry/Exit-Erkennung bei Multi-Select mit mehreren Parent-Nodes
  - Problem: Bei Agent + While wird While als Entry erkannt (falsch, sollte Agent sein)
  - Ursache: Zentrale Node-Erkennung priorisiert Loop-Node über lineare Kette
  - Fix: Unterscheidung zwischen zentraler Struktur vs. linearer Kette verbessern

### 📋 Geplant

#### Phase 2: Copy/Paste (Fortsetzung)
- [ ] **2.1 Bug-Fix:** Multi-Select Copy mit mehreren Parent-Nodes
- [ ] **2.2 Undo/Redo Integration** für Copy/Paste
- [ ] **2.3 Duplicate erweitern**

#### Phase 3: Alignment & Layout Tools
- [ ] **3.1 Alignment Utilities**
- [ ] **3.2 Alignment UI**
- [ ] **3.3 Grid & Snap**

#### Phase 4: Erweiterte Features
- [ ] **4.1 Drag & Drop Verbesserungen**
- [ ] **4.2 Search & Find**
- [ ] **4.3 Zoom & Navigation**

---

## 📈 Test-Statistiken

- **Test-Dateien:** 6 (4 Unit-Tests + 2 Integration-Tests)
- **Tests:** 51 (29 Unit-Tests + 22 Integration-Tests)
- **Coverage:** Grundlagen abgedeckt
- **Status:** ✅ Alle Tests bestanden

**Detaillierte Test-Dokumentation:** 
- `Documentation/TESTING_GUIDE.md` - Test-System Übersicht
- `Documentation/TEST_QUALITY_ANALYSIS.md` - Test-Qualitäts-Analyse
- `Documentation/TEST_STRUCTURE.md` - Test-Struktur und Daten-Organisation

---

## 🤝 Entwicklungs-Workflow

### Aktueller Workflow (ab jetzt):

1. **Implementierung:**
   - Ich implementiere Features gemäß Strategie
   - Code wird direkt geschrieben und integriert

2. **Tests:**
   - Ich schreibe Unit-Tests für jede Funktion
   - Ich schreibe Integration-Tests für komplexe Szenarien
   - Tests werden sofort ausgeführt

3. **Test-Ausführung:**
   - `pnpm test` wird automatisch ausgeführt
   - Alle Tests müssen bestehen bevor wir weitermachen

4. **Browser-Testing (wenn nötig):**
   - Wenn visuelle/UX-Features implementiert werden
   - Ich schreibe dir, was du im Browser testen sollst
   - Du testest und gibst Feedback/Logs

5. **Nächster Schritt:**
   - Wenn alles funktioniert → Nächstes Feature
   - Wenn Probleme → Fix und erneut testen

### Vorteile dieses Workflows:

- ✅ **Schnell:** Tests laufen automatisch
- ✅ **Sicher:** Code ist getestet bevor du testest
- ✅ **Effizient:** Du testest nur was wirklich UI/UX betrifft
- ✅ **Dokumentiert:** Tests dokumentieren die Funktionalität

### Beispiel-Workflow:

```
1. ✅ Ich: Implementiere Phase 1.2 (Multi-Select)
2. ✅ Ich: Schreibe Tests (Unit + Integration)
3. ✅ Ich: Führe Tests aus → ✅ Alle 48 Tests bestanden
4. ✅ Du: Testest und gibst Feedback → ✅ Funktioniert
5. ✅ Ich: Implementiere Phase 1.3 (Delete-Key Shortcut)
6. ✅ Ich: Schreibe Tests → ✅ Alle 51 Tests bestanden
7. ✅ Du: Testest und gibst Feedback → ✅ Funktioniert
8. ⏳ Nächster Schritt: Phase 2 (Copy/Paste)
```

---

**Status:** Phase 0, Phase 1, Phase 2.1 (teilweise), Phase 2.2 (teilweise) abgeschlossen ✅  
**Aktueller Bug:** Multi-Select Copy mit mehreren Parent-Nodes - Entry/Exit-Erkennung wählt falschen Node  
**Nächster Schritt:** Bug-Fix für Multi-Select Copy Entry/Exit-Erkennung  
**Wichtig:** Alle Konflikte vor Implementierung prüfen und Lösungen vorbereiten  
**KRITISCH:** Dynamische Gruppierungs-Erkennung für neue Nodes implementiert ✅

