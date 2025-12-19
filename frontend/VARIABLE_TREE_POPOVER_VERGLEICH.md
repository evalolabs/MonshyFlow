# Vergleich: VariableTreePopover vs. DataSelector

## Übersicht

Beide Komponenten dienen der Anzeige und Auswahl von Variablen/Daten in einem Workflow-Builder, unterscheiden sich aber erheblich in Design, Funktionalität und Architektur.

## Architektur-Unterschiede

### VariableTreePopover (MonshyFlow)
- **Typ**: Popover/Modal-Komponente
- **Positionierung**: Dynamisch positioniert relativ zu einem Anker-Element (`anchorEl`)
- **Rendering**: Verwendet `createPortal` für Rendering außerhalb des DOM-Baums
- **Größe**: Resizable mit Drag-Handle am unteren Rand
- **Sichtbarkeit**: Wird explizit geöffnet/geschlossen über Props

### DataSelector (Beispielprojekt)
- **Typ**: Docked Panel/Sidebar-Komponente
- **Positionierung**: Fest positioniert (bottom-right, absolut)
- **Rendering**: Direkt im DOM-Baum
- **Größe**: Drei Modi: COLLAPSED, DOCKED (450px), EXPANDED (parentHeight - 100px)
- **Sichtbarkeit**: Automatisch sichtbar wenn Text-Input mit Mentions fokussiert ist

## Datenstruktur

### VariableTreePopover
```typescript
// Einfache rekursive Struktur
interface TreeNodeProps {
  path: string;        // z.B. "steps.nodeId.json" oder "$node[\"NodeName\"].json"
  keyName: string;     // z.B. "field" oder "[0]"
  value: any;          // Der tatsächliche Wert
  onPick: (path: string) => void;
}
```

**Eigenschaften:**
- Direkte Traversierung von Objekten/Arrays
- Pfade werden dynamisch aufgebaut
- Unterstützt beide Syntaxen: `steps.nodeId.json.field` und `$node["NodeName"].json.field`
- Zeigt nur Daten aus `debugSteps` (tatsächliche Ausgaben)

### DataSelector
```typescript
// Komplexere Baumstruktur mit Metadaten
type DataSelectorTreeNode = {
  key: string;
  data: DataSelectorTreeNodeDataUnion;  // 'value' | 'chunk' | 'test'
  children?: DataSelectorTreeNode[];
  isLoopStepNode?: boolean;
}

type DataSelectorTreeNodeData = {
  type: 'value';
  value: string | unknown;
  displayName: string;
  propertyPath: string;  // z.B. "stepName['field']"
  insertable: boolean;
}
```

**Eigenschaften:**
- Vorkonstruierte Baumstruktur mit Metadaten
- Unterstützt "Chunks" für große Arrays (MAX_CHUNK_LENGTH = 10)
- Spezielle Behandlung für Loop-Nodes
- Zeigt Test-Steps wenn Daten fehlen
- "Zipped View" für Arrays von Objekten (merged properties)

## Datenquelle

### VariableTreePopover
- **Primär**: `debugSteps` - tatsächliche Ausgaben aus Workflow-Execution
- **Fallback**: `data` (wenn kein currentNodeId)
- **Loop-Kontext**: Wird aus `debugSteps` oder aus Loop-Node-Output abgeleitet
- **Keine Schema-Daten**: Zeigt nur was tatsächlich vorhanden ist

### DataSelector
- **Primär**: `outputSampleData` - Sample-Daten aus Flow-Version
- **Quelle**: `sampleData` aus Step-Settings
- **Test-Modus**: Zeigt "Test Step" Section wenn `lastTestDate` fehlt
- **Schema-basiert**: Kann auch Schema-Daten verwenden

## UI/UX-Unterschiede

### VariableTreePopover

**Sektionen:**
1. **Current Input** (purple) - Loop-Kontext wenn verfügbar
2. **Start** (gray) - Start-Nodes
3. **Guaranteed** (green) - Nodes die immer ausgeführt werden
4. **Conditional** (amber) - Nodes die möglicherweise nicht ausgeführt werden

