# VariableTreePopover Optimierungs-Checkliste

Basierend auf dem Vergleich mit dem Beispielprojekt (DataSelector) und der Analyse der aktuellen Implementierung.

## Priorität: Hoch (Kritische Features)

### 1. Suchfunktion ✅
- [x] **Search Input hinzufügen**
  - [x] Input-Feld im Header der VariableTreePopover
  - [x] Rekursive Filterung durch alle Nodes
  - [x] Suche in Display-Namen (`keyName`, `n.data?.label`)
  - [x] Suche in Wert-Vorschauen (`getValuePreview()`)
  - [x] Case-insensitive Suche
  - [x] Auto-Expand bei Suche (expandiere Nodes die Matches enthalten, depth <= 1)
  - [x] Empty State: "No matching data" wenn nichts gefunden
  - [x] Clear-Button zum Löschen der Suche

**Referenz:** DataSelector implementiert vollständige Suche mit Auto-Expand

### 2. Keyboard-Navigation ✅
- [x] **Tastatur-Support für Accessibility**
  - [x] Arrow Up/Down: Navigation zwischen Nodes
  - [x] Arrow Left/Right: Expand/Collapse
  - [x] Enter/Space: Select/Insert Variable
  - [x] Escape: Close Popover
  - [x] Tab: Navigation zwischen Sections
  - [x] Focus-Management: Sichtbarer Focus-Indikator
  - [x] Focus-Trap: Focus bleibt im Popover

**Referenz:** DataSelector unterstützt Enter/Space für Interaktion

### 3. Array Chunking (Performance)
- [ ] **Chunking für große Arrays**
  - [ ] Threshold: Arrays > 20 Items werden gechunkt
  - [ ] Chunk-Größe: 20 Items pro Chunk
  - [ ] Chunk-Display: `[1-20]`, `[21-40]`, etc.
  - [ ] Chunk-Nodes sind expandierbar
  - [ ] Performance-Test: Arrays mit 100+ Items

**Referenz:** DataSelector verwendet MAX_CHUNK_LENGTH = 10

## Priorität: Mittel (UX-Verbesserungen)

### 4. Conditional Node Verbesserungen
- [ ] **Branch-Information anzeigen**
  - [ ] Zeige Branch-Label bei conditional Nodes: "NodeB (true branch)"
  - [ ] Tooltip: "Only available on true branch of IfElse"
  - [ ] Visueller Indikator: Icon oder Badge für Branch-Info
  - [ ] Wenn IfElse Node verfügbar: Zeige `result: true/false` im Output

- [ ] **Warnung bei conditional Variables**
  - [ ] Warnung beim Insert: "This variable may not be available"
  - [ ] Optional: Bestätigungs-Dialog für conditional Variables
  - [ ] Visual Highlight: Conditional Nodes mit leicht anderer Farbe

**Referenz:** Aktuell werden conditional Nodes nur als amber markiert, aber Branch-Info fehlt

### 5. Pfad-Information erweitern
- [ ] **Pfad-Anzeige verbessern**
  - [ ] Zeige alle möglichen Pfade zu einem conditional Node (optional, erweiterte Ansicht)
  - [ ] Tooltip: "Available on paths: [true branch], [false branch]"
  - [ ] Visual Path-Indicator: Zeige welche Branches zum Node führen

**Referenz:** Empfehlung aus Vergleichsanalyse

### 6. IfElse Node Output verbessern
- [ ] **IfElse-spezifische Anzeige**
  - [ ] Zeige `condition` Feld im Output (ursprüngliche Condition-Expression)
  - [ ] Zeige `result` Feld prominent (true/false)
  - [ ] Zeige `output` Feld (Output vom ausgewählten Branch)
  - [ ] Optional: Zeige beide Branch-Outputs wenn verfügbar

**Referenz:** IfElse Node hat spezielle Output-Struktur: `{condition, result, output}`

## Priorität: Niedrig (Nice-to-Have)

### 7. Zipped View für Arrays (Optional)
- [ ] **Zipped View für Arrays von Objekten**
  - [ ] Erkennung: Array mit Objekten als Items
  - [ ] Analyse: Extrahiere alle unique Keys aus allen Objekten
  - [ ] Merge: Zeige gemeinsame Properties als einzelne Nodes
  - [ ] Beispiel: `[{a:1,b:2}, {a:3,c:4}]` → zeigt `a`, `b`, `c`
  - [ ] Optional: Toggle zwischen Zipped View und normaler Ansicht

**Referenz:** DataSelector implementiert `convertArrayToZippedView()`

**Hinweis:** Kann komplex sein, daher optional. Nur wenn wirklich benötigt.

### 8. Piece-Icons (Optional)
- [ ] **Icons für Nodes anzeigen**
  - [ ] Node-Type-Icons (wenn verfügbar)
  - [ ] Custom-Icons für spezielle Node-Types
  - [ ] Icon-Größe: Klein, nicht aufdringlich
  - [ ] Fallback: Wenn kein Icon verfügbar, kein Platzhalter

**Referenz:** DataSelector zeigt PieceIcon für jeden Step

**Hinweis:** Nur wenn Icon-System bereits vorhanden ist

### 9. Erweiterte Empty States
- [ ] **Bessere Empty States**
  - [ ] "No output data" mit Link zum Testen des Nodes
  - [ ] "No variables available" mit Hinweis zum Verbinden von Nodes
  - [ ] "Search returned no results" mit Tipps zur Suche

