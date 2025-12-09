# 🧪 Workflow Test Checklist

## ✅ Was zu testen ist:

### 1. **Node Hinzufügen**
- [ ] Start Node kann hinzugefügt werden
- [ ] Mit [+] Button neue Nodes hinzufügen (rechts vom Start)
- [ ] Verschiedene Node-Typen aus dem Popup auswählen
- [ ] Nodes werden horizontal (links→rechts) angeordnet

**Erwartetes Problem:** 
- Nodes könnten vertikal statt horizontal positioniert werden
- Auto-Layout könnte Nodes übereinander legen

---

### 2. **Node ZWISCHEN zwei bestehenden einfügen**
- [ ] Auf Edge zwischen zwei Nodes klicken → [+] Button
- [ ] Neuen Node auswählen
- [ ] Alter Edge wird gelöscht
- [ ] Zwei neue Edges werden erstellt (Source→New, New→Target)

**Erwartetes Problem:**
- Edge könnte nicht richtig entfernt werden
- Neue Edges könnten falsche Handles verwenden
- Position könnte falsch berechnet werden

---

### 3. **IfElse Node (2 Outputs)**
- [ ] IfElse Node hinzufügen
- [ ] TRUE Output (rechts, grün) verbinden
- [ ] FALSE Output (unten, rot) verbinden
- [ ] Beide Pfade können nodes haben

**Erwartetes Problem:**
- Handle IDs könnten verwechselt werden
- Tooltips könnten nicht angezeigt werden
- Edges könnten zum falschen Handle verbinden

---

### 4. **Parallel Node (Multiple Outputs)**
- [ ] Parallel Node hinzufügen
- [ ] 3+ Output Handles verfügbar
- [ ] Jeder Output kann eigenen Branch haben
- [ ] Badge zeigt Anzahl der Branches

**Erwartetes Problem:**
- Nur ein Output funktioniert
- Handle IDs (output-1, output-2, output-3) nicht unique
- Bottom handle (output-bottom) wird nicht erkannt

---

### 5. **Merge Node (Multiple Inputs)**
- [ ] Merge Node hinzufügen
- [ ] 3+ Input Handles verfügbar (3x links, 1x oben)
- [ ] Alle Inputs können verbunden werden
- [ ] Merge Strategy kann gewählt werden

**Erwartetes Problem:**
- Nur ein Input funktioniert
- Handle IDs (input-1, input-2, input-3, input-top) nicht unique
- ReactFlow erlaubt nur ein Target Handle pro Node?
- Merge Strategy hat keine Funktion (nur UI)

---

### 6. **While Node (Loop)**
- [ ] While Node hinzufügen
- [ ] INPUT Handle (links, oben) verbinden
- [ ] LOOP-BODY Handle (unten) für Schleifenkörper
- [ ] LOOP-EXIT Handle (rechts) für Fortsetzung
- [ ] LOOP-BACK Handle (links, Mitte) für Rücksprung

**Erwartetes Problem:**
- Loop-Back Edge geht nicht zurück zum While Node
- Handle Positionen überlappen sich
- Auto-Layout zerstört Loop-Struktur
- Loop-Body Nodes werden in Hauptflow eingefügt

---

### 7. **Auto-Layout**
- [ ] Button "Auto Layout" funktioniert
- [ ] Nodes werden horizontal angeordnet
- [ ] Gleiche Abstände zwischen Nodes
- [ ] Loops bleiben intakt
- [ ] Branches werden sichtbar

**Erwartetes Problem:**
- Auto-Layout zerstört manuelle Positionen
- While Loop wird aufgelöst
- Parallel Branches werden übereinander gelegt
- Zu kompakt oder zu weit auseinander

---

### 8. **Edge-Verbindungen**
- [ ] Edges verbinden sich zu richtigen Handles
- [ ] Left→Right für Standard-Flow
- [ ] Spezielle Handles (loop-exit, true/false) funktionieren
- [ ] [+] Button auf Edge funktioniert
- [ ] Edge kann entfernt werden (Delete-Taste)

