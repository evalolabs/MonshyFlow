# Variables Panel - Test Guide

## Was der User sieht und wie man es testet

### 1. Variables Panel öffnen

1. Öffne einen Workflow im Editor
2. Klicke auf den **"Variables"** Tab im linken Panel (neben Debug, Tools, Toolbar)
3. Du siehst:
   - Header mit "Workflow Variables" und Anzahl der Variablen
   - "Add Variable" Button
   - Liste aller Variablen (wenn vorhanden)

---

### 2. Variable hinzufügen

1. Klicke auf **"Add Variable"**
2. Gib einen Namen ein (z.B. `items`)
3. Gib einen Wert ein (z.B. `[{"name":"sc", "Id":1},{"name":"aa", "Id":2}]`)
4. Klicke **"Add Variable"**
5. Die Variable erscheint in der Liste

---

### 3. Expandable Tree View testen

**Test mit Array:**
1. Erstelle Variable `items` mit Wert: `[{"name":"sc", "Id":1},{"name":"aa", "Id":2}]`
2. Die Variable zeigt: `Array[2]`
3. Klicke auf das **Expand-Icon** (▶)
4. Du siehst:
   ```
   [0]:
     name: "sc"
     Id: 1
   [1]:
     name: "aa"
     Id: 2
   ```

**Test mit Objekt:**
1. Erstelle Variable `user` mit Wert: `{"name":"John", "email":"john@example.com", "settings":{"theme":"dark"}}`
2. Die Variable zeigt: `Object{3 keys}`
3. Klicke auf das **Expand-Icon**
4. Du siehst:
   ```
   name: "John"
   email: "john@example.com"
   settings:
     theme: "dark"
   ```

---

### 4. "Update Field" Feature testen (WICHTIG!)

**Szenario: Nur `items[1].name` ändern**

1. Erstelle Variable `items` mit Wert: `[{"name":"sc", "Id":1},{"name":"aa", "Id":2}]`
2. Expandiere die Variable (klicke auf ▶)
3. Expandiere `[1]` (das zweite Element)
4. **Hovern** über das Feld `name: "aa"`
5. Es erscheint ein **"Update"** Button (✏️ Update)
6. Klicke auf **"Update"**
7. **Ergebnis:**
   - Ein neuer **Variable Node** wird auf dem Canvas erstellt
   - Der Node hat:
     - `variableName`: `items`
     - `variablePath`: `[1].name`
     - `variableValue`: `"aa"` (aktueller Wert)
8. Ändere `variableValue` im Config Panel zu `"neuerName"`
9. Führe den Workflow aus
10. **Ergebnis:** Nur `items[1].name` wird geändert, der Rest bleibt unverändert

**Test mit Objekt:**
1. Erstelle Variable `user` mit Wert: `{"name":"John", "email":"john@example.com"}`
2. Expandiere die Variable
3. Hovern über `email: "john@example.com"`
4. Klicke **"Update"**
5. Variable Node wird erstellt mit:
   - `variableName`: `user`
   - `variablePath`: `email`
   - `variableValue`: `"john@example.com"`

---

### 5. Variable Usage Tracking testen

1. Erstelle eine Variable `counter` mit Wert `0`
2. Füge einen **Code Node** hinzu mit Code:
   ```javascript
   const count = {{vars.counter}};
   return { count: count + 1 };
   ```
3. Gehe zurück zum **Variables Panel**
4. Bei der Variable `counter` siehst du:
   - "Used in 1 place" (expandierbar)
5. Klicke darauf
6. Du siehst:
   ```
   Code (code)
   Jump [Button]
   ```
7. Klicke auf **"Jump"** → Springt zum Code Node

---

### 6. Quick Actions testen

**Copy Path:**
1. Bei einer Variable, klicke auf das **Copy-Icon** (📋)
2. `{{vars.variableName}}` wird in die Zwischenablage kopiert
3. Füge es in einem Expression Field ein (z.B. in einem HTTP Request Node)

