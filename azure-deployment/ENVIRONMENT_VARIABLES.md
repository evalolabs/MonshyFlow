# Azure Container Apps - Environment Variables

Diese Dokumentation listet alle Environment Variables auf, die für das Deployment in Azure Container Apps benötigt werden.

---

## 📋 Übersicht

### Services
1. **api-service** - API Gateway & Workflow Management
2. **auth-service** - Authentifizierung & Authorization
3. **secrets-service** - Secrets Management
4. **execution-service** - Workflow Execution Service
5. **scheduler-service** - Workflow Scheduling
6. **frontend** - React Frontend (Static Web App)

---

## 🔧 API Service Environment Variables

**Container App Name:** `api-service`

```bash
# Port
PORT=80

# MongoDB / Cosmos DB
MONGODB_URL=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/MonshyFlow?ssl=true&replicaSet=globaldb&authSource=admin

# Redis Cache
REDIS_URL=rediss://:<key>@<cache-name>.redis.cache.windows.net:6380

# JWT Settings
JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)
JWT_ISSUER=monshy-auth-service
JWT_AUDIENCE=monshy-services

# Service URLs (internal Container App names)
AUTH_SERVICE_URL=http://auth-service:80
SECRETS_SERVICE_URL=http://secrets-service:80
EXECUTION_SERVICE_URL=http://execution-service:5004
SCHEDULER_SERVICE_URL=http://scheduler-service:80

# Internal Service Key (für Service-to-Service Kommunikation)
INTERNAL_SERVICE_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/InternalServiceKey/)

# Frontend URL (für CORS)
FRONTEND_URL=https://your-frontend.azurestaticapps.net

# Node Environment
NODE_ENV=production
```

---

## 🔐 Auth Service Environment Variables

**Container App Name:** `auth-service`

```bash
# Port
PORT=80

# MongoDB / Cosmos DB
MONGODB_URL=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/MonshyFlow?ssl=true&replicaSet=globaldb&authSource=admin

# JWT Settings
JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)
JWT_ISSUER=monshy-auth-service
JWT_AUDIENCE=monshy-services

# Node Environment
NODE_ENV=production
```

---

## 🔒 Secrets Service Environment Variables

**Container App Name:** `secrets-service`

```bash
# Port
PORT=80

# MongoDB / Cosmos DB
MONGODB_URL=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/MonshyFlow?ssl=true&replicaSet=globaldb&authSource=admin

# JWT Settings
JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)
JWT_ISSUER=monshy-auth-service
JWT_AUDIENCE=monshy-services

# Encryption
SECRETS_ENCRYPTION_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/EncryptionKey/)
# oder
ENCRYPTION_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/EncryptionKey/)

# Internal Service Key
INTERNAL_SERVICE_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/InternalServiceKey/)

# Auth Service URL (für Token-Validierung)
AUTH_SERVICE_URL=http://auth-service:80

# Node Environment
NODE_ENV=production
```

---

## 🌐 API Service Environment Variables (zusätzlich)

**Container App Name:** `api-service`

```bash
# Frontend URL (für CORS)
FRONTEND_URL=https://your-frontend.azurestaticapps.net

# Service URLs (interne Container App Namen)
AUTH_SERVICE_URL=http://auth-service:80
SECRETS_SERVICE_URL=http://secrets-service:80
EXECUTION_SERVICE_URL=http://execution-service:5004
SCHEDULER_SERVICE_URL=http://scheduler-service:80

# Internal Service Key (für Service-to-Service Kommunikation)
INTERNAL_SERVICE_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/InternalServiceKey/)
```

---

## ⚙️ Execution-Service Environment Variables

**Container App Name:** `execution-service`