**Erwartetes Problem:**
- Edges verbinden zu falschen Handles
- sourceHandle/targetHandle sind undefined oder null
- ButtonEdge wird nicht korrekt gerendert
- Phantom Edges (für [+] ohne Verbindung) fehlen

---

### 9. **Node-Konfiguration**
- [ ] Node anklicken öffnet Config-Panel
- [ ] Konfiguration wird gespeichert (Auto-Save)
- [ ] Label-Änderungen werden sofort sichtbar
- [ ] Schließen des Panels funktioniert

**Erwartetes Problem:**
- Auto-Save ist zu aggressiv (speichert bei jedem Tastendruck)
- Config-Panel verdeckt Canvas
- Änderungen gehen verloren

---

### 10. **Node-Operationen**
- [ ] Node kann gelöscht werden (Context-Menu oder Delete-Taste)
- [ ] Node kann dupliziert werden
- [ ] Start Node kann NICHT dupliziert werden
- [ ] Edges werden beim Löschen neu verbunden

**Erwartetes Problem:**
- Nach Löschen werden Edges nicht neu verbunden
- Duplikation übernimmt alte ID
- Start Node kann dupliziert werden (sollte nicht!)

---

### 11. **Workflow Execution**
- [ ] "Run" Button startet Execution
- [ ] Execution Monitor zeigt Fortschritt
- [ ] Nodes werden der Reihe nach ausgeführt
- [ ] Parallel Nodes laufen gleichzeitig
- [ ] While Loop iteriert korrekt
- [ ] IfElse wählt richtigen Branch

**Erwartetes Problem:**
- Execution ignoriert Parallel Node
- Merge wartet nicht auf alle Inputs
- While Loop läuft unendlich
- IfElse Branch-Selection funktioniert nicht

---

## 🔧 **KRITISCHE BUGS ZU FINDEN:**

### Bug 1: **Handle-ID Collision**
```typescript
// Mehrere Nodes mit gleichen Handle IDs?
<Handle id="input-1" />  // Parallel Node
<Handle id="input-1" />  // Merge Node
// ReactFlow verwechselt diese!
```

### Bug 2: **Null vs Undefined Handles**
```typescript
// In edgeUtils.ts
sourceHandle: null  // ← Problem!
// Sollte sein:
sourceHandle: undefined
```

### Bug 3: **Auto-Layout zerstört Loops**
```typescript
// While Loop wird aufgelöst, weil:
// - Loop-Back Edge wird als "backwards" erkannt
// - Auto-Layout ignoriert diese
```

### Bug 4: **Phantom Edges fehlen**
```typescript
// usePhantomEdges Hook erstellt [+] Buttons
// Aber: nur für nodes ohne Outputs
// Was ist mit Parallel Node outputs?
```

### Bug 5: **Merge Node akzeptiert nur 1 Input**
```typescript
// ReactFlow Standard: 1 Target Handle pro Node
// Wir brauchen: Multiple Target Handles
// Lösung: Verschiedene IDs (input-1, input-2, etc.)
```

---

## 📝 **TEST-PROTOKOLL:**

### Test 1: Basic Flow ✅/❌
- Start → LLM → End
- Ergebnis: _____________

### Test 2: Insert Between ✅/❌  
- LLM → [INSERT AGENT] → End
- Ergebnis: _____________

### Test 3: IfElse Branch ✅/❌
- IfElse → True (rechts) / False (unten)
- Ergebnis: _____________

### Test 4: Parallel Execution ✅/❌
- Parallel → 3 Branches
- Ergebnis: _____________

### Test 5: Merge Paths ✅/❌
- 3 Branches → Merge → End
- Ergebnis: _____________

### Test 6: While Loop ✅/❌
- While → Loop Body → Loop Back
- Ergebnis: _____________

---

## 🚀 **NÄCHSTE SCHRITTE:**

1. Führe jeden Test durch
2. Notiere Fehler
3. Ich fixe die Bugs
4. Wiederhole Tests
5. Dokumentiere finalen Status

---

**Viel Erfolg beim Testen!** 🎯

