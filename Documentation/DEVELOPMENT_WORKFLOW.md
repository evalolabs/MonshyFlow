# 🤝 Entwicklungs-Workflow

**Zweck:** Dokumentation des gemeinsamen Entwicklungs-Workflows

---

## 📋 Workflow-Übersicht

```
1. Implementierung (Ich)
   ↓
2. Tests schreiben (Ich)
   ↓
3. Tests ausführen (Ich)
   ↓
4. Browser-Testing (Du) - nur wenn nötig
   ↓
5. Nächstes Feature oder Fix
```

---

## 🔄 Detaillierter Workflow

### Phase 1: Implementierung (Ich)

**Was passiert:**
- Ich implementiere Features gemäß `IMPLEMENTIERUNGS_STRATEGIE.md`
- Code wird direkt geschrieben und integriert
- TypeScript-Fehler werden behoben
- Linter-Fehler werden behoben

**Output:**
- ✅ Funktionaler Code
- ✅ Keine TypeScript/Linter-Fehler
- ✅ Build erfolgreich

---

### Phase 2: Tests schreiben (Ich)

**Was passiert:**
- Ich schreibe Unit-Tests für jede Funktion
- Ich schreibe Integration-Tests für komplexe Szenarien
- Tests folgen Best Practices (AAA-Pattern, klare Namen)

**Test-Typen:**
- **Unit-Tests:** Isolierte Funktionen
- **Integration-Tests:** Funktionen zusammen
- **Real-World-Szenarien:** Komplexe, realistische Workflows

**Output:**
- ✅ Test-Dateien erstellt
- ✅ Alle wichtigen Szenarien abgedeckt

---

### Phase 3: Test-Ausführung (Ich)

**Was passiert:**
- `pnpm test` wird automatisch ausgeführt
- Alle Tests müssen bestehen
- Coverage wird gemessen (wenn relevant)

**Befehle:**
```bash
pnpm test              # Alle Tests
pnpm test:coverage     # Mit Coverage-Report
pnpm test:watch        # Watch-Mode
```

**Output:**
- ✅ Alle Tests bestanden
- ✅ Coverage-Report (wenn relevant)
- ❌ Falls Fehler → Fix und erneut testen

---

### Phase 4: Browser-Testing (Du) - Nur wenn nötig

**Wann nötig:**
- Visuelle Features (UI/UX)
- Interaktive Features (Drag & Drop, Multi-Select)
- Browser-spezifische Probleme
- Performance-Probleme

**Was ich dir schreibe:**
```
🧪 Browser-Test erforderlich:

Bitte teste im Browser:
1. Öffne einen Workflow
2. Drücke Strg+Klick auf mehrere Nodes
3. Prüfe ob Multi-Select funktioniert
4. Prüfe ob Visual Feedback sichtbar ist

Erwartetes Verhalten:
- Mehrere Nodes sollten ausgewählt werden
- Ausgewählte Nodes sollten visuell hervorgehoben sein

Bitte gib Feedback:
- ✅ Funktioniert
- ❌ Fehler: [Beschreibung]
- 📝 Logs: [Console-Logs]
```

**Was du machst:**
1. Feature im Browser testen
2. Feedback geben:
   - ✅ Funktioniert → Weiter zum nächsten Feature
   - ❌ Fehler → Beschreibung + Logs
   - 📝 Verbesserungsvorschläge

---

### Phase 5: Nächstes Feature oder Fix

**Wenn alles OK:**
- ✅ Weiter zum nächsten Feature in der Strategie
- ✅ Status in `IMPLEMENTIERUNGS_STRATEGIE.md` aktualisieren

**Wenn Probleme:**
- ❌ Fix implementieren
- ❌ Tests anpassen/erweitern
- ❌ Erneut testen
- ❌ Falls nötig: Browser-Test wiederholen

---

## 📊 Beispiel-Workflow

### Beispiel: Phase 1.2 Multi-Select

```
1. [Ich] Implementiere Multi-Select in WorkflowCanvas.tsx
   - React Flow Props anpassen
   - Multi-Select aktivieren
   - Visual Feedback hinzufügen
   ✅ Build erfolgreich

2. [Ich] Schreibe Tests
   - Unit-Test: Multi-Select-Funktionalität
   - Integration-Test: Multi-Select + Gruppierung
   ✅ Tests geschrieben

3. [Ich] Führe Tests aus
   $ pnpm test
   ✅ 2 Tests bestanden

4. [Ich] → [Du] Browser-Test erforderlich
   "Bitte teste: Strg+Klick auf mehrere Nodes im Browser"
   
5. [Du] Testest im Browser
   ✅ Funktioniert perfekt!
   
6. [Ich] Weiter zu Phase 1.3 (Delete-Key Shortcut)
```

---

## ✅ Vorteile dieses Workflows

### Für mich (Entwicklung):
- ✅ Schnell: Tests laufen automatisch
- ✅ Sicher: Code ist getestet bevor du testest
- ✅ Effizient: Ich kann Features schnell implementieren
- ✅ Dokumentiert: Tests dokumentieren die Funktionalität

### Für dich (Testing):
- ✅ Fokussiert: Du testest nur was wirklich UI/UX betrifft
- ✅ Klar: Du weißt genau was zu testen ist
- ✅ Effizient: Keine Zeit mit Unit-Tests verschwenden
- ✅ Feedback: Du gibst direktes Feedback

### Zusammen:
- ✅ Qualität: Code ist getestet + manuell getestet
- ✅ Geschwindigkeit: Parallele Arbeit möglich
- ✅ Klarheit: Jeder weiß was zu tun ist

---

## 🎯 Aktueller Status

### Abgeschlossen:
- ✅ Phase 0: Node-Gruppierung Utilities (20 Unit + 9 Integration Tests)
- ✅ Phase 1.1: Keyboard-Shortcut-Verwaltung (9 Unit + 7 Integration Tests)

### Nächste Schritte:
- 📋 Phase 1.2: Multi-Select aktivieren
- 📋 Phase 1.3: Delete-Key Shortcut

---

## 📝 Kommunikation

### Wenn ich Browser-Testing brauche:

Ich schreibe dir:
```
🧪 Browser-Test erforderlich für: [Feature-Name]

Bitte teste:
1. [Schritt 1]
2. [Schritt 2]
3. [Schritt 3]

Erwartetes Verhalten:
- [Was sollte passieren]

Bitte gib Feedback:
- ✅ Funktioniert
- ❌ Fehler: [Beschreibung]
- 📝 Logs: [Console-Logs]
```

### Wenn du Probleme findest:

Du schreibst mir:
```
❌ Problem: [Beschreibung]
📝 Logs: [Console-Logs]
🔍 Schritte: [Wie zu reproduzieren]
```

---

## 🚀 Ready to Start!

**Aktueller Stand:**
- ✅ 45 Tests bestehen
- ✅ Phase 0 und 1.1 abgeschlossen
- ✅ Workflow etabliert

**Nächster Schritt:**
- 📋 Phase 1.2: Multi-Select aktivieren

**Soll ich mit Phase 1.2 beginnen?** 🚀

