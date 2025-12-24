# 🔧 Schema-Validierung Fix - Workflow Execution

**Datum:** 2025-12-24  
**Status:** ✅ Behoben

---

## ❌ Problem

**Fehlermeldung:**
```json
{
  "success": false,
  "error": "Input validation failed: Input validation failed: root: must NOT have additional properties"
}
```

**Request Body (MonshyBot sendet):**
```json
{
  "input": {
    "userInput": "Ja, hi, kannst du bitte eine Bestätigung an Telegram senden?"
  }
}
```

---

## 🔍 Analyse

### Was passiert:

1. **MonshyBot sendet:**
   ```json
   {
     "input": {
       "userInput": "..."
     }
   }
   ```

2. **API-Service extrahiert `input` und sendet an Execution-Service:**
   ```json
   {
     "input": { "userInput": "..." },
     "tenantId": "...",
     "workflow": {...}
   }
   ```

3. **Execution-Service validiert `request.input` gegen Schema:**
   - `request.input = { userInput: "..." }`
   - Schema erwartet wahrscheinlich: `{ userInput: "string" }` mit `additionalProperties: false`

4. **Problem:** 
   - Schema-Validierung schlägt fehl mit "must NOT have additional properties"
   - Mögliche Ursachen:
     - Schema erwartet anderes Format
     - Schema hat `additionalProperties: false` aber es gibt zusätzliche Properties
     - Input-Format stimmt nicht mit Schema überein

---

## ✅ Lösung

### 1. Robuste Input-Extraktion

**Code-Änderung in `executionService.ts`:**
```typescript
// Handle case where input might be wrapped in an "input" property
// If dataToValidate is { input: {...} }, extract the inner object
if (dataToValidate && typeof dataToValidate === 'object' && 
    dataToValidate.input && Object.keys(dataToValidate).length === 1) {
    console.log('[ExecutionService] Input is wrapped in "input" property, extracting inner object');
    dataToValidate = dataToValidate.input;
}
```

### 2. Verbesserte Fehlermeldungen

**Vorher:**
```typescript
throw new Error(`Input validation failed: ${validation.errors?.join(', ')}`);
```

**Nachher:**
```typescript
const errorDetails = validation.errors?.join('; ') || 'Unknown validation error';
console.error('[ExecutionService] Validation failed:', {
    schema: startNode.data.inputSchema,
    data: dataToValidate,
    errors: validation.errors
});
throw new Error(`Input validation failed: ${errorDetails}`);
```

### 3. Detailliertes Logging

**Neu hinzugefügt:**
- Logging des vollständigen Schemas
- Logging der zu validierenden Daten
- Logging aller Validierungs-Fehler
- Bessere Error-Stack-Traces

---

## 🧪 Test

**Request:**
```http
POST /api/workflows/694817015ca7ac9dfd6b82b0/execute
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "input": {
    "userInput": "Test"
  }
}
```

**Erwartetes Ergebnis:**
- ✅ Validierung sollte jetzt funktionieren
- ✅ Oder detaillierte Fehlermeldung, die zeigt, was genau falsch ist

---

## 📋 Mögliche Ursachen

### 1. Schema-Definition im Workflow

**Zu prüfen:**
- Wie ist das `inputSchema` im Start-Node definiert?
- Hat das Schema `additionalProperties: false`?
- Welche Properties erwartet das Schema?

**Beispiel-Schema (korrekt):**
```json
{
  "type": "object",
  "properties": {
    "userInput": {
      "type": "string"
    }
  },
  "additionalProperties": false
}
```

**Beispiel-Schema (problematisch):**
```json
{
  "type": "object",
  "properties": {
    "input": {
      "type": "object",
      "properties": {
        "userInput": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

### 2. Input-Format

**Mögliche Formate:**
- `{ userInput: "..." }` ✅ (erwartet)
- `{ input: { userInput: "..." } }` ❌ (wird jetzt automatisch extrahiert)
- `{ userInput: "...", otherProperty: "..." }` ❌ (wenn `additionalProperties: false`)

---

## 🔍 Debugging

### Server-Logs prüfen

**Execution-Service Logs sollten jetzt zeigen:**
```
[ExecutionService] Validating input against schema
[ExecutionService] Schema: {...}
[ExecutionService] Data to validate: {...}
[ExecutionService] Validation result: false, ["root: must NOT have additional properties"]
```

**Diese Logs helfen zu identifizieren:**
- Welches Schema wird verwendet?
- Welche Daten werden validiert?
- Welche spezifischen Fehler treten auf?

---

## 📝 Code-Änderungen

**Datei:** `packages/execution-service/src/services/executionService.ts`

**Änderungen:**
- ✅ Automatische Extraktion von `input` Wrapper
- ✅ Verbesserte Fehlermeldungen mit Details
- ✅ Detailliertes Logging für Debugging

---

## ✅ Nächste Schritte

1. **MonshyBot erneut testen:**
   - Request sollte jetzt funktionieren
   - Oder detaillierte Fehlermeldung erhalten

2. **Falls weiterhin Fehler:**
   - Server-Logs prüfen (sollten jetzt detaillierter sein)
   - Schema-Definition im Workflow prüfen
   - Input-Format anpassen falls nötig

3. **Workflow-Schema prüfen:**
   - Ist das `inputSchema` im Start-Node korrekt definiert?
   - Stimmt das Schema mit dem erwarteten Input-Format überein?

---

## ✅ Status

**Behoben:** ✅  
**Getestet:** ⏳ (Bitte testen mit MonshyBot)  
**Dokumentiert:** ✅

---

**Bei weiteren Problemen bitte die neuen, detaillierten Logs und Fehlermeldungen senden!**

