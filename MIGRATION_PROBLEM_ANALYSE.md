# Problem-Analyse: Migration von C# zu Node.js

## Problem
Variablen wie `{{steps.nodeId.json.field}}` funktionieren nicht in der neuen Node.js Version.

## Was wurde bereits gemacht
1. ✅ Explizite Node-Data-Konvertierung im API-Service hinzugefügt (`convertNodeDataToPlainObjects`)
2. ✅ Logging-Änderungen im execution-service entfernt (sollte nicht geändert werden)

## Was noch fehlt / zu prüfen ist

### 1. Node-Data-Struktur beim Übergang vom API-Service zum Execution-Service

**C# Version:**
- `node.Data` ist ein `BsonDocument`
- Wird explizit konvertiert: `n.Data.ToJson()` → `JsonSerializer.Deserialize<object>()`
- Wird als `data` Feld im Workflow-Objekt übertragen

**Node.js Version:**
- `node.data` ist ein Mongoose `Mixed` Feld
- Wird mit `toObject()` konvertiert
- Wird als `data` Feld im Workflow-Objekt übertragen

**Mögliches Problem:**
- `toObject()` konvertiert möglicherweise nicht alle verschachtelten MongoDB-Dokumente korrekt
- Die explizite Konvertierung über `JSON.stringify()` → `JSON.parse()` sollte das beheben, aber vielleicht fehlt noch etwas

### 2. Secrets-Übergabe

**C# Version:**
- Secrets werden sowohl im `workflow` Objekt als auch separat im Request-Body übertragen

**Node.js Version:**
- Secrets werden nur im `workflow` Objekt übertragen

**Mögliches Problem:**
- Der Execution-Service erwartet möglicherweise Secrets an einer bestimmten Stelle

### 3. Input-Struktur

**C# Version:**
- Input wird explizit konvertiert: `JsonSerializer.Deserialize<object>(inputJson)`

**Node.js Version:**
- Input wird direkt übergeben: `req.body || {}`

**Mögliches Problem:**
- Input könnte MongoDB-Dokumente enthalten, die nicht korrekt serialisiert werden

## Nächste Schritte

1. **Prüfen, ob die explizite Node-Data-Konvertierung korrekt funktioniert**
   - Logs prüfen, ob `convertNodeDataToPlainObjects` aufgerufen wird
   - Prüfen, ob die konvertierten Daten korrekt an den Execution-Service übergeben werden

2. **Prüfen, ob Secrets korrekt übertragen werden**
   - Logs prüfen, ob Secrets im `workflow` Objekt vorhanden sind
   - Prüfen, ob der Execution-Service die Secrets findet

3. **Prüfen, ob Input korrekt übertragen wird**
   - Logs prüfen, ob Input korrekt serialisiert wird

4. **Prüfen, ob die Datenstruktur im Execution-Service korrekt ist**
   - Logs prüfen, ob die Expression-Resolution die richtige Datenstruktur erhält
   - Prüfen, ob `normalizeContext` die Daten korrekt normalisiert

## Wichtige Erkenntnisse

- Der execution-service sollte **NICHT** geändert werden (wie vom Benutzer bestätigt)
- Das Problem liegt wahrscheinlich in der **Datenübergabe** vom API-Service zum Execution-Service
- Die explizite Node-Data-Konvertierung sollte das Problem beheben, aber es muss getestet werden

