# Workflow Variables - Umfassende Analyse

## Analyse des Beispiel-Workflows

### Workflow-Struktur
```
Start → Code → Variable (tester = []) → Loop → Code (im Loop) → End-Loop → Variable (tester lesen)
```

### Aktuelle Implementierung ✅

1. **Variable-Node vor Loop:**
   - `variableName: "tester"`
   - `variableValue: "[]"` (String)
   - ✅ Wird korrekt als Array geparst (JSON.parse)

2. **Loop-Body:**
   - Code-Node aktualisiert Variable mit `setVar('tester', currentArray)`
   - ✅ `workflowVariables` werden korrekt an Loop-Body weitergegeben

3. **Variable-Node nach Loop:**
   - Liest aktuellen Wert von `tester`
   - ✅ Read-only Mode funktioniert

### Identifizierte Probleme & Verbesserungen

#### 🔴 KRITISCH: Variable-Initialisierung

**Problem:**
- `variables: {}` ist leer in MongoDB
- Variable wird erst zur Laufzeit initialisiert
- Wenn Workflow neu gestartet wird, ist Variable nicht initialisiert

**Lösung:**
- Variable-Node mit `variableValue` sollte auch `workflow.variables` initialisieren
- Oder: VariablesPanel sollte initiale Werte in `workflow.variables` speichern

**Betroffene Szenarien:**
- Workflow wird neu gestartet → Variable ist `undefined`
- Workflow wird von anderem User ausgeführt → Variable ist nicht initialisiert
- Scheduled Workflows → Variable ist nicht initialisiert

#### 🟡 WICHTIG: If-Else Node im Loop

**Aktueller Status:**
- ✅ If-Else Node unterstützt `{{vars.variableName}}` in Conditions
- ✅ `workflowVariables` werden an Loop-Body weitergegeben
- ⚠️ **FEHLT:** Test ob If-Else im Loop-Body korrekt funktioniert

**Potenzielle Probleme:**
- If-Else im Loop-Body könnte Edge-Handling-Problem haben
- Condition mit Variable könnte zur falschen Zeit evaluiert werden

**Beispiel-Szenario:**
```
Loop → If-Else ({{vars.counter}} > 5) → Code (true) / Code (false) → End-Loop
```

**Zu prüfen:**
- Wird If-Else im Loop-Body korrekt ausgeführt?
- Werden `workflowVariables` korrekt an If-Else weitergegeben?
- Wird der richtige Branch (true/false) basierend auf Variable gewählt?

#### 🟡 WICHTIG: Nested Loops

**Szenario:**
```
Outer Loop → Variable Update → Inner Loop → Variable Update → End-Inner → End-Outer
```

**Potenzielle Probleme:**
- Variable-Updates im Inner Loop könnten nicht an Outer Loop weitergegeben werden
- `workflowVariables` müssen durch alle Loop-Ebenen propagiert werden

**Zu prüfen:**
- Werden `workflowVariables` korrekt an nested loops weitergegeben?
- Werden Variable-Updates im Inner Loop im Outer Loop sichtbar?

#### 🟡 WICHTIG: Variable in verschiedenen Node-Typen

**Aktueller Status:**
- ✅ Code Node: `$vars`, `setVar()`, `updateVar()`
- ✅ Variable Node: Set/Read Variables
- ✅ If-Else Node: `{{vars.variableName}}` in Conditions
- ❓ **FEHLT:** Andere Node-Typen

**Zu prüfen:**
- HTTP-Request Node: Kann `{{vars.apiUrl}}` verwenden?
- Transform Node: Kann `{{vars.template}}` verwenden?
- Email Node: Kann `{{vars.recipient}}` verwenden?
- LLM Node: Kann `{{vars.systemPrompt}}` verwenden?

#### 🟢 NICHT KRITISCH: Variable-Persistierung

**Aktueller Status:**
- ✅ Variables werden in `workflow.variables` gespeichert
- ✅ Variables werden beim Workflow-Load geladen
- ⚠️ Variables werden nur initial gespeichert, nicht zur Laufzeit

**Frage:**
- Sollen Variables zur Laufzeit persistiert werden?
- Oder nur initiale Werte?

