# ✅ Parallel Node - "+" Buttons für Output 2 & 3 - FERTIG!

## 🎯 Problem
**"an 2 und 3 fehlen +"**

Die "+" Buttons erschienen nur bei Output 1, aber nicht bei Output 2 und 3 des Parallel Nodes!

---

## 🔧 Was wurde gefixt?

### 1. **WorkflowCanvas.tsx** - `nodesWithAddButtons` Logic erweitert

**Vorher:**
```typescript
// Prüft nur ob Node IRGENDEINE Edge hat
const hasOutgoingEdge = edges.some(e => e.source === node.id);
```

**Nachher:**
```typescript
// Prüft JEDEN Handle einzeln!
if (node.type === 'parallel') {
  for (let i = 1; i <= branches; i++) {
    const handleId = `output-${i}`;
    if (!hasEdgeFromHandle(node.id, handleId)) {
      result.push({ nodeId: node.id, sourceHandle: handleId });
    }
  }
}
```

**Was bedeutet das?**
- Für **jeden Output** (1, 2, 3) wird geprüft, ob eine Edge existiert
- Wenn **keine Edge**, dann wird ein "+" Button hinzugefügt
- Jetzt hat **jeder freie Output seinen eigenen "+" Button**!

---

### 2. **AddNodeButton.tsx** - Positions-Berechnung für alle Handles

**Vorher:**
```typescript
// Nur eine Position (Mitte)
nodeRelativeY = sourceNode.position.y + 50;
```

**Nachher:**
```typescript
// Unterschiedliche Positionen für jeden Output!
if (sourceHandle === 'output-1') {
  nodeRelativeY = sourceNode.position.y + nodeHeight * 0.25; // 25% oben
} else if (sourceHandle === 'output-2') {
  nodeRelativeY = sourceNode.position.y + nodeHeight * 0.50; // 50% mitte
} else if (sourceHandle === 'output-3') {
  nodeRelativeY = sourceNode.position.y + nodeHeight * 0.75; // 75% unten
}
```

**Resultat:**
- "+" Button bei Output 1 → **Oben** (25%)
- "+" Button bei Output 2 → **Mitte** (50%)
- "+" Button bei Output 3 → **Unten** (75%)

---

### 3. **useNodeSelector.ts** - sourceHandle Support

**Erweitert:**
- `NodeSelectorPopup` Interface → `sourceHandle?: string` hinzugefügt
- `openPopupFromOutput()` → Akzeptiert jetzt `sourceHandle`
- `selectNodeType()` → Verwendet `popup.sourceHandle` beim Edge erstellen

**Was bedeutet das?**
- Wenn du auf "+" bei Output 2 klickst, wird die Edge **MIT Output-2 Handle** erstellt!
- Kein Chaos mehr - jeder Output bleibt korrekt verbunden!

---

## 🎨 Visual Guide

### Vorher:
```
┌─────────────────────────┐
│ ⚡ Parallel          [3]│ ① 🔵 ─→ (+)  ← Nur hier!
│    Execute in parallel  │ ② 🟣 ─→ ❌   ← Kein +
│                         │ ③ 🌸 ─→ ❌   ← Kein +
└─────────────────────────┘
```

### Nachher:
```
┌─────────────────────────┐
│ ⚡ Parallel          [3]│ ① 🔵 ─→ (+)  ← +
│    Execute in parallel  │ ② 🟣 ─→ (+)  ← + (NEU!)
│                         │ ③ 🌸 ─→ (+)  ← + (NEU!)
└─────────────────────────┘
```

---

## 🚀 Wie es jetzt funktioniert

### Schritt 1: Parallel Node hinzufügen
```
[Start] → [Parallel]
            ↓ ① (+)
            ↓ ② (+)
            ↓ ③ (+)
```

### Schritt 2: Auf (+) bei Output 2 klicken
```
[Start] → [Parallel]
            ↓ ① (+)
            ↓ ② 🟣 ← Klick hier!
            ↓ ③ (+)
```

### Schritt 3: Node-Typ wählen
Node-Selector Popup öffnet sich → Wähle z.B. "LLM"

### Schritt 4: Fertig!
```
[Start] → [Parallel]
            ↓ ① (+)
            ↓ ② → [LLM] ✅
            ↓ ③ (+)
```

**Die Edge ist korrekt mit `output-2` verbunden!**

---

## 📊 Bonus: Auch für IfElse Node!

Die gleiche Logic funktioniert jetzt auch für **IfElse Nodes**:

```
┌─────────────────────────┐
│ ◆ If/Else               │ → (+) True
│    condition            │
└─────────────────────────┘
          ↓ (+) False
```

Beide Branches (True und False) bekommen ihre eigenen "+" Buttons!

---

## ✅ Was wurde gefixt - Zusammenfassung

| Komponente | Was wurde geändert | Warum |
|-----------|-------------------|-------|
| **WorkflowCanvas.tsx** | Prüft jeden Handle einzeln | Damit jeder Output seinen "+" Button bekommt |
| **AddNodeButton.tsx** | Berechnet Position pro Handle | Damit "+" bei richtigem Output erscheint |
| **useNodeSelector.ts** | Speichert & verwendet sourceHandle | Damit Edge mit korrektem Handle erstellt wird |

---

## 🎉 Resultat

**Jetzt hat JEDER Output vom Parallel Node (1, 2, 3) seinen eigenen "+" Button!**

### Testing:
1. ✅ Refresh Seite
2. ✅ Füge Parallel Node hinzu
3. ✅ Siehe 3 "+" Buttons (bei 1, 2, 3)
4. ✅ Klicke auf "+" bei Output 2 (mitte)
5. ✅ Wähle Node-Typ
6. ✅ Edge wird korrekt mit Output-2 verbunden!

**FERTIG!** 🚀

