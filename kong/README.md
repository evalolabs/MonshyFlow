# 🌐 Kong OSS Gateway

## 📋 Overview

Kong OSS (Open Source) is the API gateway for MonshyFlow. It routes all API requests to the corresponding microservices.

## 🏗️ Architecture

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

# 🚀 Quick Start

### Start Kong

```bash
# Start Kong with all services
docker-compose up -d kong

# Show Kong logs
docker-compose logs -f kong
```

### Check Kong status

```bash
# Kong Admin API status
curl http://localhost:8001/

# List services
curl http://localhost:8001/services

# List routes
curl http://localhost:8001/routes
```

### Port configuration

- **Proxy port:** `5000` (external) → `8000` (internal in the container)
  - For ngrok compatibility: Kong listens externally on port 5000
  - ngrok can forward to port 5000: `ngrok http 5000`
- **Admin API:** `8001`

## 📝 Configuration

### Kongfile (`kong/kong.yml`)

The Kong configuration is defined declaratively in `kong/kong.yml` (DB-less mode).

- **Services:** backend services that Kong routes to
- **Routes:** URL paths and HTTP methods
- **Plugins:** CORS, rate limiting, request ID, etc.

### Services

| Service | URL | Routes |
|---------|-----|--------|
| `api-service` | `http://api-service:80` | `/api/workflows/*`, `/api/admin/*`, `/api/webhooks/*`, `/api/tenants/*`, `/api/audit-logs/*`, `/api/support-consents/*`, `/api/internal/*`, `/health` |
| `auth-service` | `http://auth-service:80` | `/api/auth/*`, `/api/apikeys/*` |
| `secrets-service` | `http://secrets-service:80` | `/api/secrets/*` |
| `execution-service` | `http://execution-service:5004` | `/api/execute/*`, `/api/execution/*`, `/api/schemas/*`, `/api/events/*`, `/api/functions`, `/api/mcp-handlers`, `/api/web-search-handlers`, `/api/node-processors`, `/api/tool-creators`, `/api/openai/*` |
| `scheduler-service` | `http://scheduler-service:80` | `/api/scheduler/*` |

# 🔌 Plugins

### CORS plugin (global)
- Allows all origins in development
- Supports credentials
- Max age: 3600 seconds

### Rate limiting
- **Public auth routes:** 1000 requests/minute, 10000/hour (increased for E2E tests)
- **API routes:** 1000 requests/minute, 10000/hour (increased for E2E tests)
- **Secrets service:** 5000 requests/minute, 50000/hour (very high for E2E tests)

**Note:** Current limits are increased for E2E tests and development. For production they should be reduced (see `RATE_LIMITING.md`).

### Correlation ID
- Adds `X-Request-ID` header
- For request tracing across services

### File log
- Logs all requests to `/dev/stdout`
- Visible via Docker logs

## 🔐 Authentication

**Public routes (no auth required):**
- `POST /api/auth/login`
- `POST /api/auth/register`

**Protected routes (JWT required):**
- All other `/api/*` routes
- JWT token must be provided via `Authorization: Bearer <token>` header

> **Note:** A JWT plugin will be added for protected routes.

## 🧪 Testing

### Test login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@acme.com",
    "password": "admin123"
  }'
```

### Test workflow routes

```bash
# Use token from login response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:5000/api/workflows \
  -H "Authorization: Bearer $TOKEN"
```

### ngrok integration

Kong listens on port 5000, so ngrok can forward directly to it:

```bash
# start ngrok
ngrok http 5000

# Then all routes are reachable via ngrok, e.g.:
# https://your-ngrok-url.ngrok-free.dev/api/auth/login
```

## 🔧 Admin API

Kong Admin API is available on port 8001:

```bash
# List services
curl http://localhost:8001/services

# List routes
curl http://localhost:8001/routes

# List plugins
curl http://localhost:8001/plugins

# Add service (if not DB-less)
curl -X POST http://localhost:8001/services \
  -d "name=my-service" \
  -d "url=http://my-service:80"
```

## 📊 Monitoring

### Kong logs

```bash
# All logs
docker-compose logs kong

# Live logs
docker-compose logs -f kong

# Only errors
docker-compose logs kong | grep ERROR
```

### Kong status

```bash
# Health check
curl http://localhost:8001/status

# Node info
curl http://localhost:8001/
```

## 🐛 Troubleshooting

### Kong does not start

```bash
# Check Kongfile syntax
docker run --rm -v $(pwd)/kong/kong.yml:/kong/kong.yml:ro kong:3.9 kong config -c /kong/kong.yml

# Check Kong logs
docker-compose logs kong
```

### Routes do not work

```bash
# Check if services are reachable
docker exec monshyflow-kong wget -O- http://auth-service:80/health

# Check Kong routes
curl http://localhost:8001/routes

# Test route directly
curl -v http://localhost:8000/api/auth/login
```

### CORS issues

```bash
# Check CORS plugin configuration
curl http://localhost:8001/plugins | jq '.data[] | select(.name=="cors")'
```

## 📚 Further resources

- [Kong OSS documentation](https://docs.konghq.com/gateway/)
- [Kongfile format](https://docs.konghq.com/gateway/latest/reference/configuration/)
- [Kong plugins](https://docs.konghq.com/hub/)

## 🔄 Migration from http-proxy-middleware

The gateway functionality was migrated from `http-proxy-middleware` (integrated in the API service) to Kong OSS:

**Before:**
- Gateway inside API service (port 5000)
- `http-proxy-middleware` for routing

**After:**
- Kong gateway (port 5000 external → 8000 internal)
- API service for workflow management (port 80 internal)
- All services reachable via Kong gateway

**Benefits:**
- ✅ Professional API gateway
- ✅ Many plugins available
- ✅ Better observability
- ✅ Easy scaling
- ✅ Open source (no license cost)
