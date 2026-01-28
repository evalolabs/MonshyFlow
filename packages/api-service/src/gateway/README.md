# 🌐 Gateway - Integrated in API Service

## 📋 Overview

The **Gateway is fully integrated** in the API Service and uses **http-proxy-middleware** (free) instead of expensive solutions like Kong.

---

## ✅ Why Integrated?

1. **Cost Savings** - No separate container needed
2. **Performance** - No additional network hop
3. **Simplicity** - One less service to deploy
4. **Free** - http-proxy-middleware instead of Kong (~$100+/month)

---

## 🔄 Gateway Functions

### 1. Request Routing

The Gateway routes requests to the corresponding services:

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

- ✅ **Rate Limiting** - Protection against DDoS
- ✅ **Security Headers** - Helmet
- ✅ **CORS** - Configured
- ✅ **Request Logging** - Structured logging

### 3. Error Handling

- ✅ **Service Unavailable** - When backend service is unreachable
- ✅ **Timeout Handling** - Automatic timeouts
- ✅ **Error Logging** - Errors are logged

---

## 📍 Routing Table

| Route | Target Service | Description |
|-------|---------------|-------------|
| `/api/workflows` | API Service (local) | Workflow CRUD |
| `/api/auth` | Auth Service | Authentication |
| `/api/apikeys` | Auth Service | API Key Management |
| `/api/secrets` | Secrets Service | Secrets Management |
| `/api/execute` | Execution Service | Workflow Execution |
| `/api/execution` | Execution Service | Execution History |
| `/api/scheduler` | Scheduler Service | Workflow Scheduling |
| `/api/webhook` | API Service (local) | Webhook Endpoints |

---

## 🔧 Configuration

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
# Local
AUTH_SERVICE_URL=http://localhost:5002
SECRETS_SERVICE_URL=http://localhost:5003
EXECUTION_SERVICE_URL=http://localhost:5004
SCHEDULER_SERVICE_URL=http://localhost:5005

# Azure (automatically via Service Discovery)
# Container Apps recognizes internal names: auth-service:80
```

---

## 💰 Cost Comparison

### Kong (External Gateway)
- **Cost:** ~$100-500/month
- **Features:** Many, but not all needed
- **Complexity:** High

### http-proxy-middleware (Current)
- **Cost:** $0 (free)
- **Features:** Everything we need
- **Complexity:** Low

**Savings: ~$100-500/month** 💰

---

## 🚀 Advantages

1. **Free** - No additional gateway costs
2. **Simple** - Standard Express middleware
3. **Flexible** - Easy to extend
4. **Performance** - Directly in API Service, no additional hop
5. **Maintainable** - TypeScript, clear structure

---

## 📝 Extensions

### Adding a New Route

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

## ✅ Conclusion

The Gateway is **fully functional**, **free**, and **production-ready**. It provides all the features we need without the costs of external gateway solutions like Kong.

**Status:** ✅ Production Ready
