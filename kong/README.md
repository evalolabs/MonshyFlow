# 🌐 Kong OSS Gateway - Dokumentation

## 📋 Übersicht

Kong OSS (Open Source) ist das API Gateway für MonshyFlow. Es routet alle API-Requests zu den entsprechenden Microservices.

## 🏗️ Architektur

```
Frontend/Postman
    ↓
Kong Gateway (Port 8000)
    ↓
┌─── API Service (Port 80)      → /api/workflows
├─── Auth Service (Port 80)     → /api/auth, /api/apikeys
├─── Secrets Service (Port 80)  → /api/secrets
├─── Execution Service (Port 5004) → /api/execute, /api/execution
└─── Scheduler Service (Port 80) → /api/scheduler
```

## 🚀 Quick Start

### Kong starten

```bash
# Kong mit allen Services starten
docker-compose up -d kong

# Kong Logs anzeigen
docker-compose logs -f kong
```

### Kong Status prüfen

```bash
# Kong Admin API Status
curl http://localhost:8001/

# Services auflisten
curl http://localhost:8001/services

# Routes auflisten
curl http://localhost:8001/routes
```

### Port-Konfiguration

- **Proxy Port:** `5000` (extern) → `8000` (intern im Container)
  - Für ngrok Kompatibilität: Kong läuft extern auf Port 5000
  - ngrok kann auf Port 5000 forwarden: `ngrok http 5000`
- **Admin API:** `8001` (unverändert)

## 📝 Konfiguration

### Kongfile (`kong/kong.yml`)

Die Kong-Konfiguration ist deklarativ in `kong/kong.yml` definiert (DB-less mode).

**Services:** Backend-Services, die Kong routet
**Routes:** URL-Pfade und HTTP-Methoden
**Plugins:** CORS, Rate Limiting, Request ID, etc.

### Services

| Service | URL | Routes |
|---------|-----|--------|
| `api-service` | `http://api-service:80` | `/api/workflows`, `/health` |
| `auth-service` | `http://auth-service:80` | `/api/auth/*`, `/api/apikeys/*` |
| `secrets-service` | `http://secrets-service:80` | `/api/secrets/*` |
| `execution-service` | `http://execution-service:5004` | `/api/execute/*`, `/api/execution/*` |
| `scheduler-service` | `http://scheduler-service:80` | `/api/scheduler/*` |

## 🔌 Plugins

### CORS Plugin (Global)
- Erlaubt alle Origins in Development
- Unterstützt Credentials
- Max Age: 3600 Sekunden

### Rate Limiting
- **Öffentliche Auth Routes:** 5 Requests/Minute, 50/Hour
- **API Routes:** 100 Requests/Minute, 1000/Hour

### Correlation ID
- Fügt `X-Request-ID` Header hinzu
- Für Request-Tracing über Services

### File Log
- Loggt alle Requests nach `/dev/stdout`
- Für Docker Logs sichtbar

## 🔐 Authentication

**Öffentliche Routes (keine Auth):**
- `POST /api/auth/login`
- `POST /api/auth/register`

**Geschützte Routes (JWT erforderlich):**
- Alle anderen `/api/*` Routes
- JWT Token muss im `Authorization: Bearer <token>` Header sein

> **HINWEIS:** JWT-Plugin wird noch hinzugefügt für geschützte Routes.

## 🧪 Testing

### Login testen

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@acme.com",
    "password": "admin123"
  }'
```

### Workflow Routes testen

```bash
# Token aus Login-Response verwenden
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:5000/api/workflows \
  -H "Authorization: Bearer $TOKEN"
```

### ngrok Integration

Kong läuft auf Port 5000, daher kann ngrok direkt darauf forwarden:

```bash
# ngrok starten
ngrok http 5000

# Dann sind alle Routes über ngrok erreichbar:
# https://your-ngrok-url.ngrok-free.dev/api/auth/login
```

## 🔧 Admin API

Kong Admin API ist auf Port 8001 verfügbar:

```bash
# Services auflisten
curl http://localhost:8001/services

# Routes auflisten
curl http://localhost:8001/routes

# Plugins auflisten
curl http://localhost:8001/plugins

# Service hinzufügen (wenn nicht DB-less)
curl -X POST http://localhost:8001/services \
  -d "name=my-service" \
  -d "url=http://my-service:80"
```

## 📊 Monitoring

### Kong Logs

```bash
# Alle Logs
docker-compose logs kong

# Live Logs
docker-compose logs -f kong

# Nur Errors
docker-compose logs kong | grep ERROR
```

### Kong Status

```bash
# Health Check
curl http://localhost:8001/status

# Node Info
curl http://localhost:8001/
```

## 🐛 Troubleshooting

### Kong startet nicht

```bash
# Prüfe Kongfile Syntax
docker run --rm -v $(pwd)/kong/kong.yml:/kong/kong.yml:ro kong:3.9 kong config -c /kong/kong.yml

# Prüfe Kong Logs
docker-compose logs kong
```

### Routes funktionieren nicht

```bash
# Prüfe ob Services erreichbar sind
docker exec monshyflow-kong wget -O- http://auth-service:80/health

# Prüfe Kong Routes
curl http://localhost:8001/routes

# Teste Route direkt
curl -v http://localhost:8000/api/auth/login
```

### CORS Probleme

```bash
# Prüfe CORS Plugin Konfiguration
curl http://localhost:8001/plugins | jq '.data[] | select(.name=="cors")'
```

## 📚 Weitere Ressourcen

- [Kong OSS Dokumentation](https://docs.konghq.com/gateway/)
- [Kongfile Format](https://docs.konghq.com/gateway/latest/reference/configuration/)
- [Kong Plugins](https://docs.konghq.com/hub/)

## 🔄 Migration von http-proxy-middleware

Die Gateway-Funktionalität wurde von `http-proxy-middleware` (integriert im API Service) zu Kong OSS migriert:

**Vorher:**
- Gateway im API Service (Port 5000)
- http-proxy-middleware für Routing

**Nachher:**
- Kong Gateway (Port 8000)
- API Service nur noch für Workflow-Routes (Port 80 intern)
- Alle anderen Routes über Kong

**Vorteile:**
- ✅ Professionelles API Gateway
- ✅ Viele Plugins verfügbar
- ✅ Bessere Observability
- ✅ Einfache Skalierung
- ✅ Open Source (kostenlos)

