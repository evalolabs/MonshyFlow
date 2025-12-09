# Azure Container Apps - Environment Variables

Diese Dokumentation listet alle Environment Variables auf, die für das Deployment in Azure Container Apps benötigt werden.

---

## 📋 Übersicht

### Services
1. **agentservice** - Hauptservice für Workflows
2. **authservice** - Authentifizierung & Authorization
3. **secretsservice** - Secrets Management
4. **gateway** - API Gateway (Ocelot)
5. **execution-service** - TypeScript Execution Service
6. **frontend** - React Frontend (Static Web App)

---

## 🔧 AgentService Environment Variables

**Container App Name:** `agentservice`

```bash
# MongoDB / Cosmos DB
MongoDbSettings__ConnectionString=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb
MongoDbSettings__DatabaseName=agentbuilder
MongoDbSettings__WorkflowsCollectionName=workflows

# Redis Cache
RedisSettings__ConnectionString=<cache-name>.redis.cache.windows.net:6380,password=<key>,ssl=True

# JWT Settings
JwtSettings__SecretKey=<your-jwt-secret-key-min-32-chars>
JwtSettings__Issuer=AgentBuilder.AuthService
JwtSettings__Audience=AgentBuilder.Services

# Execution Service URL (internal Container App name)
ExecutionService__Url=http://execution-service:80

# Secrets Service URL (internal Container App name)
SecretsService__BaseUrl=http://secretsservice:80
SecretsService__ServiceKey=<internal-service-key>

# API Keys
OpenAI__ApiKey=<openai-api-key>
SerperApi__ApiKey=<serper-api-key>

# File Storage (optional - für Azure Blob Storage später)
FileStorage__UploadPath=uploads
```

---

## 🔐 AuthService Environment Variables

**Container App Name:** `authservice`

```bash
# MongoDB / Cosmos DB
MongoDbSettings__ConnectionString=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb
MongoDbSettings__DatabaseName=agentbuilder

# JWT Settings
JwtSettings__SecretKey=<your-jwt-secret-key-min-32-chars>
JwtSettings__Issuer=AgentBuilder.AuthService
JwtSettings__Audience=AgentBuilder.Services
JwtSettings__ExpirationMinutes=60
```

---

## 🔒 SecretsService Environment Variables

**Container App Name:** `secretsservice`

```bash
# MongoDB / Cosmos DB
MongoDbSettings__ConnectionString=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb
MongoDbSettings__DatabaseName=agentbuilder

# JWT Settings
JwtSettings__SecretKey=<your-jwt-secret-key-min-32-chars>
JwtSettings__Issuer=AgentBuilder.AuthService
JwtSettings__Audience=AgentBuilder.Services
JwtSettings__ExpirationMinutes=60

# Encryption
EncryptionSettings__EncryptionKey=<your-encryption-key-min-32-chars>

# Internal Service Key
InternalService__ServiceKey=<internal-service-key>
```

---

## 🌐 Gateway Environment Variables

**Container App Name:** `gateway`

```bash
# Ocelot Configuration File
OCELOT_CONFIG_FILE=ocelot.Azure.json

# Frontend URL (für CORS)
FRONTEND_URL=https://your-frontend.azurestaticapps.net

# Base URL (wird in ocelot.Azure.json verwendet)
ASPNETCORE_URLS=http://+:80
```

---

## ⚙️ Execution-Service Environment Variables

**Container App Name:** `execution-service`

```bash
# Node Environment
NODE_ENV=production
PORT=5002

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
VITE_API_URL=https://your-gateway.azurecontainerapps.io

# Execution Service URL (optional, falls direkt genutzt)
VITE_EXECUTION_API_URL=https://your-execution-service.azurecontainerapps.io
```

**Hinweis:** Frontend Environment Variables müssen zur Build-Zeit gesetzt werden, da Vite sie zur Build-Zeit einbindet.

---

## 📝 Environment Variable Naming Convention

### .NET Services (appsettings.json)
- Format: `Section__Key` (doppelte Unterstriche)
- Beispiel: `MongoDbSettings__ConnectionString`
- .NET lädt diese automatisch in die Configuration

### Node.js Services
- Format: `UPPER_SNAKE_CASE`
- Beispiel: `MONGODB_URL`
- Werden über `process.env` geladen

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

