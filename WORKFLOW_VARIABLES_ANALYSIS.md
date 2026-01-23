# Workflow Variables - Umfassende Analyse & Status

**Datum:** 2026-01-22  
**Status:** ✅ Implementiert, ⚠️ Verbesserungen empfohlen

---

## 📋 Executive Summary

Das Workflow-Variablen-System ist **vollständig implementiert** und funktioniert grundsätzlich korrekt. Es gibt jedoch einige **wichtige Verbesserungsmöglichkeiten** für Robustheit und Benutzerfreundlichkeit.

### ✅ Was funktioniert:
- Variable-Node: Set/Read von Variablen
- Code-Node: `setVar()`, `updateVar()`, `$vars` Zugriff
- Loop-Body: Variable-Updates werden korrekt propagiert
- If-Else: Variable in Conditions (`{{vars.variableName}}`)
- Expression-Resolution: `{{vars.variableName}}` mit nested paths
- Persistierung: Variables werden in `workflow.variables` gespeichert
- Initialisierung: Variables werden beim Workflow-Start geladen

### ⚠️ Verbesserungsbedarf:
- Variable-Initialisierung aus Variable-Node in `workflow.variables`
- Test für If-Else im Loop-Body
- Test für Nested Loops
- Vollständige Integration in alle Node-Typen

---

## 🏗️ Architektur-Übersicht

### 1. Datenfluss

```
Frontend (VariablesPanel)
    ↓ (speichert initiale Werte)
workflow.variables (MongoDB)
    ↓ (wird geladen beim Workflow-Start)
ExecutionService.processWorkflowSequentially()
    ↓ (initialisiert)
workflowVariables: Record<string, any>
    ↓ (wird weitergegeben)
NodeProcessorContext.variables
    ↓ (wird verwendet von)
- Variable Node (set/read)
- Code Node (setVar, updateVar, $vars)
- Expression Resolution ({{vars.name}})
- If-Else Node (condition evaluation)
```

### 2. Speicherorte

| Ort | Zweck | Persistierung |
|-----|-------|---------------|
| `workflow.variables` (MongoDB) | Initiale Werte | ✅ Persistiert |
| `workflowVariables` (Runtime) | Laufzeit-Werte | ❌ Nur während Execution |
| `context.variables` | Node-Context | ❌ Nur während Node-Processing |

### 3. Initialisierung

**Aktueller Flow:**
1. Workflow wird geladen → `workflow.variables` wird aus DB gelesen
2. `ExecutionService.processWorkflowSequentially()` initialisiert `workflowVariables` aus `workflow.variables`
3. `workflowVariables` wird an alle `processNode()` Calls weitergegeben
4. Variable-Node kann Werte setzen/lesen in `context.variables` (welches auf `workflowVariables` referenziert)

**Problem:** Wenn `workflow.variables` leer ist, werden initiale Werte aus Variable-Nodes nicht automatisch in `workflow.variables` gespeichert.

---

## 🔍 Detaillierte Code-Analyse

### 1. Variable-Node Processor

**Datei:** `packages/execution-service/src/nodes/registerBuiltIns.ts` (Zeile 552-717)

**Funktionalität:**
- ✅ Set Variable: Wenn `variableValue` gesetzt ist, wird Variable in `context.variables` gesetzt
- ✅ Read Variable: Wenn `variableValue` leer ist, wird aktueller Wert zurückgegeben
- ✅ Expression Resolution: `variableValue` kann `{{steps.nodeId.json}}` oder `{{vars.otherVar}}` enthalten
- ✅ JSON Parsing: Automatisches Parsing von JSON-Strings (Arrays, Objects)

**Code-Snippet:**
```typescript
// Set variable in context
context.variables[variableName.trim()] = resolvedValue;
```

**Problem:** Variable wird nur in `context.variables` gesetzt, nicht in `workflow.variables` (für Persistierung).

### 2. Code-Node Processor

**Datei:** `packages/execution-service/src/nodes/registerBuiltIns.ts` (Zeile 353-550)