**Features:**
- Expand/Collapse All Nodes Button
- Resize-Handle am unteren Rand
- Intelligente Positionierung (vermeidet Config-Panel)
- Zeigt Feld-Anzahl pro Node
- "No output data" Message wenn keine Daten vorhanden

**Interaktion:**
- Klick auf TreeNode → Insert Variable
- Expand/Collapse per Button
- Sections können expandiert/collapsed werden

### DataSelector

**Struktur:**
- Lineare Liste aller Steps im Pfad zum aktuellen Step
- Jeder Step als Node mit Icon (PieceIcon)
- Test-Step Section wenn Daten fehlen

**Features:**
- Suchfunktion (Search Input)
- Drei Größen-Modi (Collapsed/Docked/Expanded)
- "Insert" Button (erscheint on hover)
- Zeigt Wert-Vorschau für primitive Werte
- Chunking für große Arrays

**Interaktion:**
- Klick auf Node → Expand/Collapse
- Klick auf "Insert" Button → Insert Mention
- Auto-Expand bei Suche (depth <= 1)
- Keyboard-Navigation (Enter/Space)

## Pfad-Generierung

### VariableTreePopover
```typescript
// Einfache String-Konkatenation
const fullPath = path 
  ? (keyName.startsWith('[') ? `${path}${keyName}` : `${path}.${keyName}`)
  : keyName;

// Unterstützt:
// - steps.nodeId.json.field
// - $node["NodeName"].json.field
// - loop.current.field
// - loop.array[0].field
```

### DataSelector
```typescript
// Komplexere Pfad-Generierung mit Escaping
function buildJsonPath(propertyPath: PathSegment[]): string {
  const propertyPathWithoutStepName = propertyPath.slice(1);
  return propertyPathWithoutStepName.reduce((acc, segment) => {
    return `${acc}[${
      typeof segment === 'string'
        ? `'${escapeMentionKey(String(segment))}'`
        : segment
    }]`;
  }, `${propertyPath[0]}`) as string;
}

// Unterstützt:
// - stepName['field']
// - stepName[0]['field']
// - flattenNestedKeys(stepName, ['path', 'to', 'field']) für Arrays
```

## Array-Behandlung

### VariableTreePopover
- **Einfach**: Zeigt alle Array-Items mit Index `[0]`, `[1]`, etc.
- **Kein Chunking**: Alle Items werden angezeigt
- **Keine Zipped View**: Jedes Item wird einzeln traversiert

### DataSelector
- **Chunking**: Arrays > 10 Items werden in Chunks aufgeteilt
  - z.B. `[1-10]`, `[11-20]`, etc.
- **Zipped View**: Arrays von Objekten werden "gezippt"
  - Alle Objekte werden analysiert
  - Gemeinsame Properties werden zusammengeführt
  - Beispiel: `[{a:1,b:2}, {a:3,c:4}]` → zeigt `a`, `b`, `c` als Properties
- **Flatten-Funktion**: Verwendet `flattenNestedKeys()` für verschachtelte Arrays

## Loop-Behandlung

### VariableTreePopover
- **Dedizierte Section**: "Current Input" zeigt Loop-Kontext
- **Struktur**:
  ```typescript
  {
    loop: {
      current: <item>,
      index: <number>,
      array: <full array>
    },
    current: <alias>,
    index: <alias>
  }
  ```
- **Ableitung**: Falls nicht in debugSteps, wird aus Loop-Node-Output abgeleitet

### DataSelector
- **Markierung**: `isLoopStepNode = true` für Loop-Steps
- **Filterung**: `iterations` wird aus Sample-Daten entfernt
- **Keine spezielle UI**: Wird wie normaler Step behandelt

## Suchfunktion

### VariableTreePopover
- **Keine Suche**: Keine Suchfunktion vorhanden

