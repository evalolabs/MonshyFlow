# 🧪 Postman Test - Workflow Execution

**Datum:** 2025-12-24  
**Endpoint:** `POST /api/workflows/{workflow_id}/execute`

---

## ✅ Postman-Konfiguration

### 1. Request Setup

**Method:** `POST`  
**URL:** `http://localhost:5000/api/workflows/694817015ca7ac9dfd6b82b0/execute`

### 2. Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {dein_api_key}` |
| `Content-Type` | `application/json` |

### 3. Body (raw JSON)

```json
{
  "input": {
    "userInput": "Test Nachricht von Postman"
  }
}
```

---

## 🔍 Erwartete Responses

### ✅ 200 OK (Erfolg)
```json
{
  "executionId": "exec_xxxxxxxxxxxx",
  "status": "completed",
  "output": {
    "result": "...",
    "data": {...}
  },
  "trace": [...]
}
```

### ❌ 500 Internal Server Error (Schema-Validierung)

**Problem:** "Input validation failed: root: must NOT have additional properties"

**Ursache:** Das Input-Schema im Workflow erwartet ein anderes Format

**Lösung:** Code wurde angepasst, um verschiedene Input-Formate zu unterstützen

**Bitte erneut testen nach Code-Update!**

---

## 🐛 Debugging

### Server-Logs prüfen

**Execution-Service Logs sollten zeigen:**
```
[ExecutionService] Validating input against schema
[ExecutionService] Schema: {...}
[ExecutionService] Schema expects nested input: true/false
[ExecutionService] Data to validate (final): {...}
[ExecutionService] Validation result: true/false, [...]
```

**Diese Logs helfen zu identifizieren:**
- Welches Schema wird verwendet?
- Erwartet das Schema eine verschachtelte Struktur?
- Welche Daten werden validiert?
- Welche spezifischen Fehler treten auf?

---

## 📝 Code-Änderungen

**Datei:** `packages/execution-service/src/services/executionService.ts`

**Änderungen:**
- ✅ Automatische Erkennung, ob Schema verschachtelte Struktur erwartet
- ✅ Automatisches Wrapping/Extrahieren von Input je nach Schema
- ✅ Verbesserte Fehlermeldungen mit Details
- ✅ Detailliertes Logging für Debugging

---

## ✅ Status

**Behoben:** ✅  
**Getestet:** ⏳ (Bitte in Postman testen)  
**Dokumentiert:** ✅

---

**Bei weiteren Problemen bitte die Server-Logs senden!**