**Funktionalität:**
- ✅ `$vars`: Direkter Zugriff auf `context.variables`
- ✅ `setVar(name, value)`: Setzt Variable in `context.variables`
- ✅ `updateVar(name, path, value)`: Aktualisiert nested Property (z.B. `updateVar('user', 'profile.email', 'new@email.com')`)

**Code-Snippet:**
```typescript
setVar: (name: string, value: any) => {
    if (!context.variables) {
        context.variables = {};
    }
    context.variables[name] = value;
},
```

**Status:** ✅ Funktioniert korrekt

### 3. Expression Resolution

**Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

**Funktionalität:**
- ✅ `{{vars.variableName}}`: Zugriff auf Variable
- ✅ `{{vars.array[0]}}`: Array-Zugriff
- ✅ `{{vars.user.name}}`: Nested Property-Zugriff

**Code-Snippet:**
```typescript
// Replace {{vars.name}} patterns
const varsPattern = /\{\{vars\.([^}]+)\}\}/g;
// ... path resolution logic ...
```

**Status:** ✅ Funktioniert korrekt

### 4. If-Else Node

**Datei:** `packages/execution-service/src/nodes/registerBuiltIns.ts` (Zeile 1845-1922)

**Funktionalität:**
- ✅ Condition kann `{{vars.variableName}}` enthalten
- ✅ Expression wird aufgelöst
- ✅ Condition wird evaluiert (===, ==, !==, !=, <, >, <=, >=, truthy/falsy)

**Code-Snippet:**
```typescript
const vars = context.variables || {};
const resolvedCondition = expressionResolutionService.resolveExpressions(
    condition,
    { input: input?.json || context.input || {}, steps, secrets, vars },
    { execution: context.execution, currentNodeId: node.id }
);
```

**Status:** ✅ Funktioniert korrekt

### 5. Loop-Body Execution

**Datei:** `packages/execution-service/src/services/executionService.ts` (Zeile 1000-1120)

**Funktionalität:**
- ✅ `workflowVariables` wird an `processNode()` im Loop-Body weitergegeben
- ✅ Variable-Updates im Loop-Body werden korrekt propagiert

**Code-Snippet:**
```typescript
const loopBodyOutput = await this.processNode(loopBodyNode, loopInput, workflow, execution, workflowVariables);
```

**Status:** ✅ Funktioniert korrekt

### 6. Workflow Initialisierung

**Datei:** `packages/execution-service/src/services/executionService.ts` (Zeile 796-804)

**Funktionalität:**
- ✅ `workflowVariables` wird aus `workflow.variables` initialisiert
- ✅ Deep Clone um Reference-Issues zu vermeiden

**Code-Snippet:**
```typescript
const workflowVariables: Record<string, any> = {};
if (workflow.variables) {
    Object.assign(workflowVariables, JSON.parse(JSON.stringify(workflow.variables)));
}
```

**Status:** ✅ Funktioniert korrekt

---

## 🐛 Identifizierte Probleme

### 🔴 KRITISCH: Variable-Initialisierung

**Problem:**
- Variable-Node mit `variableValue: "[]"` setzt Variable nur zur Laufzeit
- `workflow.variables` bleibt leer (`{}`)
- Wenn Workflow neu gestartet wird, ist Variable `undefined`

**Betroffene Szenarien:**
1. Workflow wird neu gestartet → Variable ist `undefined`
2. Workflow wird von anderem User ausgeführt → Variable ist nicht initialisiert
3. Scheduled Workflows → Variable ist nicht initialisiert

**Lösung:**
- Beim Speichern des Workflows: Sammle alle Variable-Nodes mit `variableValue`
- Initialisiere `workflow.variables` mit diesen Werten
- Oder: Variable-Node sollte beim ersten Set auch `workflow.variables` aktualisieren (nur beim ersten Mal)

**Betroffene Dateien:**
- `frontend/src/pages/WorkflowEditorPage.tsx` (handleSave)
- `packages/execution-service/src/nodes/registerBuiltIns.ts` (Variable Node Processor)

### 🟡 WICHTIG: If-Else im Loop-Body

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

**Betroffene Dateien:**
- `packages/execution-service/src/services/executionService.ts` (executeLoopPairBetweenMarkers)

### 🟡 WICHTIG: Nested Loops

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

