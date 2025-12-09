# 🌐 Gateway - Integriert im API Service

## 📋 Übersicht

Das **Gateway ist vollständig integriert** im API Service und nutzt **http-proxy-middleware** (kostenlos) statt teurer Lösungen wie Kong.

---

## ✅ Warum integriert?

1. **Kostenersparnis** - Kein separater Container nötig
2. **Performance** - Keine zusätzliche Network-Hop
3. **Einfachheit** - Ein Service weniger zu deployen
4. **Kostenlos** - http-proxy-middleware statt Kong (~$100+/Monat)

---

## 🔄 Gateway-Funktionen

### 1. Request Routing

Das Gateway routet Requests zu den entsprechenden Services:

```
Frontend Request
    ↓
API Service (Gateway)
    ↓
┌─── Auth Service (/api/auth, /api/apikeys)
├─── Secrets Service (/api/secrets)
├─── Execution Service (/api/execute, /api/execution)
└─── Scheduler Service (/api/scheduler)
```

### 2. Security Features

- ✅ **Rate Limiting** - Schutz vor DDoS
- ✅ **Security Headers** - Helmet
- ✅ **CORS** - Konfiguriert
- ✅ **Request Logging** - Strukturiertes Logging

### 3. Error Handling

- ✅ **Service Unavailable** - Wenn Backend-Service nicht erreichbar
- ✅ **Timeout Handling** - Automatische Timeouts
- ✅ **Error Logging** - Fehler werden geloggt

---

## 📍 Routing-Tabelle

| Route | Target Service | Beschreibung |
|-------|---------------|--------------|
| `/api/workflows` | API Service (lokal) | Workflow CRUD |
| `/api/auth` | Auth Service | Authentication |
| `/api/apikeys` | Auth Service | API Key Management |
| `/api/secrets` | Secrets Service | Secrets Management |
| `/api/execute` | Execution Service | Workflow Execution |
| `/api/execution` | Execution Service | Execution History |
| `/api/scheduler` | Scheduler Service | Workflow Scheduling |
| `/api/webhook` | API Service (lokal) | Webhook Endpoints |

---

## 🔧 Konfiguration

### Service URLs

```typescript
// packages/api-service/src/config/index.ts
export const config = {
  services: {
    auth: {
      url: getServiceUrl('auth-service', 5002),
    },
    secrets: {
      url: getServiceUrl('secrets-service', 5003),
    },
    execution: {
      url: getServiceUrl('execution-service', 5004),
    },
    scheduler: {
      url: getServiceUrl('scheduler-service', 5005),
    },
  },
};
```

### Environment Variables

```bash
# Lokal
AUTH_SERVICE_URL=http://localhost:5002
SECRETS_SERVICE_URL=http://localhost:5003
EXECUTION_SERVICE_URL=http://localhost:5004
SCHEDULER_SERVICE_URL=http://localhost:5005

# Azure (automatisch über Service Discovery)
# Container Apps erkennt interne Namen: auth-service:80
```

---

## 💰 Kostenvergleich

### Kong (Externes Gateway)
- **Kosten:** ~$100-500/Monat
- **Features:** Viele, aber nicht alle nötig
- **Komplexität:** Hoch

### http-proxy-middleware (Aktuell)
- **Kosten:** $0 (kostenlos)
- **Features:** Alles was wir brauchen
- **Komplexität:** Niedrig

**Ersparnis: ~$100-500/Monat** 💰

---

## 🚀 Vorteile

1. **Kostenlos** - Keine zusätzlichen Gateway-Kosten
2. **Einfach** - Standard Express Middleware
3. **Flexibel** - Einfach zu erweitern
4. **Performance** - Direkt im API Service, keine zusätzliche Hop
5. **Wartbar** - TypeScript, klare Struktur

---

## 📝 Erweiterungen

### Neue Route hinzufügen

```typescript
// packages/api-service/src/routes/index.ts
app.use(
  '/api/new-route',
  createProxyMiddleware({
    target: config.services.newService.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/new-route': '/api/new-route',
    },
  })
);
```

### Custom Middleware

```typescript
app.use(
  '/api/protected',
  authMiddleware, // Custom Auth Middleware
  createProxyMiddleware({
    target: config.services.target.url,
  })
);
```

---

## ✅ Fazit

Das Gateway ist **vollständig funktional**, **kostenlos** und **produktionsreif**. Es bietet alle Features, die wir brauchen, ohne die Kosten von externen Gateway-Lösungen wie Kong.

**Status:** ✅ Production Ready

