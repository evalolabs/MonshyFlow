# 🌐 Gateway Debugging - Problembeschreibung

## 📋 Gateway-Architektur

### Überblick
Das Gateway ist **vollständig integriert** im `api-service` (Port 5000) und nutzt `http-proxy-middleware` für das Routing zu anderen Microservices.

```
Frontend/Postman
    ↓
API Service (Port 5000) - Gateway
    ↓
┌─── Auth Service (Port 5002 / Docker: auth-service:80)
├─── Secrets Service (Port 5003 / Docker: secrets-service:80)
├─── Execution Service (Port 5004 / Docker: execution-service:5004)
└─── Scheduler Service (Port 5005 / Docker: scheduler-service:80)
```

### Komponenten

#### 1. **API Service (`packages/api-service/`)**
- **Port:** 5000 (lokal) / 80 (Docker)
- **Rolle:** Gateway + Workflow Management
- **Entry Point:** `packages/api-service/src/index.ts`

#### 2. **Routing-Konfiguration (`packages/api-service/src/routes/index.ts`)**
- Definiert alle Gateway-Routes
- Verwendet `http-proxy-middleware` für Proxy-Funktionalität
- Separate Proxies für öffentliche und geschützte Routes

#### 3. **Service-Konfiguration (`packages/api-service/src/config/index.ts`)**
- Dynamische Service-URL-Erkennung:
  - **Lokal:** `http://127.0.0.1:5002` (IPv4, explizit)
  - **Docker:** `http://auth-service:80` (Service-Namen)
  - **Azure:** `http://auth-service:80` (Container Apps)

### Gateway-Routes

#### Öffentliche Routes (keine Auth-Middleware)
```typescript
POST /api/auth/login     → Auth Service
POST /api/auth/register  → Auth Service
```

#### Geschützte Routes (mit Auth-Middleware)
```typescript
/api/auth/*             → Auth Service (außer login/register)
/api/apikeys/*          → Auth Service
/api/secrets/*          → Secrets Service
/api/execute/*          → Execution Service
/api/execution/*        → Execution Service
/api/scheduler/*        → Scheduler Service
```

#### Lokale Routes (direkt im API Service)
```typescript
GET  /api/workflows     → WorkflowController (lokal)
POST /api/workflows     → WorkflowController (lokal)
```

---

## 🔴 Aktuelles Problem

### Symptome
1. **Request kommt an:** Route wird gematcht (`POST /api/auth/login`)
2. **Proxy wird aufgerufen:** Middleware-Funktion wird ausgeführt
3. **Proxy leitet NICHT weiter:** `onProxyReq` wird **NICHT** aufgerufen
4. **Timeout:** Request endet mit `504 Gateway Timeout` oder `Failed to fetch`

### Fehlerdetails
```
Request URL: http://localhost:5000/api/auth/login
Status: Failed to fetch
Mögliche Gründe: CORS, Network Failure
```

### Logs zeigen:
```
✅ Route matched: "Login route matched - calling proxy"
❌ KEIN "Proxying to auth service (public)" Log
❌ KEIN "Request completed" Log
❌ KEIN Error-Log
```

### Konfiguration

#### Service-URL (Docker)
```typescript
authUrl: "http://auth-service:80"  // ✅ Korrekt für Docker
```

#### Proxy-Konfiguration
```typescript
const publicAuthProxy = createProxyMiddleware({
  target: authServiceUrl,           // "http://auth-service:80"
  changeOrigin: true,
  timeout: 30000,
  logLevel: 'debug',
  secure: false,
  ws: false,
  onProxyReq: (proxyReq, req, res) => {
    // ❌ Wird NICHT aufgerufen
    logger.info({ ... }, 'Proxying to auth service (public)');
  },
  onError: (err, req, res) => {
    // ❌ Wird NICHT aufgerufen
    logger.error({ ... }, 'Auth service error');
  },
  router: (req) => {
    // ✅ Wird aufgerufen (Debug-Log fehlt, aber sollte funktionieren)
    return authServiceUrl;
  },
});
```

