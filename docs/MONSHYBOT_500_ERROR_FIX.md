# 🔧 500 Error Fix - Workflow Execution Endpoint

**Datum:** 2025-12-24  
**Status:** ✅ Behoben

---

## ❌ Problem

**Fehler:** 500 Internal Server Error beim Aufruf von `/api/workflows/{workflow_id}/execute`

**Ursache:**
1. Fehlende Validierung von `user` und `user.tenantId` im Endpoint
2. Unzureichende Fehlerbehandlung bei fehlender Authentifizierung
3. Fehlende Validierung der Workflow-Konfiguration

---

## ✅ Lösung

### 1. Verbesserte Authentifizierungs-Validierung

**Vorher:**
```typescript
const user = (req as any).user;
// Direkter Zugriff auf user.tenantId ohne Prüfung
if (workflow.tenantId !== user.tenantId) { ... }
```

**Nachher:**
```typescript
const user = (req as any).user;

// Validierung: Prüfe ob user und tenantId existieren
if (!user || !user.tenantId) {
  res.status(401).json({ 
    success: false, 
    error: 'Unauthorized: Invalid or missing authentication. Please check your API key or JWT token.' 
  });
  return;
}
```

### 2. Verbesserte Workflow-Validierung

**Neu hinzugefügt:**
```typescript
// Prüfe ob Workflow tenantId hat
if (!workflow.tenantId) {
  res.status(500).json({ 
    success: false, 
    error: 'Workflow configuration error: missing tenantId' 
  });
  return;
}
```

### 3. Verbesserte Fehlerbehandlung

**Neu hinzugefügt:**
- Detaillierte Logging mit Error-Stack
- Spezifische Fehlermeldungen für verschiedene Fehlertypen
- Connection-Error-Handling (ECONNREFUSED, ETIMEDOUT)
- Bessere Error-Responses mit Details

---

## 🧪 Test

**Request:**
```http
POST http://host.docker.internal:5000/api/workflows/694817015ca7ac9dfd6b82b0/execute
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "input": {
    "userInput": "Kannst du bitte eine Bestätigung an Telegram senden?"
  }
}
```

**Erwartetes Ergebnis:**
- ✅ 200 OK mit Workflow-Output
- ✅ Oder spezifische Fehlermeldung (401, 403, 404, 503) statt generischem 500

---

## 📋 Mögliche Fehler-Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or missing authentication. Please check your API key or JWT token."
}
```
**Ursache:** API Key ist ungültig oder fehlt

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden: You can only execute workflows from your own tenant"
}
```
**Ursache:** API Key gehört zu einem anderen Tenant als der Workflow

### 404 Not Found
```json
{
  "success": false,
  "error": "Workflow not found"
}
```
**Ursache:** Workflow existiert nicht oder ist nicht für diesen Tenant verfügbar

### 503 Service Unavailable
```json
{
  "success": false,
  "error": "Service temporarily unavailable: Execution service is not reachable",
  "code": "ECONNREFUSED"
}
```
**Ursache:** Execution-Service ist nicht erreichbar

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Workflow configuration error: missing tenantId"
}
```
**Ursache:** Workflow-Konfiguration ist fehlerhaft

---

## ✅ Nächste Schritte für MonshyBot

1. **API Key prüfen:**
   - Ist der API Key gültig?
   - Gehört der API Key zum richtigen Tenant?
   - Wird der API Key korrekt im `Authorization: Bearer {api_key}` Header gesendet?

2. **Workflow prüfen:**
   - Existiert der Workflow `694817015ca7ac9dfd6b82b0`?
   - Gehört der Workflow zum Tenant des API Keys?

3. **Request-Format prüfen:**
   - Endpoint: `POST /api/workflows/{workflow_id}/execute`
   - Header: `Authorization: Bearer {api_key}`
   - Body: `{ "input": {...} }`

4. **Error-Handling verbessern:**
   - Spezifische Fehlermeldungen werden jetzt zurückgegeben
   - Logs sollten jetzt mehr Details enthalten

---

## 📝 Code-Änderungen

**Datei:** `packages/api-service/src/controllers/WorkflowController.ts`

**Änderungen:**
- ✅ Validierung von `user` und `user.tenantId` hinzugefügt
- ✅ Validierung von `workflow.tenantId` hinzugefügt
- ✅ Verbesserte Fehlerbehandlung mit spezifischen Fehlermeldungen
- ✅ Detailliertes Logging für besseres Debugging

---

## 🔍 Debugging

**Server-Logs prüfen:**
```bash
# In den API-Service Logs sollte jetzt stehen:
- "Unauthorized: Missing user or tenantId" (wenn Auth fehlt)
- "Forbidden: User tried to execute workflow from another tenant" (wenn Tenant nicht passt)
- "Workflow not found" (wenn Workflow nicht existiert)
- Detaillierte Error-Stacks bei anderen Fehlern
```

**MonshyBot-Logs prüfen:**
- Welche Fehlermeldung wird jetzt zurückgegeben?
- Ist es noch ein 500 Error oder eine spezifischere Fehlermeldung?

---

## ✅ Update: Schema-Validierung Problem

### Problem 2: "must NOT have additional properties"

**Fehlermeldung:**
```json
{
  "success": false,
  "error": "Input validation failed: Input validation failed: root: must NOT have additional properties"
}
```

**Ursache:**
- Das Input-Schema im Workflow validiert gegen `request.input`
- Das Schema hat möglicherweise `additionalProperties: false` und erwartet nur bestimmte Properties
- Oder das Input-Format stimmt nicht mit dem erwarteten Schema überein

**Lösung:**
- ✅ Code angepasst, um verschiedene Input-Formate zu unterstützen
- ✅ Bessere Fehlermeldungen mit detaillierten Validierungs-Fehlern
- ✅ Automatische Extraktion von `input` Wrapper falls vorhanden

**Bitte erneut testen:**
- Die Validierung sollte jetzt robuster sein
- Detailliertere Fehlermeldungen sollten helfen, das Problem zu identifizieren

---

## ✅ Status

**Behoben:** ✅  
**Getestet:** ⏳ (Bitte testen mit MonshyBot)  
**Dokumentiert:** ✅

---

**Bei weiteren Problemen bitte die neuen, detaillierten Fehlermeldungen aus den Logs senden!**