**Jump to Variable Node:**
1. Wenn eine Variable von einem Variable Node gesetzt wurde, siehst du ein **📝 Icon**
2. Klicke auf das **Jump-Icon** (→)
3. Der Canvas springt zum Variable Node und öffnet das Config Panel

**Create Variable Node:**
1. Bei einer Variable, die noch keinen Variable Node hat
2. Klicke auf das **+ Icon**
3. Ein neuer Variable Node wird erstellt mit vorausgefülltem `variableName`

---

### 7. Search/Filter testen

1. Erstelle mehrere Variablen:
   - `counter` (number)
   - `userData` (object)
   - `items` (array)
   - `apiUrl` (string)
2. Im **Variables Panel** erscheint ein **Search-Feld** (bei >3 Variablen)
3. Suche nach:
   - `counter` → findet nur `counter`
   - `array` → findet `items`
   - `object` → findet `userData`
   - `api` → findet `apiUrl`

---

### 8. Variable löschen mit Warnung

1. Erstelle Variable `counter`
2. Verwende sie in einem Code Node: `{{vars.counter}}`
3. Gehe zum **Variables Panel**
4. Klicke auf **Delete** (🗑️) bei `counter`
5. **Ergebnis:** Bestätigungsdialog erscheint:
   ```
   Variable "counter" is used in 1 place(s). 
   Are you sure you want to delete it?
   ```

---

### 9. Komplettes Beispiel: Array-Element aktualisieren

**Workflow:**
1. **Start Node**
2. **Code Node** mit:
   ```javascript
   return [{"name":"sc", "Id":1},{"name":"aa", "Id":2}];
   ```
3. **Variable Node** (Set Variable):
   - `variableName`: `items`
   - `variableValue`: `{{steps.code-xxx.json}}`
4. **Variable Node** (Update Field) - erstellt via Variables Panel:
   - `variableName`: `items`
   - `variablePath`: `[1].name`
   - `variableValue`: `"neuerName"`
5. **End Node**

**Erwartetes Ergebnis:**
- Nach Schritt 3: `items = [{"name":"sc", "Id":1},{"name":"aa", "Id":2}]`
- Nach Schritt 4: `items = [{"name":"sc", "Id":1},{"name":"neuerName", "Id":2}]`
- Nur `items[1].name` wurde geändert!

---

## Visuelle Features

### Farbcodierung:
- **Strings**: Grün (`"text"`)
- **Numbers**: Lila (`123`)
- **Booleans**: Blau (`true`/`false`)
- **Objects/Arrays**: Grau (`Object{3 keys}`, `Array[5]`)

### Icons:
- **📝**: Variable wird von Variable Node gesetzt
- **📋**: Copy Path
- **→**: Jump to Node
- **+**: Create Variable Node
- **✏️**: Edit Variable
- **🗑️**: Delete Variable

### Info-Hinweise:
- "Hover over nested fields to update them" (bei komplexen Werten)
- "Used in X place(s)" (bei verwendeten Variablen)

---

## Troubleshooting

**Problem:** "Update" Button erscheint nicht
- **Lösung:** Nur bei verschachtelten Feldern (depth > 0), nicht auf Root-Ebene

**Problem:** Variable Node wird nicht erstellt
- **Lösung:** Prüfe, ob `onAddNode` korrekt übergeben wird

**Problem:** `variablePath` funktioniert nicht
- **Lösung:** Prüfe Format: `[1].name` (nicht `items[1].name` - das `items` ist bereits in `variableName`)

---

## Zusammenfassung

Der User kann jetzt:
✅ Verschachtelte Strukturen visuell erkunden (Tree View)
✅ Einzelne Felder direkt aktualisieren (ohne Code Node)
✅ Sehen, wo Variablen verwendet werden
✅ Schnell zu Nodes springen
✅ Pfade kopieren für Expressions
✅ Variablen suchen/filtern

Alles ohne Code Node für einfache Updates! 🎉