```bash
# Node Environment
NODE_ENV=production
PORT=5004

# MongoDB / Cosmos DB
MONGODB_URL=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/agent-builder?ssl=true&replicaSet=globaldb

# Redis Cache
REDIS_URL=rediss://:<key>@<cache-name>.redis.cache.windows.net:6380

# RabbitMQ (OPTIONAL - aktuell nicht verwendet, Code unterstützt Fallback)
# Nur setzen, wenn RabbitMQ benötigt wird (später)
# RABBITMQ_URL=amqps://<user>:<pass>@<namespace>.servicebus.windows.net:5671
# Oder RabbitMQ auf VM:
# RABBITMQ_URL=amqp://admin:admin123@<vm-ip>:5672
# 
# HINWEIS: Wenn nicht gesetzt, verwendet execution-service in-memory queue (keine Persistenz)
# Für Production später: Azure Service Bus oder RabbitMQ auf VM

# OpenAI
OPENAI_API_KEY=<openai-api-key>

# Agent Service URL (internal Container App name)
AGENT_SERVICE_URL=http://agentservice:80
```

---

## 🎨 Frontend Environment Variables

**Static Web App Configuration** (in Azure Portal oder `staticwebapp.config.json`)

```bash
# API Gateway URL
VITE_API_URL=https://your-api-service.azurecontainerapps.io

# Execution Service URL (optional, falls direkt genutzt)
VITE_EXECUTION_API_URL=https://your-execution-service.azurecontainerapps.io
```

**Hinweis:** Frontend Environment Variables müssen zur Build-Zeit gesetzt werden, da Vite sie zur Build-Zeit einbindet.

---

## 📝 Environment Variable Naming Convention

### Node.js Services
- Format: `UPPER_SNAKE_CASE`
- Beispiel: `MONGODB_URL`, `JWT_SECRET_KEY`, `REDIS_URL`
- Werden über `process.env` geladen
- Alle Services verwenden dieses Format

### Frontend (Vite)
- Format: `VITE_*` (muss mit VITE_ beginnen)
- Beispiel: `VITE_API_URL`
- Werden zur Build-Zeit eingebunden

---

## 🔄 Azure Container Apps Environment Variables Setzen

### Über Azure Portal
1. Container App → Configuration → Environment Variables
2. Add → Name und Value eingeben
3. Save

### Über Azure CLI
```bash
az containerapp update \
  --name agentservice \
  --resource-group monshy-rg \
  --set-env-vars "MongoDbSettings__ConnectionString=..." \
                 "RedisSettings__ConnectionString=..."
```

### Über ARM/Bicep Template
```json
{
  "properties": {
    "template": {
      "containers": [{
        "env": [
          {
            "name": "MongoDbSettings__ConnectionString",
            "value": "..."
          }
        ]
      }]
    }
  }
}
```

---

## 🔐 Secrets Management

### Option 1: Azure Key Vault (Empfohlen)
```bash
# Secrets in Key Vault speichern
az keyvault secret set --vault-name monshy-kv --name JwtSecretKey --value "..."

# In Container Apps referenzieren
az containerapp update \
  --name agentservice \
  --resource-group monshy-rg \
  --set-env-vars "JwtSettings__SecretKey=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)"
```

### Option 2: Container Apps Secrets
```bash
# Secret erstellen
az containerapp secret set \
  --name agentservice \
  --resource-group monshy-rg \
  --secrets jwt-secret-key="..."

# In Environment Variable referenzieren
az containerapp update \
  --name agentservice \
  --resource-group monshy-rg \
  --set-env-vars "JwtSettings__SecretKey=secretref:jwt-secret-key"
```

---

## ✅ Checkliste vor Deployment

- [ ] Alle Connection Strings gesammelt (Cosmos DB, Redis)
- [ ] RabbitMQ optional (nur wenn benötigt)
- [ ] JWT Secret Key generiert (min. 32 Zeichen)
- [ ] Encryption Key generiert (min. 32 Zeichen)
- [ ] Service Keys generiert
- [ ] API Keys bereit (OpenAI, Serper, etc.)
- [ ] Frontend URLs bekannt
- [ ] Container App Namen definiert
- [ ] Secrets in Key Vault oder Container Apps Secrets gespeichert

---

## 📚 Weitere Ressourcen

- [Azure Container Apps Documentation](https://docs.microsoft.com/azure/container-apps/)
- [Environment Variables in Container Apps](https://docs.microsoft.com/azure/container-apps/environment-variables)
- [Azure Key Vault Integration](https://docs.microsoft.com/azure/container-apps/manage-secrets)