**Referenz:** DataSelector zeigt "Go to Step" Button wenn Test fehlt

## Performance-Optimierungen

### 10. Memoization verbessern
- [ ] **Bessere Memoization**
  - [ ] `useMemo` für gefilterte Nodes (bei Suche)
  - [ ] `useMemo` für TreeNode-Rendering (bei großen Bäumen)
  - [ ] `React.memo` für TreeNode-Komponente
  - [ ] Virtualisierung für sehr große Listen (optional)

**Referenz:** DataSelector hat keine Memoization, aber wir sollten es besser machen

### 11. Lazy Loading
- [ ] **Lazy Loading für große Datenstrukturen**
  - [ ] Nodes werden nur gerendert wenn expandiert (bereits implementiert ✓)
  - [ ] Array-Items werden nur gerendert wenn Chunk expandiert ist
  - [ ] Debounce für Suche bei großen Workflows

## Code-Qualität

### 12. TypeScript Verbesserungen
- [ ] **Bessere Typisierung**
  - [ ] Explizite Types für `debugSteps`
  - [ ] Type für `nodeOutput` (statt `any`)
  - [ ] Interface für TreeNode-Struktur
  - [ ] Type Guards für verschiedene Node-Types

### 13. Tests
- [ ] **Unit Tests**
  - [ ] Test für Dominator Analysis
  - [ ] Test für Upstream-Nodes-Berechnung
  - [ ] Test für Suche-Funktionalität
  - [ ] Test für Array Chunking
  - [ ] Test für Pfad-Generierung

- [ ] **Integration Tests**
  - [ ] Test für IfElse-Branch-Anzeige
  - [ ] Test für Loop-Kontext-Anzeige
  - [ ] Test für Conditional vs. Guaranteed Kategorisierung

### 14. Dokumentation
- [ ] **Code-Dokumentation**
  - [ ] JSDoc für alle wichtigen Funktionen
  - [ ] Kommentare für komplexe Algorithmen (Dominator Analysis)
  - [ ] README für VariableTreePopover-Komponente
  - [ ] Beispiele für verschiedene Use Cases

## Implementierungs-Reihenfolge (Empfohlen)

### Phase 1: Kritische Features (Sprint 1)
1. Suchfunktion (Item 1)
2. Keyboard-Navigation (Item 2)
3. Array Chunking (Item 3)

### Phase 2: UX-Verbesserungen (Sprint 2)
4. Conditional Node Verbesserungen (Item 4)
5. Pfad-Information erweitern (Item 5)
6. IfElse Node Output verbessern (Item 6)

### Phase 3: Performance & Qualität (Sprint 3)
7. Memoization verbessern (Item 10)
8. Lazy Loading (Item 11)
9. TypeScript Verbesserungen (Item 12)
10. Tests (Item 13)

### Phase 4: Optional Features (Backlog)
11. Zipped View (Item 7) - nur wenn benötigt
12. Piece-Icons (Item 8) - nur wenn Icon-System vorhanden
13. Erweiterte Empty States (Item 9)
14. Dokumentation (Item 14)

## Wichtige Hinweise

### Was NICHT ändern:
- ✅ **Dominator Analysis beibehalten** - Das ist ein großer Vorteil!
- ✅ **Kategorisierung (Start/Guaranteed/Conditional) beibehalten** - Sehr wertvoll
- ✅ **Resizable-Funktionalität beibehalten** - Bessere UX als feste Größen
- ✅ **Intelligente Positionierung beibehalten** - Vermeidet Overlaps
- ✅ **Loop-Kontext Section beibehalten** - Explizite Anzeige ist besser

### Was übernehmen:
- ✅ Suchfunktion aus DataSelector
- ✅ Keyboard-Navigation aus DataSelector
- ✅ Chunking-Konzept (aber mit höherem Threshold: 20 statt 10)

### Was NICHT übernehmen:
- ❌ "Ein Pfad"-Ansatz - Unser "Alle Pfade"-Ansatz ist besser
- ❌ Feste Positionierung - Unsere intelligente Positionierung ist besser
- ❌ Feste Größen-Modi - Unser Resizable ist besser
- ❌ Schema-basierte Daten - Wir zeigen nur tatsächliche Daten (besser)

## Metriken für Erfolg

### Vor Optimierung messen:
- [ ] Durchschnittliche Anzahl Nodes in großen Workflows
- [ ] Durchschnittliche Array-Größen
- [ ] Render-Zeit für große Variable Trees
- [ ] User-Feedback zur Findbarkeit von Variablen

### Nach Optimierung messen:
- [ ] Verbesserte Render-Performance (Ziel: < 100ms für 50 Nodes)
- [ ] Reduzierte Suche-Zeit (Ziel: < 50ms für große Workflows)
- [ ] User-Satisfaction (Ziel: 80%+ finden Variablen schneller)
- [ ] Accessibility-Score (Ziel: WCAG AA)

## Notizen

- **Chunking Threshold:** 20 Items (höher als DataSelector's 10) weil wir bessere Performance haben
- **Suche:** Sollte auch in verschachtelten Objekten suchen
- **Keyboard-Navigation:** Wichtig für Accessibility und Power-Users
- **Branch-Info:** Wird besonders wichtig bei komplexen Workflows mit vielen IfElse Nodes