### DataSelector
- **Vollständige Suche**: Sucht in Display-Namen und Werten
- **Filterung**: Rekursiv durch alle Nodes
- **Auto-Expand**: Expandiert Nodes bei Suche (depth <= 1)
- **Empty State**: Zeigt "No matching data" wenn nichts gefunden

## Positionierung & Layout

### VariableTreePopover
- **Intelligente Positionierung**: 
  - Priorität: LEFT > ABOVE > RIGHT > BELOW
  - Vermeidet Config-Panel
  - Berücksichtigt Taskbar/OS Chrome
  - Dynamische maxHeight basierend auf verfügbarem Platz
- **Resizable**: User kann Höhe per Drag ändern
- **Responsive**: Passt sich Viewport an

### DataSelector
- **Fest positioniert**: Bottom-right, absolut
- **Drei Modi**: 
  - COLLAPSED: height = 0px
  - DOCKED: height = 450px, width = 450px
  - EXPANDED: height = parentHeight - 100px, width = parentWidth - 40px
- **Nicht resizable**: Nur über Toggle-Buttons

## Performance

### VariableTreePopover
- **Lazy Rendering**: Nodes werden nur gerendert wenn expandiert
- **Memoization**: `useMemo` für upstreamNodes, guaranteedIds, etc.
- **Portal**: Rendering außerhalb des normalen DOM-Flows

### DataSelector
- **Chunking**: Reduziert DOM-Nodes für große Arrays
- **Filterung**: Effiziente Rekursion für Suche
- **Keine Memoization**: Struktur wird bei jedem Render neu berechnet

## Stärken & Schwächen

### VariableTreePopover - Stärken
✅ Klare Kategorisierung (Start/Guaranteed/Conditional)
✅ Resizable für bessere UX
✅ Intelligente Positionierung
✅ Loop-Kontext explizit sichtbar
✅ Zeigt nur tatsächliche Daten (keine Schemas)
✅ Unterstützt beide Pfad-Syntaxen

### VariableTreePopover - Schwächen
❌ Keine Suchfunktion
❌ Kein Chunking für große Arrays
❌ Alle Array-Items werden angezeigt (kann langsam sein)
❌ Keine Keyboard-Navigation

### DataSelector - Stärken
✅ Suchfunktion
✅ Chunking für große Arrays
✅ Zipped View für Arrays von Objekten
✅ Keyboard-Navigation
✅ Drei Größen-Modi
✅ Test-Step Integration
✅ Piece-Icons für bessere Visualisierung

### DataSelector - Schwächen
❌ Keine Kategorisierung nach Ausführungs-Garantie
❌ Keine explizite Loop-Kontext-Anzeige
❌ Fest positioniert (kann Config-Panel überlappen)
❌ Nicht resizable
❌ Komplexere Datenstruktur

## Empfehlungen für MonshyFlow

### Was übernehmen?
1. **Suchfunktion**: Sehr nützlich für große Workflows
2. **Chunking**: Für Arrays mit vielen Items (> 10)
3. **Keyboard-Navigation**: Accessibility-Plus
4. **Zipped View**: Optional für Arrays von Objekten

### Was behalten?
1. **Kategorisierung**: Start/Guaranteed/Conditional ist sehr wertvoll
2. **Resizable**: Bessere UX als feste Größen
3. **Intelligente Positionierung**: Vermeidet Overlaps
4. **Loop-Kontext Section**: Explizite Anzeige ist besser

### Hybrid-Ansatz
- Behalte die Kategorisierung und intelligente Positionierung
- Füge Suchfunktion hinzu
- Implementiere Chunking für Arrays > 20 Items
- Füge Keyboard-Navigation hinzu
- Behalte Resizable-Funktionalität

## Erreichbarkeit von Variablen bei mehreren Pfaden

### Problemstellung