#### Route-Registrierung
```typescript
app.post('/api/auth/login', (req, res, next) => {
  logger.info({ ... }, 'Login route matched - calling proxy');
  publicAuthProxy(req, res, next);  // ✅ Wird aufgerufen
});
```

---

## 🔍 Debugging-Versuche

### ✅ Was funktioniert:
1. **Service-URL-Erkennung:** Korrekt (`http://auth-service:80` in Docker)
2. **Route-Matching:** Route wird korrekt gematcht
3. **Middleware-Aufruf:** Proxy-Middleware wird aufgerufen
4. **Auth-Service erreichbar:** `wget http://auth-service:80` funktioniert (404, aber Service antwortet)

### ❌ Was NICHT funktioniert:
1. **Proxy-Forwarding:** `onProxyReq` wird nicht aufgerufen
2. **Request-Forwarding:** Request wird nicht an Auth-Service weitergeleitet
3. **Error-Handling:** Keine Error-Logs, obwohl Request fehlschlägt

### 🔧 Bereits durchgeführte Fixes:
1. ✅ CORS erweitert (alle Origins in Development)
2. ✅ `app.use` → `app.post` geändert (explizite Methoden)
3. ✅ `pathRewrite` entfernt (vereinfacht)
4. ✅ `router` Funktion hinzugefügt (explizite URL-Erzwingung)
5. ✅ IPv4 explizit (`127.0.0.1` lokal, `auth-service:80` Docker)
6. ✅ Logging hinzugefügt (Route-Matching, Proxy-Aufruf)

---

## 🤔 Mögliche Ursachen

### 1. **http-proxy-middleware Konfiguration**
- `createProxyMiddleware` gibt eine Middleware-Funktion zurück
- Diese wird aufgerufen, aber leitet nicht weiter
- Mögliche Ursache: Falsche Middleware-Registrierung oder fehlende Optionen

### 2. **Express Middleware-Pipeline**
- Request kommt an, wird gematcht, aber Proxy-Middleware verarbeitet nicht
- Mögliche Ursache: Middleware-Pipeline-Problem oder Request-Stream bereits verarbeitet

### 3. **Docker Networking**
- Service-URL ist korrekt (`http://auth-service:80`)
- Service ist erreichbar (wget funktioniert)
- Mögliche Ursache: Proxy kann trotzdem nicht verbinden (Timeout, DNS, etc.)

### 4. **Request-Body-Streaming**
- `express.json()` parsed Body bereits
- Proxy-Middleware erwartet möglicherweise ungeparsten Stream
- Mögliche Ursache: Body bereits gelesen, Proxy kann nicht weiterleiten

---

## 📝 Code-Snippets

### Aktuelle Proxy-Konfiguration
```typescript
// packages/api-service/src/routes/index.ts

const publicAuthProxy = createProxyMiddleware({
  target: authServiceUrl,  // "http://auth-service:80"
  changeOrigin: true,
  timeout: 30000,
  logLevel: 'debug',
  secure: false,
  ws: false,
  onProxyReq: (proxyReq: IncomingMessage, req: Request, res: ServerResponse) => {
    const requestId = (req as any).requestId;
    logger.info({ 
      requestId, 
      target: authServiceUrl,
      path: req.path, 
      method: req.method,
      originalUrl: req.originalUrl,
      url: req.url,
      proxyReqUrl: proxyReq.url,
    }, 'Proxying to auth service (public)');
  },
  router: (req: Request) => {
    logger.debug({ originalUrl: req.originalUrl, target: authServiceUrl }, 'Proxy router called');
    return authServiceUrl;
  },
  onError: (err: Error, req: Request, res: Response) => {
    const requestId = (req as any).requestId;
    logger.error({ 
      err, 
      requestId, 
      path: req.path, 
      target: authServiceUrl,
      message: err.message,
      stack: err.stack 
    }, 'Auth service error (public)');
    if (!res.headersSent) {
      res.status(503).json({ 
        success: false, 
        error: 'Auth service unavailable',
        requestId,
        details: err.message,
      });
    }
  },
  onProxyError: (err: Error, req: Request, res: Response) => {
    const requestId = (req as any).requestId;
    logger.error({ 
      err, 
      requestId, 
      path: req.path, 
      target: authServiceUrl,
      message: err.message,
      stack: err.stack,
    }, 'Proxy error (public)');
  },
} as any);

// Route-Registrierung
app.post('/api/auth/login', (req, res, next) => {
  logger.info({ path: req.path, method: req.method, originalUrl: req.originalUrl, url: req.url }, 'Login route matched - calling proxy');
  publicAuthProxy(req, res, next);
});
```