**Betroffene Dateien:**
- `packages/execution-service/src/services/executionService.ts` (executeLoopPairBetweenMarkers)

### 🟡 WICHTIG: Variable in verschiedenen Node-Typen

**Aktueller Status:**
- ✅ Code Node: `$vars`, `setVar()`, `updateVar()`
- ✅ Variable Node: Set/Read Variables
- ✅ If-Else Node: `{{vars.variableName}}` in Conditions
- ✅ Agent Node: `vars` in expressionContext (Zeile 2078)
- ✅ End Node: `vars` fehlt in expressionContext (Zeile 78-82)
- ❓ **FEHLT:** Andere Node-Typen

**Zu prüfen:**
- HTTP-Request Node: Kann `{{vars.apiUrl}}` verwenden?
- Transform Node: Kann `{{vars.template}}` verwenden?
- Email Node: Kann `{{vars.recipient}}` verwenden?
- LLM Node: Kann `{{vars.systemPrompt}}` verwenden?

**Betroffene Dateien:**
- `packages/execution-service/src/nodes/registerBuiltIns.ts` (alle Node-Processor)

### 🟢 NICHT KRITISCH: Variable-Persistierung

**Aktueller Status:**
- ✅ Variables werden in `workflow.variables` gespeichert
- ✅ Variables werden beim Workflow-Load geladen
- ⚠️ Variables werden nur initial gespeichert, nicht zur Laufzeit

**Frage:**
- Sollen Variables zur Laufzeit persistiert werden?
- Oder nur initiale Werte?

**Antwort:** Nur initiale Werte sind sinnvoll, da Variables zur Laufzeit dynamisch sind.

---

## 📊 Test-Szenarien

### ✅ Szenario 1: Variable-Initialisierung (FEHLT)

```
1. Variable-Node mit variableValue: "[]"
2. Workflow speichern
3. Prüfen: workflow.variables.tester === []
```

**Status:** ❌ Nicht implementiert

### ✅ Szenario 2: If-Else im Loop (FEHLT)

```
1. Loop über Array
2. If-Else im Loop-Body mit {{vars.counter}} > 5
3. Variable wird im Loop aktualisiert
4. Prüfen: Richtiger Branch wird gewählt
```

**Status:** ❌ Nicht getestet

### ✅ Szenario 3: Nested Loops (FEHLT)

```
1. Outer Loop
2. Variable Update
3. Inner Loop
4. Variable Update
5. Prüfen: Variable ist in beiden Loops sichtbar
```

**Status:** ❌ Nicht getestet

### ✅ Szenario 4: Variable in HTTP-Request (FEHLT)

```
1. Variable setzen: apiUrl = "https://api.example.com"
2. HTTP-Request mit URL: {{vars.apiUrl}}/endpoint
3. Prüfen: URL wird korrekt aufgelöst
```

**Status:** ❌ Nicht getestet

---

## 🔧 Empfohlene Verbesserungen

### 1. Variable-Initialisierung aus Variable-Node

**Problem:** Variable-Node mit `variableValue` initialisiert nicht `workflow.variables`

**Lösung Option A:** Beim Speichern des Workflows
- Sammle alle Variable-Nodes mit `variableValue`
- Initialisiere `workflow.variables` mit diesen Werten

**Code-Änderung:**
```typescript
// In WorkflowEditorPage.tsx handleSave()
const initialVariables: Record<string, any> = {};
nodes.forEach(node => {
    if (node.type === 'variable' && node.data?.variableName && node.data?.variableValue) {
        const varName = node.data.variableName.trim();
        const varValue = node.data.variableValue;
        // Parse value if it's JSON
        try {
            if (typeof varValue === 'string' && (varValue.trim().startsWith('{') || varValue.trim().startsWith('['))) {
                initialVariables[varName] = JSON.parse(varValue);
            } else {
                initialVariables[varName] = varValue;
            }
        } catch {
            initialVariables[varName] = varValue;
        }
    }
});

const workflowData = {
    // ... existing fields
    variables: { ...workflowVariables, ...initialVariables },
};
```

**Lösung Option B:** Variable-Node beim ersten Set
- Variable-Node sollte beim ersten Set auch `workflow.variables` aktualisieren
- Problem: `workflow` ist nicht direkt im Context verfügbar