In Workflows mit conditional branches (If-Else) kann ein Node über **mehrere verschiedene Pfade** erreichbar sein. Die Frage ist: Welche Variablen sind tatsächlich verfügbar, wenn ein Node über verschiedene Pfade erreicht werden kann?

**Beispiel-Szenario:**
```
Start → NodeA → IfElse → [true: NodeB] → NodeD
                    ↓ [false: NodeC] ↗
```

NodeD kann über zwei Pfade erreicht werden:
- Pfad 1: Start → NodeA → IfElse (true) → NodeB → NodeD
- Pfad 2: Start → NodeA → IfElse (false) → NodeC → NodeD

**Frage:** Welche Variablen sind in NodeD verfügbar?
- NodeA: ✅ Immer verfügbar (auf beiden Pfaden)
- NodeB: ❓ Nur verfügbar wenn true-Branch genommen wird
- NodeC: ❓ Nur verfügbar wenn false-Branch genommen wird

### VariableTreePopover (MonshyFlow) - Lösung

**Ansatz: Alle Upstream Nodes + Dominator Analysis**

```typescript
// 1. Findet ALLE upstream Nodes (unabhängig vom Pfad)
const upstreamNodes = useMemo(() => {
  // BFS durch alle eingehenden Edges
  // Findet ALLE Vorgänger, auch wenn sie auf verschiedenen Pfaden sind
  const adjIn: Record<string, string[]> = {};
  edges.forEach(e => { 
    if (adjIn[e.target]) adjIn[e.target].push(e.source); 
  });
  // Traversiert ALLE Pfade rückwärts
  // ...
}, [nodes, edges, currentNodeId]);

// 2. Dominator Analysis - bestimmt welche Nodes IMMER ausgeführt werden
const guaranteedIds = useMemo(() => {
  // Ein Node ist "guaranteed" wenn er auf ALLEN Pfaden zum Ziel-Node vorhanden ist
  // Verwendet klassische Dominator-Analyse aus Compiler-Theorie
  // ...
}, [nodes, edges, currentNodeId]);
```

**Ergebnis:**
- ✅ **Zeigt ALLE erreichbaren Nodes** (auch wenn sie nur auf einem Pfad sind)
- ✅ **Kategorisiert nach Garantie**:
  - **Guaranteed** (grün): Node ist auf ALLEN Pfaden vorhanden → immer verfügbar
  - **Conditional** (amber): Node ist nur auf EINIGEN Pfaden vorhanden → möglicherweise nicht verfügbar
- ✅ **Klarer visueller Unterschied**: User sieht sofort welche Variablen sicher sind

**Beispiel:**
```
NodeD zeigt:
- Start (gray) - immer verfügbar
- NodeA (green/guaranteed) - auf beiden Pfaden → immer verfügbar
- NodeB (amber/conditional) - nur auf true-Pfad → möglicherweise nicht verfügbar
- NodeC (amber/conditional) - nur auf false-Pfad → möglicherweise nicht verfügbar
```

**Vorteile:**
- ✅ Vollständige Information: User sieht ALLE möglichen Variablen
- ✅ Klare Warnung: Conditional Nodes sind markiert
- ✅ Keine versteckten Variablen: Auch Nodes auf alternativen Pfaden werden angezeigt

### DataSelector (Beispielprojekt) - Lösung

**Ansatz: Ein einzelner Pfad**

```typescript
const getDataSelectorStructure = (state: BuilderState) => {
  const { selectedStep, flowVersion } = state;
  // Findet EINEN Pfad zum Ziel-Step
  const pathToTargetStep = flowStructureUtil.findPathToStep(
    flowVersion.trigger,
    selectedStep,
  );
  // Zeigt nur Nodes auf diesem EINEN Pfad
  return pathToTargetStep.map((step) => {
    // ...
  });
};
```

**Ergebnis:**
- ⚠️ **Zeigt nur Nodes auf EINEM Pfad** (der erste gefundene Pfad)
- ⚠️ **Keine Kategorisierung**: Alle Nodes werden gleich behandelt
- ⚠️ **Versteckte Variablen**: Nodes auf alternativen Pfaden werden NICHT angezeigt