## Empfohlene Verbesserungen

### 1. Variable-Initialisierung aus Variable-Node

**Problem:** Variable-Node mit `variableValue` initialisiert nicht `workflow.variables`

**Lösung:**
- Beim Speichern des Workflows: Sammle alle Variable-Nodes mit `variableValue`
- Initialisiere `workflow.variables` mit diesen Werten
- Oder: Variable-Node sollte beim ersten Set auch `workflow.variables` aktualisieren

### 2. If-Else im Loop-Body Testen

**Aktion:**
- Test-Workflow erstellen mit If-Else im Loop
- Prüfen ob Condition mit Variable korrekt evaluiert wird
- Prüfen ob richtiger Branch gewählt wird

### 3. Nested Loops Testen

**Aktion:**
- Test-Workflow mit nested loops erstellen
- Variable im Inner Loop aktualisieren
- Prüfen ob Variable im Outer Loop sichtbar ist

### 4. Variable in anderen Node-Typen

**Aktion:**
- Prüfen welche Node-Typen Expression-Resolution verwenden
- Sicherstellen dass `vars` im `expressionContext` enthalten ist
- Testen mit verschiedenen Node-Typen

### 5. Edge-Handling für If-Else im Loop

**Aktion:**
- Prüfen ob `executeLoopBody` If-Else Nodes korrekt behandelt
- Prüfen ob Edge-Selection für If-Else im Loop funktioniert

## Test-Szenarien

### Szenario 1: Variable-Initialisierung
```
1. Variable-Node mit variableValue: "[]"
2. Workflow speichern
3. Prüfen: workflow.variables.tester === []
```

### Szenario 2: If-Else im Loop
```
1. Loop über Array
2. If-Else im Loop-Body mit {{vars.counter}} > 5
3. Variable wird im Loop aktualisiert
4. Prüfen: Richtiger Branch wird gewählt
```

### Szenario 3: Nested Loops
```
1. Outer Loop
2. Variable Update
3. Inner Loop
4. Variable Update
5. Prüfen: Variable ist in beiden Loops sichtbar
```

### Szenario 4: Variable in HTTP-Request
```
1. Variable setzen: apiUrl = "https://api.example.com"
2. HTTP-Request mit URL: {{vars.apiUrl}}/endpoint
3. Prüfen: URL wird korrekt aufgelöst
```

## Code-Änderungen erforderlich

### 1. Variable-Node: Initialisierung von workflow.variables
**Datei:** `packages/execution-service/src/nodes/registerBuiltIns.ts`
- Beim Set einer Variable: Prüfen ob `workflow.variables` existiert
- Wenn nicht, initialisieren mit Variable-Value

### 2. Workflow Save: Sammle Variable-Initialwerte
**Datei:** `frontend/src/pages/WorkflowEditorPage.tsx`
- Beim Speichern: Sammle alle Variable-Nodes mit `variableValue`
- Initialisiere `workflow.variables` mit diesen Werten

### 3. Expression-Resolution: Prüfe alle Node-Typen
**Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`
- Prüfe welche Node-Typen Expression-Resolution verwenden
- Stelle sicher dass `vars` überall verfügbar ist

### 4. Loop-Body: If-Else Handling
**Datei:** `packages/execution-service/src/services/executionService.ts`
- Prüfe ob `executeLoopBody` If-Else Nodes korrekt behandelt
- Stelle sicher dass Edge-Selection für If-Else funktioniert

## Zusammenfassung

### ✅ Funktioniert
- Variable-Node: Set/Read
- Code-Node: `setVar()`, `updateVar()`
- Loop-Body: Variable-Updates
- If-Else: Variable in Conditions
- Expression-Resolution: `{{vars.variableName}}`

### ⚠️ Zu prüfen/Verbessern
- Variable-Initialisierung in `workflow.variables`
- If-Else im Loop-Body
- Nested Loops mit Variablen
- Variable in anderen Node-Typen (HTTP-Request, Transform, etc.)
- Edge-Handling für If-Else im Loop

### 🔴 Kritisch
- Variable-Initialisierung beim Workflow-Start
- Persistierung von initialen Variable-Werten

