# Node Grouping Analyse

## Übersicht

Bestimmte Nodes im System haben eine logische Parent-Child-Beziehung zu anderen Nodes. Diese Beziehungen müssen für Operationen wie Löschen, Verschieben, Kopieren und Duplizieren berücksichtigt werden.

## Nodes mit Grouping-Funktion

### 1. **Agent Node** ✅ (Bereits teilweise implementiert)

**Parent-Child-Beziehung:**
- Agent Node ist Parent
- Tool-Nodes (Funktion, MCP-Server, Web-Search, etc.) sind Children
- Verbindung über `targetHandle: 'tool'` am Agent Node

**Aktueller Status:**
- ✅ Beim Löschen des Agent werden Tool-Nodes bereits entfernt (siehe `useNodeOperations.ts`)
- ⚠️ Beim Verschieben des Agent werden Tool-Nodes noch nicht mit verschoben
- ⚠️ Beim Kopieren/Duplizieren werden Tool-Nodes noch nicht mit kopiert

**Benötigte Features:**
- [x] Löschen: Tool-Nodes werden mit entfernt
- [ ] Verschieben: Tool-Nodes werden mit verschoben (relative Position beibehalten)
- [ ] Kopieren: Tool-Nodes werden mit kopiert
- [ ] Duplizieren: Tool-Nodes werden mit dupliziert

**Implementierung:**
```typescript
// Tool-Nodes finden, die nur mit diesem Agent verbunden sind
const toolNodes = findToolNodesConnectedToAgent(edges, agentId, nodes);
```

---

### 2. **While Node** 🔄

**Parent-Child-Beziehung:**
- While Node ist Parent
- Nodes im Loop-Block sind Children
- Verbindung über `sourceHandle: 'loop'` vom While Node
- Rückverbindung über `targetHandle: 'back'` zum While Node

**Struktur:**
```
While Node
  ├─ loop handle (output) → Node 1
  │   └─ → Node 2
  │       └─ → Node 3
  │           └─ back handle (input) → While Node
```

**Benötigte Features:**
- [ ] Löschen: Alle Nodes im Loop-Block werden mit entfernt
- [ ] Verschieben: Alle Nodes im Loop-Block werden mit verschoben
- [ ] Kopieren: Alle Nodes im Loop-Block werden mit kopiert
- [ ] Duplizieren: Alle Nodes im Loop-Block werden mit dupliziert

**Implementierung:**
```typescript
// Finde alle Nodes im Loop-Block
function findLoopBlockNodes(
  whileNodeId: string,
  edges: Edge[],
  nodes: Node[]
): string[] {
  // 1. Finde Edge mit sourceHandle='loop' vom While Node
  // 2. Folge allen Edges bis zum 'back' handle
  // 3. Sammle alle Node-IDs im Loop-Block
}
```

---

### 3. **ForEach Node** 🔁

**Parent-Child-Beziehung:**
- ForEach Node ist Parent
- Nodes im Loop-Block sind Children
- Verbindung über `sourceHandle: 'loop'` vom ForEach Node
- Rückverbindung über `targetHandle: 'back'` zum ForEach Node

**Struktur:**
```
ForEach Node
  ├─ loop handle (output) → Node 1
  │   └─ → Node 2
  │       └─ → Node 3
  │           └─ back handle (input) → ForEach Node
```

**Benötigte Features:**
- [ ] Löschen: Alle Nodes im Loop-Block werden mit entfernt
- [ ] Verschieben: Alle Nodes im Loop-Block werden mit verschoben
- [ ] Kopieren: Alle Nodes im Loop-Block werden mit kopiert
- [ ] Duplizieren: Alle Nodes im Loop-Block werden mit dupliziert

**Implementierung:**
- Gleiche Logik wie While Node (kann wiederverwendet werden)

---

### 4. **IfElse Node** ↗️

**Parent-Child-Beziehung:**
- IfElse Node ist Parent
- Nodes in True-Branch sind Children
- Nodes in False-Branch sind Children
- Verbindung über `sourceHandle: 'true'` für True-Branch
- Verbindung über `sourceHandle: 'false'` für False-Branch

**Struktur:**
```
IfElse Node
  ├─ true handle (output) → True Branch Node 1
  │   └─ → True Branch Node 2
  │       └─ → Merge Node (optional)
  │
  └─ false handle (output) → False Branch Node 1
      └─ → False Branch Node 2
          └─ → Merge Node (optional)
```

**Besonderheit:**
- Beide Branches können zu einem gemeinsamen Merge-Node führen
- Merge-Node sollte NICHT mit gelöscht werden (kann von beiden Branches genutzt werden)