**Beispiel:**
```
NodeD zeigt (wenn findPathToStep den true-Pfad findet):
- Start
- NodeA
- IfElse
- NodeB
- NodeD

NodeC wird NICHT angezeigt, obwohl es auf einem alternativen Pfad erreichbar ist!
```

**Probleme:**
- ❌ **Unvollständig**: User sieht nicht alle möglichen Variablen
- ❌ **Irreführend**: Wenn der false-Pfad genommen wird, sind NodeB-Daten nicht verfügbar, aber werden trotzdem angezeigt
- ❌ **Keine Warnung**: User weiß nicht, dass ein Node nur conditional verfügbar ist

### Vergleich

| Aspekt | VariableTreePopover | DataSelector |
|--------|---------------------|-------------|
| **Pfad-Analyse** | Alle Pfade | Ein Pfad |
| **Vollständigkeit** | ✅ Zeigt alle erreichbaren Nodes | ❌ Zeigt nur einen Pfad |
| **Kategorisierung** | ✅ Guaranteed vs. Conditional | ❌ Keine Unterscheidung |
| **Warnung** | ✅ Visuelle Markierung (amber) | ❌ Keine Warnung |
| **Korrektheit** | ✅ Zeigt was wirklich verfügbar ist | ⚠️ Kann irreführend sein |

### Fazit

**VariableTreePopover ist deutlich besser** für die Behandlung von mehreren Pfaden:

1. **Vollständigkeit**: Zeigt ALLE möglichen Variablen, nicht nur die auf einem Pfad
2. **Klarheit**: User sieht sofort welche Variablen sicher sind (guaranteed) und welche nicht (conditional)
3. **Korrektheit**: Dominator Analysis ist ein bewährtes Verfahren aus der Compiler-Theorie
4. **Transparenz**: Keine versteckten Variablen - alles wird angezeigt

**DataSelector hat hier einen kritischen Schwachpunkt:**
- Wenn `findPathToStep` den "falschen" Pfad findet, werden Variablen angezeigt die möglicherweise nicht verfügbar sind
- Nodes auf alternativen Pfaden werden komplett ignoriert
- User hat keine Möglichkeit zu sehen, dass es alternative Pfade gibt

### Empfehlung

**Behalte die aktuelle Implementierung von VariableTreePopover!**

Die Dominator Analysis + Kategorisierung ist ein **deutlicher Vorteil** gegenüber dem einfachen "ein Pfad"-Ansatz. Dies ist besonders wichtig für komplexe Workflows mit vielen conditional branches.

**Mögliche Verbesserungen:**
- Zeige zusätzlich an, auf welchen Pfaden ein conditional Node verfügbar ist
- Zeige Warnung wenn User eine conditional Variable verwendet
- Zeige alle möglichen Pfade visuell an (optional)

## Behandlung von If-Else Nodes

### Problemstellung

If-Else Nodes (bzw. Router Nodes) erzeugen conditional branches im Workflow. Die Frage ist: Wie werden Nodes behandelt, die in verschiedenen Branches eines If-Else Nodes liegen?

**Beispiel-Szenario:**
```
Start → NodeA → IfElse → [true: NodeB → NodeD]
                    ↓ [false: NodeC → NodeD]
```

**Fragen:**
1. Wie wird der IfElse Node selbst behandelt?
2. Wie werden Nodes in den Branches (NodeB, NodeC) behandelt?
3. Wie werden Nodes nach dem Merge (NodeD) behandelt?
4. Werden beide Branches angezeigt oder nur einer?

### VariableTreePopover (MonshyFlow) - Lösung

**Ansatz: Implizite Behandlung durch Dominator Analysis**

