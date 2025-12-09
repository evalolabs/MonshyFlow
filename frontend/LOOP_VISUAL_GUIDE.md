# 🔄 **WHILE LOOP - VISUELLES GUIDE**

## ✅ **WAS WURDE IMPLEMENTIERT:**

### **1. While Node mit Loop Indicator** 🟣

Der While Node hat jetzt:
- ✅ **Loop Symbol (⟲)** oben rechts - zeigt, dass es ein Loop ist
- ✅ **Lila Farbe** statt Blau - unterscheidet ihn von normalen Nodes
- ✅ **"🔄 Loop Start" Badge** - zeigt, wo der Loop beginnt
- ✅ **Condition Anzeige** - zeigt die Loop-Bedingung
- ✅ **Rotes Handle (links)** - für Loop-Back Connections

---

### **2. Loop-Back Edge** 🔴

Neue **LoopEdge** mit:
- ✅ **Rote gestrichelte Linie** - unterscheidet sich von normalen Edges
- ✅ **"Loop Back" Label** - zeigt, dass es eine Rückwärtsverbindung ist
- ✅ **Loop Symbol** im Label

---

## 🎯 **WIE MAN ES BENUTZT:**

### **Schritt 1: While Node hinzufügen**

1. Ziehe **While Node** aus der Toolbar
2. Der Node zeigt automatisch:
   ```
   ┌─────────────────┐
   │ 🔄 While Loop  ⟲│
   ├─────────────────┤
   │ 🔄 Loop Start   │
   └─────────────────┘
   ```

---

### **Schritt 2: Loop-Nodes verbinden**

**Normal vorwärts:**
```
START → LLM → WHILE → API → IF-ELSE
```

**Loop zurück:**
```
IF-ELSE → WHILE (mit rotem Handle links)
```

---

### **Schritt 3: Loop-Back Edge erstellen**

**WICHTIG:** Für die Loop-Back Verbindung:

1. **Von IF-ELSE "TRUE" Ausgang**
2. **Zu WHILE "loop-back" Handle (rot, links)**
3. Die Edge wird automatisch **rot gestrichelt** mit "Loop Back" Label

---

## 🎨 **VISUELLES RESULTAT:**

```
    START (grau)
      ↓ (grau)
    LLM (blau)
      ↓ (grau)
   ⟲ WHILE ⟲ (lila, "Loop Start")
      ↓ (grau)
    API (blau)
      ↓ (grau)
   IF-ELSE (gelb)
    ↙     ↘
 FALSE   TRUE
   ↓       ↓ (rot gestrichelt "Loop Back")
  END     ⤴ (zurück zu WHILE)
```

---

## 💻 **EDGE TYPE MANUELL SETZEN:**

### **Option 1: Automatische Detection (Coming Soon)**

Das System erkennt automatisch Loop-Back Edges und färbt sie rot.

### **Option 2: Manuell im Code**

In `WorkflowCanvas.tsx`:

```typescript
// Beim Erstellen einer Loop-Back Edge:
const newEdge = {
  id: 'edge-123',
  source: 'if-else-node',
  target: 'while-node',
  sourceHandle: 'true',
  targetHandle: 'loop-back',
  type: 'loopEdge', // ← Setze Type auf "loopEdge"
};
```

---

## 🔧 **EDGE TYPES:**

- `buttonEdge` (Standard) - Normale Edges mit "+" Button
- `loopEdge` (Neu) - Rote gestrichelte Loop-Back Edges

---

## 🎯 **WEITERE VERBESSERUNGEN (Optional):**

### **1. Automatische Loop Detection**

```typescript
// Erkennt automatisch Loop-Back Edges basierend auf Node-Hierarchie
const isLoopBack = (source: Node, target: Node) => {
  // Wenn Target BEFORE Source im Workflow → Loop!
  return target.position.y < source.position.y;
};
```

### **2. Loop Container (Erweitert)**

Nodes innerhalb des Loops mit einem Rahmen umschließen:

```
  ┌─────────────────────────────┐
  │ ⟲ WHILE LOOP                │
  ├─────────────────────────────┤
  │    API                      │
  │     ↓                       │
  │   IF-ELSE                   │
  └─────────────────────────────┘
```

### **3. Loop Counter Badge**

Zeigt, wie oft der Loop durchlaufen wurde:

```
⟲ WHILE [3/10] ← 3 von 10 Iterationen
```

---

## ✅ **TESTING CHECKLIST:**

- [x] While Node zeigt Loop Symbol
- [x] While Node hat "Loop Start" Badge
- [x] While Node hat rotes Handle (links)
- [x] LoopEdge ist registriert
- [ ] Loop-Back Edge manuell erstellen
- [ ] Loop-Back Edge wird rot gestrichelt angezeigt
- [ ] "Loop Back" Label wird angezeigt

---

## 🚀 **NÄCHSTE SCHRITTE:**

1. **Browser neu laden** (F5)
2. **While Node konfigurieren:**
   - Label: "Retry API"
   - Condition: `{{retryCount}} < 3`
3. **Loop-Back Edge erstellen:**
   - Von IF-ELSE "true" Ausgang
   - Zu WHILE "loop-back" Handle (rot, links)
4. **Resultat:**
   - Edge ist rot gestrichelt
   - Label zeigt "Loop Back"

---

## 🎨 **FARB-SCHEMA:**

- **Grau**: Normale Verbindungen
- **Lila**: While Loop Node
- **Rot**: Loop-Back Edges
- **Grün**: Success Paths (Future)
- **Orange**: Error Paths (Future)

---

**Happy Looping! 🔄**

