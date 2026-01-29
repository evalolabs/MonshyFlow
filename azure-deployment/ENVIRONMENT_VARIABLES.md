# Azure Container Apps - Environment Variables

This document lists all environment variables required for deploying MonshyFlow to Azure Container Apps.

---

## 📋 Overview

### Services
1. **api-service** - API gateway & workflow management
2. **auth-service** - Authentication & authorization
3. **secrets-service** - Secrets management
4. **execution-service** - Workflow execution service
5. **scheduler-service** - Workflow scheduling
6. **frontend** - React frontend (Static Web App)

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

# Internal service key (for service-to-service communication)
INTERNAL_SERVICE_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/InternalServiceKey/)

# Frontend URL (for CORS)
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
# or
ENCRYPTION_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/EncryptionKey/)

# Internal Service Key
INTERNAL_SERVICE_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/InternalServiceKey/)

# Auth service URL (for token validation)
AUTH_SERVICE_URL=http://auth-service:80

# Node Environment
NODE_ENV=production
```

---

## 🌐 API Service Environment Variables (additional)

**Container App Name:** `api-service`

```bash
# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend.azurestaticapps.net

# Service URLs (internal Container App names)
AUTH_SERVICE_URL=http://auth-service:80
SECRETS_SERVICE_URL=http://secrets-service:80
EXECUTION_SERVICE_URL=http://execution-service:5004
SCHEDULER_SERVICE_URL=http://scheduler-service:80

# Internal service key (for service-to-service communication)
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

# RabbitMQ (OPTIONAL - currently not used, code supports fallback)
# Set only if RabbitMQ is needed (future use)
# RABBITMQ_URL=amqps://<user>:<pass>@<namespace>.servicebus.windows.net:5671
# Or RabbitMQ on VM:
# RABBITMQ_URL=amqp://admin:admin123@<vm-ip>:5672
# 
# NOTE: If not set, execution-service uses an in-memory queue (no persistence)
# For production later: Azure Service Bus or RabbitMQ on a VM

# OpenAI
OPENAI_API_KEY=<openai-api-key>

# Agent Service URL (internal Container App name)
AGENT_SERVICE_URL=http://agentservice:80
```

---

## 🎨 Frontend Environment Variables

**Static Web App configuration** (in Azure Portal or `staticwebapp.config.json`)

```bash
# API gateway URL
VITE_API_URL=https://your-api-service.azurecontainerapps.io

# Execution service URL (optional, if used directly)
VITE_EXECUTION_API_URL=https://your-execution-service.azurecontainerapps.io
```

**Note:** Frontend Environment Variables must be set at build time, as Vite injects them at build time.

---

## 📝 Environment Variable Naming Convention

### Node.js services
- Format: `UPPER_SNAKE_CASE`
- Example: `MONGODB_URL`, `JWT_SECRET_KEY`, `REDIS_URL`
- Loaded via `process.env`
- All services use this format

### Frontend (Vite)
- Format: `VITE_*` (must start with `VITE_`)
- Example: `VITE_API_URL`
- Injected at build time

---

## 🔄 Setting Azure Container Apps environment variables

### Via Azure Portal
1. Container App → Configuration → Environment Variables
2. Add → enter name & value
3. Save

### Via Azure CLI
```bash
az containerapp update \
  --name api-service \
  --resource-group monshy-rg \
  --set-env-vars "MONGODB_URL=..." \
                 "REDIS_URL=..."
```

### Via ARM/Bicep template
```json
{
  "properties": {
    "template": {
      "containers": [{
        "env": [
          {
            "name": "MONGODB_URL",
            "value": "..."
          }
        ]
      }]
    }
  }
}
```

---

## 🔐 Secrets management

### Option 1: Azure Key Vault (recommended)
```bash
# Store secrets in Key Vault
az keyvault secret set --vault-name monshy-kv --name JwtSecretKey --value "..."

# Reference in Container Apps
az containerapp update \
  --name api-service \
  --resource-group monshy-rg \
  --set-env-vars "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)"
```

### Option 2: Container Apps secrets
```bash
# Create secret
az containerapp secret set \
  --name api-service \
  --resource-group monshy-rg \
  --secrets jwt-secret-key="..."

# Reference in environment variable
az containerapp update \
  --name api-service \
  --resource-group monshy-rg \
  --set-env-vars "JWT_SECRET_KEY=secretref:jwt-secret-key"
```

---

## ✅ Pre-deployment checklist

- [ ] All connection strings collected (Cosmos DB, Redis)
- [ ] RabbitMQ considered (optional, only if needed)
- [ ] JWT secret key generated (min. 32 characters)
- [ ] Encryption key generated (min. 32 characters)
- [ ] Service keys generated
- [ ] API keys available (OpenAI, Serper, etc.)
- [ ] Frontend URLs known
- [ ] Container App names defined
- [ ] Secrets stored in Key Vault or Container Apps secrets

---

## 📚 Further resources

- [Azure Container Apps documentation](https://docs.microsoft.com/azure/container-apps/)
- [Environment variables in Container Apps](https://docs.microsoft.com/azure/container-apps/environment-variables)
- [Azure Key Vault integration](https://docs.microsoft.com/azure/container-apps/manage-secrets)

