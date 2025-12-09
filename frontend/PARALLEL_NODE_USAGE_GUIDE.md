# ⚡ Parallel Node - Anleitung: Outputs benutzen

## 🎯 Wie man Output 2 und 3 anbindet

### Visual Guide:

```
┌─────────────────────────┐ [3]
●─→ Input                  │
│ ⚡ Parallel             │ ① 🔵 ─→ Output 1 (Blau)
│    Execute in parallel  │ ② 🟣 ─→ Output 2 (Purple)
│                         │ ③ 🌸 ─→ Output 3 (Pink)
└─────────────────────────┘
```

---

## 📝 Schritt-für-Schritt

### **1. Parallel Node hinzufügen**
- Klicke auf "+" Button
- Wähle "Logic" → "Parallel"

### **2. Outputs erkennen**
Der Node zeigt jetzt **3 farbige Handles** rechts:
- **Oben** (25%) = 🔵 **Blau** = Output 1
- **Mitte** (50%) = 🟣 **Purple** = Output 2
- **Unten** (75%) = 🌸 **Pink** = Output 3

### **3. Node an Output 2 (Purple) anbinden**

#### Option A: Von Parallel Node ziehen
1. **Hover** über den **Purple Handle** (Mitte rechts)
2. Handle wird **größer** (hover effect)
3. **Klicke und halte** auf dem Purple Handle
4. **Ziehe** zur neuen Node-Position
5. **Lasse los**
6. Wähle Node-Typ aus Popup

#### Option B: Existierende Node verbinden
1. **Klicke** auf den **Purple Handle** (Output 2)
2. **Ziehe** zu einem existierenden Node
3. **Verbinde** mit dem Input-Handle des Ziel-Nodes

---

## 🎨 Visuelle Erkennungsmerkmale

### Jeder Output hat **3 visuelle Indikatoren**:

1. **Farbiger Handle** (rechts außen)
   - 16×16px, gut klickbar
   - Shadow für bessere Sichtbarkeit

2. **Farbige Linie** (im Node)
   - Verbindet Nummer mit Handle
   - Zeigt Zugehörigkeit

3. **Farbige Nummer** (im Node)
   - Runder Badge mit Nummer
   - Gleiche Farbe wie Handle

**Beispiel Output 2:**
```
     ② 🟣 ━━━━━━●
    (Badge) (Linie) (Handle)
```

---

## 🔍 Troubleshooting

### Problem: "Ich sehe die Handles nicht!"
**Lösung:**
- Zoom in (Strg + Scroll)
- Die Handles sind jetzt **4×4px** (größer!)
- Farbig und mit Shadow

### Problem: "Ich kann nicht anklicken!"
**Lösung:**
- Genau auf den **farbigen Kreis** rechts klicken
- Der Handle ist bei:
  - Output 1: Ganz oben (25%)
  - Output 2: **In der Mitte** (50%) ← HIER!
  - Output 3: Ganz unten (75%)

### Problem: "Ich weiß nicht, welcher Handle was ist!"
**Lösung:**
- **Hover** über den Node
- Tooltips erscheinen:
  - "→ Branch 1" (Blau)
  - "→ Branch 2" (Purple)
  - "→ Branch 3" (Pink)

---

## 💡 Best Practices

### 1. **Farbcodierung nutzen**
Verwende die Farben konsistent:
- 🔵 **Blau** (Branch 1) → Primärer Pfad / Hauptlogik
- 🟣 **Purple** (Branch 2) → Sekundärer Pfad / Logging
- 🌸 **Pink** (Branch 3) → Tertiärer Pfad / Notifications

### 2. **Branch-Namen merken**
Im Config Panel kannst du später branches benennen:
- Branch 1: "Main Process"
- Branch 2: "Error Handler"
- Branch 3: "Notification"

### 3. **Merge Node verwenden**
Nach Parallel kommt oft Merge:
```
[Parallel] 
  ↓ ① Blau
[Process A] ──┐
  ↓ ② Purple  │
[Process B] ──┤→ [Merge] → [Continue]
  ↓ ③ Pink    │
[Process C] ──┘
```

---

## 📊 Workflow Beispiele

### Beispiel 1: API Calls Parallel
```
[Start] → [Parallel]
            ↓ ① 🔵 Blau
          [API: Users]
            ↓ ② 🟣 Purple
          [API: Products]
            ↓ ③ 🌸 Pink
          [API: Orders]
```

### Beispiel 2: Notifications
```
[Event] → [Parallel]
            ↓ ① 🔵 Blau
          [Send Email]
            ↓ ② 🟣 Purple
          [Send SMS]
            ↓ ③ 🌸 Pink
          [Update DB]
```

### Beispiel 3: Error Handling
```
[Process] → [Parallel]
              ↓ ① 🔵 Blau
            [Save Result]
              ↓ ② 🟣 Purple
            [Log Activity]
              ↓ ③ 🌸 Pink
            [Notify Admin]
```

---

## 🎯 Quick Reference

| Output | Farbe  | Position | Handle ID  | Verwendung         |
|--------|--------|----------|------------|--------------------|
| 1      | 🔵 Blau   | Oben     | output-1   | Hauptprozess       |
| 2      | 🟣 Purple | Mitte    | output-2   | Nebenprozess       |
| 3      | 🌸 Pink   | Unten    | output-3   | Zusatzprozess      |
| 4+     | 🟡 Amber  | Bottom   | output-bottom | Extra Branches  |

---

## ✅ Checklist: Node erfolgreich angebunden?

- [ ] Purple Handle (Mitte rechts) ist **sichtbar**
- [ ] Handle ist **größer beim Hover** (16×16px)
- [ ] Verbindungslinie ist **sichtbar** beim Ziehen
- [ ] Ziel-Node ist **verbunden** (Edge erscheint)
- [ ] Edge ist **lila/purple** (passend zu Output 2)

---

## 🚀 Fertig!

Jetzt kannst du **alle 3 Outputs** vom Parallel Node benutzen:
- Output 1 (Blau) → Für Hauptlogik
- Output 2 (Purple) → Für Nebenlogik
- Output 3 (Pink) → Für Extra-Prozesse

**Viel Erfolg!** ⚡

