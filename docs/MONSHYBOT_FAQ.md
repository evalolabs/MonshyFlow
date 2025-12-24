# 🎤 MonshyBot Integration - FAQ & Klarstellungen

**Zweck:** Antworten auf häufige Fragen von MonshyBot-Entwicklern

---

## ✅ Auth-Endpoints Status

### Frage: Sind die Auth-Endpoints implementiert?

**Antwort:** ✅ **JA, die Endpoints sind implementiert!**

Die folgenden Endpoints sind verfügbar:

1. **`GET /api/auth/me`** - User Info abrufen
   - ✅ Implementiert in `packages/auth-service/src/controllers/AuthController.ts`
   - ✅ Route konfiguriert in `packages/auth-service/src/routes/index.ts`
   - ✅ Kong Gateway Route in `kong/kong.yml`

2. **`GET /api/auth/validate`** - Token Validierung
   - ✅ Implementiert in `packages/auth-service/src/controllers/AuthController.ts`
   - ✅ Route konfiguriert in `packages/auth-service/src/routes/index.ts`
   - ✅ Kong Gateway Route in `kong/kong.yml`

### Wenn du 404 erhältst:

**Mögliche Ursachen:**
1. Services nicht neu gestartet nach Code-Änderungen
2. Kong Gateway nicht neu geladen
3. Falsche Base URL

**Lösung:**
```bash
# Services neu starten
cd packages/auth-service
pnpm run dev

# Kong Gateway neu laden (falls verwendet)
# Kong sollte automatisch neue Routes erkennen
```

---

## 🔌 Workflow Execution Endpoint

### Frage: Welcher Endpoint ist korrekt? `/api/workflows/:workflowId/execute` oder `/api/webhooks/:workflowId`?

**Antwort:** **BEIDE existieren, aber für MonshyBot: `/api/workflows/:workflowId/execute`**

### Unterschied:

| Endpoint | Auth | Zweck | Für MonshyBot? |
|----------|------|-------|----------------|
| `POST /api/workflows/:workflowId/execute` | ✅ Benötigt JWT/API Key | Programmatische Execution | ✅ **JA** |
| `POST /api/webhooks/:workflowId` | ❌ Keine Auth | Öffentliche Webhooks | ❌ Nein |

### Empfehlung für MonshyBot:

**Verwende `POST /api/workflows/:workflowId/execute`** weil:
- ✅ Unterstützt JWT/API Key Authentication
- ✅ Vollständige Features
- ✅ Besser für programmatische Integration
- ✅ REST-konform und konsistent

**Migration von alten Endpoints:**

```python
# Alt (Webhook, keine Auth)
endpoint = f"/api/webhook/{workflow_id}"

# Alt (Execute, direkter Endpoint)
endpoint = f"/api/execute/{workflow_id}"

# Neu (Execute, REST-konform)
endpoint = f"/api/workflows/{workflow_id}/execute"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
```

---

## 📦 Login Response Format

### Frage: Welches Format ist korrekt?

**Antwort:** **Das tatsächliche Format ist:**

```json
{
  "success": true,
  "data": {
    "token": "...",
    "user": {...}
  }
}
```

**NICHT:**
```json
{
  "success": true,
  "token": "...",
  "user": {...}
}
```

### Code-Beispiel:

```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

const data = await response.json();

// ✅ Korrekt:
if (data.success && data.data) {
  const token = data.data.token;
  const user = data.data.user;
}

// ❌ Falsch:
if (data.success) {
  const token = data.token; // undefined!
}
```

---

## 🔧 Troubleshooting

### Problem: 404 auf `/api/auth/me` oder `/api/auth/validate`

**Lösung:**
1. Prüfe ob auth-service läuft
2. Prüfe Kong Gateway Konfiguration
3. Prüfe Base URL (sollte `http://localhost:5000` sein, nicht direkt auth-service)

### Problem: 401 Unauthorized auf `/api/execute/:workflowId`

**Lösung:**
1. Prüfe ob Token im Authorization Header ist
2. Prüfe ob Token gültig ist (via `/api/auth/validate`)
3. Prüfe ob Token nicht abgelaufen ist

### Problem: Workflow Execution schlägt fehl

**Lösung:**
1. Prüfe ob Workflow existiert
2. Prüfe ob Workflow published ist (für `/api/webhook`)
3. Prüfe ob Input-Format korrekt ist

### Problem: 404 auf `/api/tenants/:tenantId`

**Lösung:**
1. ✅ Endpoint ist implementiert: `GET /api/tenants/:tenantId`
2. Prüfe ob Token im Authorization Header ist
3. Prüfe ob `tenantId` im Token mit `tenantId` im Request übereinstimmt
4. User kann nur seinen eigenen Tenant abrufen (Sicherheit)

**Wichtig:** 
- User kann nur seinen eigenen Tenant abrufen (basierend auf `tenantId` im JWT Token)
- Wenn `tenantId` im Token nicht mit `tenantId` im Request übereinstimmt → 403 Forbidden

---

## 📚 Weitere Ressourcen

- **Vollständige Dokumentation:** `docs/MONSHYBOT_INTEGRATION.md`
- **API Endpoints:** Siehe Dokumentation
- **Beispiele:** TypeScript & Python Beispiele in Dokumentation

---

**Letzte Aktualisierung:** 2025-12-21