```typescript
// If-Else Nodes werden wie normale Nodes behandelt
// Die Dominator Analysis bestimmt automatisch:
// - Nodes VOR dem IfElse → guaranteed (immer ausgeführt)
// - Nodes IN den Branches → conditional (nur auf einem Pfad)
// - Nodes NACH dem Merge → können guaranteed oder conditional sein

const guaranteed = upstreamNodes.filter(n => 
  guaranteedIds.has(n.id) && n.type !== 'start'
);

const conditional = upstreamNodes.filter(n => 
  !guaranteedIds.has(n.id) && n.type !== 'start'
);
```

**Ergebnis:**

1. **IfElse Node selbst:**
   - Wird wie ein normaler Node behandelt
   - Zeigt Output: `{ condition, result, output }`
   - Ist **guaranteed** wenn er vor dem aktuellen Node liegt
   - Wird in der entsprechenden Sektion angezeigt (grün oder amber)

2. **Nodes in Branches (NodeB, NodeC):**
   - Werden als **conditional** markiert (amber)
   - Beide Branches werden angezeigt (nicht nur einer!)
   - User sieht sofort: Diese Nodes sind nur auf einem Pfad verfügbar
   - Visuelle Warnung durch amber-Farbe

3. **Nodes nach Merge (NodeD):**
   - Können **guaranteed** oder **conditional** sein
   - Abhängig davon, ob sie auf ALLEN Pfaden erreichbar sind
   - Wenn beide Branches zum Node führen → guaranteed
   - Wenn nur ein Branch zum Node führt → conditional

**Beispiel:**
```
NodeD zeigt:
- Start (gray) - immer verfügbar
- NodeA (green/guaranteed) - vor IfElse → immer verfügbar
- IfElse (green/guaranteed) - vor NodeD → immer ausgeführt
- NodeB (amber/conditional) - nur auf true-Pfad → möglicherweise nicht verfügbar
- NodeC (amber/conditional) - nur auf false-Pfad → möglicherweise nicht verfügbar
```

**Vorteile:**
- ✅ **Vollständig**: Beide Branches werden angezeigt
- ✅ **Klar**: User sieht sofort welche Nodes conditional sind
- ✅ **Automatisch**: Dominator Analysis erkennt Branches automatisch
- ✅ **Konsistent**: IfElse Node wird wie jeder andere Node behandelt

**Besonderheiten:**
- IfElse Node Output enthält `condition`, `result`, `output`
- User kann auf `{{steps.ifelseId.result}}` zugreifen (true/false)
- User kann auf `{{steps.ifelseId.condition}}` zugreifen (ursprüngliche Condition)

### DataSelector (Beispielprojekt) - Lösung

**Ansatz: Ein Pfad durch den Workflow**

```typescript
function findPathToStep(trigger: FlowTrigger, targetStepName: string): StepWithIndex[] {
  const steps = flowStructureUtil.getAllSteps(trigger).map((step, dfsIndex) => ({
    ...step,
    dfsIndex,
  }))
  return steps
    .filter((step) => {
      const steps = flowStructureUtil.getAllSteps(step)
      return steps.some((s) => s.name === targetStepName)
    })
    .filter((step) => step.name !== targetStepName)
}
```

**Ergebnis:**

1. **Router/IfElse Node selbst:**
   - Wird wie ein normaler Node behandelt
   - Zeigt Output-Daten
   - Keine spezielle Behandlung

2. **Nodes in Branches:**
   - ⚠️ **Nur Nodes auf EINEM Pfad werden angezeigt**
   - `findPathToStep` findet nur einen Pfad (den ersten gefundenen)
   - Nodes auf dem anderen Branch werden **nicht angezeigt**
   - Keine Unterscheidung zwischen Branches

3. **Nodes nach Merge:**
   - Werden angezeigt wenn sie auf dem gefundenen Pfad sind
   - Keine Information darüber, ob sie auch auf anderen Pfaden erreichbar sind

**Beispiel:**
```
NodeD zeigt (wenn findPathToStep den true-Pfad findet):
- Start
- NodeA
- Router (IfElse)
- NodeB
- NodeD

NodeC wird NICHT angezeigt, obwohl es auf dem false-Pfad erreichbar ist!
```