**Benötigte Features:**
- [ ] Löschen: Alle Nodes in True- und False-Branches werden mit entfernt
- [ ] Verschieben: Alle Nodes in beiden Branches werden mit verschoben
- [ ] Kopieren: Alle Nodes in beiden Branches werden mit kopiert
- [ ] Duplizieren: Alle Nodes in beiden Branches werden mit dupliziert

**Implementierung:**
```typescript
// Finde alle Nodes in einem Branch
function findBranchNodes(
  ifElseNodeId: string,
  branchHandle: 'true' | 'false',
  edges: Edge[],
  nodes: Node[]
): string[] {
  // 1. Finde Edge mit sourceHandle=branchHandle vom IfElse Node
  // 2. Folge allen Edges im Branch
  // 3. Stoppe wenn Merge-Node erreicht wird (hat Inputs von beiden Branches)
  // 4. Sammle alle Node-IDs im Branch
}
```

---

## Implementierungs-Strategie

### Phase 1: Utility-Funktionen erstellen

1. **`findLoopBlockNodes()`** - Findet alle Nodes in einem Loop-Block
2. **`findBranchNodes()`** - Findet alle Nodes in einem IfElse-Branch
3. **`findAllChildNodes()`** - Generische Funktion, die alle Child-Nodes eines Parent-Nodes findet

### Phase 2: Operationen erweitern

1. **Löschen (`deleteNode`)**
   - ✅ Agent + Tools (bereits implementiert)
   - [ ] While/ForEach + Loop-Block
   - [ ] IfElse + Branches

2. **Verschieben (`moveNode`)**
   - [ ] Agent + Tools (relative Position beibehalten)
   - [ ] While/ForEach + Loop-Block
   - [ ] IfElse + Branches

3. **Kopieren (`duplicateNode`)**
   - [ ] Agent + Tools
   - [ ] While/ForEach + Loop-Block
   - [ ] IfElse + Branches

### Phase 3: UI-Feedback

- Visuelle Gruppierung im Canvas (z.B. Rahmen um Parent + Children)
- Multi-Select beim Verschieben
- Bestätigungsdialog beim Löschen von Parent-Nodes

---

## Datenstruktur

### Option 1: Implizite Beziehung (aktuell)
- Beziehung wird über Edges und Handles bestimmt
- Keine explizite `parentId` im Node-Objekt
- **Vorteil:** Keine Datenstruktur-Änderung nötig
- **Nachteil:** Komplexere Logik zum Finden von Children

### Option 2: Explizite Beziehung (zukünftig)
- Node hat optional `parentId: string | undefined`
- **Vorteil:** Einfacheres Finden von Children
- **Nachteil:** Datenstruktur-Änderung, Migration nötig

**Empfehlung:** Start mit Option 1, später zu Option 2 migrieren wenn nötig.

---

## Edge Cases

1. **Nested Loops:**
   ```
   While Node 1
     └─ Loop Block
         └─ While Node 2
             └─ Loop Block
   ```
   - Beim Löschen von While Node 1: Auch While Node 2 + dessen Block löschen
   - Beim Löschen von While Node 2: Nur dessen Block löschen

2. **IfElse in Loop:**
   ```
   While Node
     └─ Loop Block
         └─ IfElse Node
             ├─ True Branch
             └─ False Branch
   ```
   - Beim Löschen von While Node: Alles löschen
   - Beim Löschen von IfElse Node: Nur Branches löschen

3. **Tool-Nodes mit mehreren Agents:**
   - Tool-Node ist mit Agent 1 UND Agent 2 verbunden
   - Beim Löschen von Agent 1: Tool-Node NICHT löschen (noch mit Agent 2 verbunden)
   - ✅ Bereits implementiert in `findToolNodesConnectedToAgent()`

---

## Priorisierung

1. **Hoch:** Agent + Tools (Löschen ✅, Verschieben/Kopieren noch offen)
2. **Hoch:** While/ForEach + Loop-Block (alle Operationen)
3. **Mittel:** IfElse + Branches (alle Operationen)
4. **Niedrig:** UI-Feedback (visuelle Gruppierung)

---

## Nächste Schritte

1. ✅ Agent + Tools Löschen (bereits implementiert)
2. [ ] Utility-Funktionen für Loop-Block und Branches erstellen
3. [ ] `deleteNode` für While/ForEach/IfElse erweitern
4. [ ] `moveNode` für alle Parent-Nodes implementieren
5. [ ] `duplicateNode` für alle Parent-Nodes implementieren
6. [ ] Tests schreiben
7. [ ] UI-Feedback hinzufügen