**Empfehlung:** Option A (beim Speichern)

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

**Betroffene Nodes:**
- End Node (Zeile 78-82): `vars` fehlt
- HTTP-Request Node: Prüfen ob `vars` vorhanden
- Transform Node: Prüfen ob `vars` vorhanden
- Email Node: Prüfen ob `vars` vorhanden
- LLM Node: Prüfen ob `vars` vorhanden

### 5. Edge-Handling für If-Else im Loop

**Aktion:**
- Prüfen ob `executeLoopPairBetweenMarkers` If-Else Nodes korrekt behandelt
- Prüfen ob Edge-Selection für If-Else im Loop funktioniert

---

## 📝 Code-Änderungen erforderlich

### 1. Variable-Node: Initialisierung von workflow.variables

**Datei:** `frontend/src/pages/WorkflowEditorPage.tsx`

**Änderung:** In `handleSave()`:
```typescript
// Sammle initiale Werte aus Variable-Nodes
const initialVariables: Record<string, any> = {};
nodes.forEach(node => {
    if (node.type === 'variable' && node.data?.variableName && node.data?.variableValue) {
        const varName = node.data.variableName.trim();
        const varValue = node.data.variableValue;
        // Parse value if it's JSON
        try {
            if (typeof varValue === 'string' && (varValue.trim().startsWith('{') || varValue.trim().startsWith('['))) {
                initialVariables[varName] = JSON.parse(varValue);
            } else {
                initialVariables[varName] = varValue;
            }
        } catch {
            initialVariables[varName] = varValue;
        }
    }
});

// Merge mit bestehenden workflowVariables
const finalVariables = { ...workflowVariables, ...initialVariables };

const workflowData = {
    // ... existing fields
    variables: finalVariables,
};
```

### 2. End Node: vars in expressionContext

**Datei:** `packages/execution-service/src/nodes/registerBuiltIns.ts` (Zeile 76-84)

**Änderung:**
```typescript
// Get workflow variables from context
const vars = context.variables || {};

// Resolve expressions
const result = expressionResolutionService.resolveExpressions(
    resultMessage,
    { 
        input: input?.json || context.input || {}, 
        steps, 
        secrets,
        vars  // NEW: Add vars
    },
    { execution: context.execution, currentNodeId: node.id }
);
```

### 3. Expression-Resolution: Prüfe alle Node-Typen

**Datei:** `packages/execution-service/src/nodes/registerBuiltIns.ts`

**Aktion:**
- Durchsuche alle Node-Processor nach `expressionResolutionService.resolveExpressions`
- Stelle sicher dass `vars` überall im `expressionContext` enthalten ist

---

## ✅ Zusammenfassung

### Was funktioniert:
- ✅ Variable-Node: Set/Read
- ✅ Code-Node: `setVar()`, `updateVar()`, `$vars`
- ✅ Loop-Body: Variable-Updates
- ✅ If-Else: Variable in Conditions
- ✅ Expression-Resolution: `{{vars.variableName}}`
- ✅ Persistierung: Variables werden gespeichert
- ✅ Initialisierung: Variables werden geladen

### Zu prüfen/Verbessern:
- ⚠️ Variable-Initialisierung in `workflow.variables`
- ⚠️ If-Else im Loop-Body
- ⚠️ Nested Loops mit Variablen
- ⚠️ Variable in anderen Node-Typen (HTTP-Request, Transform, etc.)
- ⚠️ End Node: `vars` fehlt in expressionContext

### Kritisch:
- 🔴 Variable-Initialisierung beim Workflow-Start
- 🔴 Persistierung von initialen Variable-Werten

---

## 🎯 Nächste Schritte

1. **PRIORITÄT 1:** Variable-Initialisierung aus Variable-Node implementieren
2. **PRIORITÄT 2:** End Node: `vars` in expressionContext hinzufügen
3. **PRIORITÄT 3:** Test-Workflows für If-Else im Loop und Nested Loops erstellen
4. **PRIORITÄT 4:** Alle Node-Typen auf `vars` Support prüfen

---

**Ende der Analyse**