**Probleme:**
- ❌ **Unvollständig**: Nur ein Branch wird angezeigt
- ❌ **Irreführend**: User sieht nicht alle möglichen Variablen
- ❌ **Keine Warnung**: User weiß nicht, dass Nodes conditional sind
- ❌ **Zufällig**: Welcher Branch angezeigt wird, hängt von der Implementierung ab

**Besonderheiten:**
- Router Nodes haben `children` Array mit Branches
- `getAllChildSteps()` kann alle Steps in einem Branch finden
- Aber `findPathToStep` verwendet diese Information nicht für die Anzeige

### Vergleich

| Aspekt | VariableTreePopover | DataSelector |
|--------|---------------------|-------------|
| **IfElse Node selbst** | ✅ Wie normaler Node, zeigt Output | ✅ Wie normaler Node |
| **Branches anzeigen** | ✅ Beide Branches werden angezeigt | ❌ Nur ein Branch |
| **Kategorisierung** | ✅ Conditional vs. Guaranteed | ❌ Keine Unterscheidung |
| **Warnung** | ✅ Visuelle Markierung (amber) | ❌ Keine Warnung |
| **Vollständigkeit** | ✅ Alle erreichbaren Nodes | ❌ Nur Nodes auf einem Pfad |
| **IfElse Output** | ✅ `condition`, `result`, `output` | ✅ Normale Output-Daten |

### Szenario-Vergleich

**Workflow:**
```
Start → NodeA → IfElse → [true: NodeB → NodeE]
                    ↓ [false: NodeC → NodeD → NodeE]
```

**VariableTreePopover zeigt in NodeE:**
```
Start (gray)
NodeA (green/guaranteed) - vor IfElse
IfElse (green/guaranteed) - vor NodeE
NodeB (amber/conditional) - nur auf true-Pfad
NodeC (amber/conditional) - nur auf false-Pfad
NodeD (amber/conditional) - nur auf false-Pfad
```

**DataSelector zeigt in NodeE (wenn true-Pfad gefunden):**
```
Start
NodeA
Router (IfElse)
NodeB
NodeE
```

**DataSelector zeigt in NodeE (wenn false-Pfad gefunden):**
```
Start
NodeA
Router (IfElse)
NodeC
NodeD
NodeE
```

### Fazit

**VariableTreePopover ist deutlich besser** für die Behandlung von If-Else Nodes:

1. **Vollständigkeit**: Zeigt ALLE Nodes aus BEIDEN Branches
2. **Klarheit**: User sieht sofort welche Nodes conditional sind
3. **Konsistenz**: IfElse Node wird wie jeder andere Node behandelt
4. **Transparenz**: Keine versteckten Nodes - alles wird angezeigt

**DataSelector hat hier einen kritischen Schwachpunkt:**
- Zeigt nur Nodes auf einem Branch
- Welcher Branch angezeigt wird, ist zufällig/implementierungsabhängig
- User verliert wichtige Informationen über alternative Pfade
- Keine Möglichkeit zu sehen, dass es alternative Branches gibt

### Empfehlung

**Behalte die aktuelle Implementierung von VariableTreePopover!**

Die implizite Behandlung durch Dominator Analysis ist **deutlich überlegen**:
- Automatische Erkennung von Branches
- Vollständige Anzeige aller möglichen Nodes
- Klare visuelle Unterscheidung zwischen guaranteed und conditional

**Mögliche Verbesserungen für VariableTreePopover:**
- Zeige zusätzlich an, in welchem Branch (true/false) ein conditional Node liegt
- Zeige visuell die Branch-Struktur (z.B. "NodeB (true branch)")
- Zeige Warnung wenn User eine conditional Variable aus einem Branch verwendet
- Zeige IfElse Condition-Ergebnis (`result: true/false`) wenn verfügbar
