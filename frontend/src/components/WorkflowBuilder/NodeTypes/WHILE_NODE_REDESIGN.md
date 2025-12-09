# 🔁 While Node - Professionelles Redesign

## Vorher vs. Nachher

### ❌ VORHER (Altes Design):
```
┌─────────────────────────┐ [🔄]
│ ● While Loop            │
│   condition: x > 0      │
│   Max: 10               │
└─────────────────────────┘

- Lila/Blau Gradient
- Inkonsistente Größe
- Purple handles (nicht kategoriebasiert)
```

### ✅ NACHHER (Neues Design):
```
┌─────────────────────────┐ [🔄]
│ 🔁 While Loop           │
│    condition: x > 0     │
│    Max: 10              │
└─────────────────────────┘

- Amber/Orange Gradient (Logic Kategorie)
- Standardgröße: 220x100px
- Kategoriebasierte Farben
- Klare Handle-Kennzeichnung
```

---

## 🎯 Design-Entscheidungen

### 1. **Farbe: Amber/Orange**
**Warum?** Logic-Kategorie = Amber  
While ist ein Logic-Node (wie If/Else), daher:
- Border: `border-amber-400`
- Background: `from-amber-50 to-orange-50`
- Handles: `bg-amber-500`

### 2. **4 Handles mit klaren Farben:**
| Handle       | Position | Color  | Purpose                  |
|--------------|----------|--------|--------------------------|
| **input**    | Left-Top | Amber  | Eingang in die Loop      |
| **loop-body**| Bottom   | Amber  | Nodes innerhalb der Loop |
| **loop-exit**| Right    | Green  | Exit (Condition false)   |
| **loop-back**| Left-Mid | Red    | Loop zurück zum Start    |

**Farblogik:**
- 🟡 **Amber** = Normal Flow
- 🟢 **Green** = Success/Exit
- 🔴 **Red** = Loop zurück

### 3. **Loop Badge**
Top-right Badge mit Loop-Icon:
- Zeigt visuell an: "Das ist eine Loop!"
- Konsistent mit dem Design-System

### 4. **Tooltips on Hover**
Jeder Handle hat ein Tooltip:
- `↓ Loop Body` (unten)
- `✓ Exit →` (rechts)
- `← Loop Back` (links)

---

## 🔧 Technische Details

### Handle IDs:
```typescript
- "input"     → Entry point
- "loop-body" → Nodes in loop
- "loop-exit" → Continue after loop
- "loop-back" → Return to start
```

### Handle Positionen:
```typescript
input:     { top: '20%', left: -6 }
loop-body: { bottom: -6, left: '50%' }
loop-exit: { top: '50%', right: -6 }
loop-back: { top: '50%', left: -6 }
```

### Props:
```typescript
interface WhileNodeProps {
  data: {
    label?: string;           // "While Loop"
    condition?: string;       // "x > 0"
    maxIterations?: number;   // 10 (default)
    outputVariable?: string;  // Variable name
  };
}
```

---

## 🎨 Visual Guide

### Handle Layout:
```
        [input]
           |
┌──────────▼──────────┐ [🔄]
│ 🔁 While Loop       │
[loop-back]    [loop-exit]
│                     │
└──────────▼──────────┘
      [loop-body]
```

### Workflow Example:
```
[Start] → [While Loop] → [End]
              ↓ (body)
           [Action]
              ↓
           [Update]
              ↓ (back)
          [While Loop]
              ↓ (exit)
            [End]
```

---

## 🚀 Usage Example

```tsx
<WhileNode
  data={{
    label: "Retry Loop",
    condition: "retry_count < 3",
    maxIterations: 5
  }}
/>
```

**Rendered:**
```
┌─────────────────────────┐ [🔄]
│ 🔁 Retry Loop           │
│    retry_count < 3      │
│    Max: 5               │
└─────────────────────────┘
```

---

## ✅ Quality Checklist

- ✅ Konsistente Größe (220×100px)
- ✅ Kategoriebasierte Farbe (Logic = Amber)
- ✅ Icon + Label + Subtitle
- ✅ 4 Handles korrekt positioniert
- ✅ Tooltips für alle Handles
- ✅ Hover-Effekte (scale, shadow)
- ✅ Loop Badge visible
- ✅ Responsive & Smooth

---

## 🎉 Resultat

Der While Node ist jetzt:
1. **Professionell** - Wie moderne Workflow-Builder
2. **Konsistent** - Folgt dem Design-System
3. **Klar** - Farbcodierte Handles
4. **Interaktiv** - Tooltips & Hover-Effekte

**Bereit für Production!** 🚀