### Middleware-Pipeline (index.ts)
```typescript
// packages/api-service/src/index.ts

app.use(securityHeaders);
app.use(requestIdMiddleware);
app.use(express.json({ limit: '10mb' }));  // ⚠️ Body wird hier geparst
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({ origin: true, credentials: true }));  // ✅ Alle Origins erlaubt
app.use(securityAuditMiddleware);
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use(requestLogger);
// ... Routes werden hier registriert
setupRoutes(app, serviceContainer);
```

---

## 🎯 Fragen für Senior

1. **Warum wird `onProxyReq` nicht aufgerufen, obwohl die Middleware-Funktion aufgerufen wird?**
   - Middleware wird aufgerufen (`publicAuthProxy(req, res, next)`)
   - Aber `onProxyReq` Callback wird nie ausgeführt
   - Keine Error-Logs, kein Timeout-Log

2. **Kann `express.json()` das Body-Streaming für den Proxy blockieren?**
   - Body wird bereits in `index.ts` geparst
   - Proxy-Middleware erwartet möglicherweise ungeparsten Stream
   - Sollte `express.json()` nach dem Proxy oder anders konfiguriert werden?

3. **Ist die Middleware-Registrierung korrekt?**
   - Aktuell: `app.post('/api/auth/login', (req, res, next) => { publicAuthProxy(req, res, next); });`
   - Alternative: `app.post('/api/auth/login', publicAuthProxy);`
   - Welche Variante ist korrekt?

4. **Gibt es bekannte Probleme mit `http-proxy-middleware` und Express Body-Parsing?**
   - Request-Body wird bereits geparst
   - Proxy kann möglicherweise nicht auf den originalen Stream zugreifen
   - Lösung: Body-Parsing deaktivieren für Proxy-Routes?

5. **Docker Networking: Könnte es ein Problem mit der Service-URL geben?**
   - Service ist erreichbar (`wget http://auth-service:80` funktioniert)
   - Aber Proxy kann möglicherweise nicht verbinden
   - Sollte `changeOrigin: true` anders konfiguriert werden?

---

## 📦 Dependencies

```json
{
  "http-proxy-middleware": "^2.0.6",
  "express": "^4.18.2",
  "cors": "^2.8.5"
}
```

---

## 🔗 Relevante Dateien

- `packages/api-service/src/index.ts` - Middleware-Pipeline
- `packages/api-service/src/routes/index.ts` - Gateway-Routes & Proxy-Konfiguration
- `packages/api-service/src/config/index.ts` - Service-URL-Konfiguration
- `docker-compose.yml` - Docker-Service-Konfiguration

---

## 📊 Test-Commands

```bash
# Test Auth-Service direkt (funktioniert)
docker exec monshyflow-api-service wget -O- --timeout=5 http://auth-service:80/api/health

# Test über Gateway (funktioniert NICHT)
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "admin@acme.com", "password": "admin123"}'

# Logs prüfen
docker-compose logs api-service --tail 50
```

---

**Erstellt:** 2025-12-09  
**Status:** 🔴 Blockiert - Proxy leitet Requests nicht weiter  
**Priorität:** Hoch - Login-Endpoint funktioniert nicht

