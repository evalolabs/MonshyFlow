# 🚀 Azure Deployment - Node.js Services

Deployment guide for the Node.js services in Azure Container Apps.

---

## 📋 Prerequisites

1. ✅ Azure resources created (see `README.md`)
2. ✅ Azure Container Registry (ACR) available
3. ✅ Container Apps Environment created
4. ✅ Cosmos DB & Redis created
5. ✅ Key Vault created

---

## 🐳 Build Docker images

### Create build script

```bash
# azure-deployment/scripts/build-push-images.sh

#!/bin/bash

ACR_NAME="monshy"
RESOURCE_GROUP="monshy-rg"

# Login to ACR
az acr login --name $ACR_NAME

# Build and push API Service
docker build -t $ACR_NAME.azurecr.io/api-service:latest -f packages/api-service/Dockerfile .
docker push $ACR_NAME.azurecr.io/api-service:latest

# Build and push Auth Service
docker build -t $ACR_NAME.azurecr.io/auth-service:latest -f packages/auth-service/Dockerfile .
docker push $ACR_NAME.azurecr.io/auth-service:latest

# Build and push Secrets Service
docker build -t $ACR_NAME.azurecr.io/secrets-service:latest -f packages/secrets-service/Dockerfile .
docker push $ACR_NAME.azurecr.io/secrets-service:latest

# Build and push Execution Service
docker build -t $ACR_NAME.azurecr.io/execution-service:latest -f packages/execution-service/Dockerfile .
docker push $ACR_NAME.azurecr.io/execution-service:latest

# Build and push Scheduler Service
docker build -t $ACR_NAME.azurecr.io/scheduler-service:latest -f packages/scheduler-service/Dockerfile .
docker push $ACR_NAME.azurecr.io/scheduler-service:latest

echo "✅ All images built and pushed"
```

---

## 🚀 Deploy Container Apps

### API service

```bash
az containerapp create \
  --name api-service \
  --resource-group monshy-rg \
  --environment monshy-env \
  --image monshy.azurecr.io/api-service:latest \
  --target-port 80 \
  --ingress external \
  --registry-server monshy.azurecr.io \
  --env-vars \
    "AUTH_SERVICE_URL=http://auth-service:80" \
    "SECRETS_SERVICE_URL=http://secrets-service:80" \
    "EXECUTION_SERVICE_URL=http://execution-service:80" \
    "SCHEDULER_SERVICE_URL=http://scheduler-service:80" \
    "MONGODB_URL=<cosmos-db-connection-string>" \
    "REDIS_URL=<redis-connection-string>" \
    "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)" \
    "JWT_ISSUER=monshy-auth-service" \
    "JWT_AUDIENCE=monshy-services" \
    "INTERNAL_SERVICE_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/InternalServiceKey/)" \
    "FRONTEND_URL=https://your-frontend.azurestaticapps.net" \
    "PORT=80"
```

### Auth service

```bash
az containerapp create \
  --name auth-service \
  --resource-group monshy-rg \
  --environment monshy-env \
  --image monshy.azurecr.io/auth-service:latest \
  --target-port 80 \
  --ingress internal \
  --registry-server monshy.azurecr.io \
  --env-vars \
    "MONGODB_URL=<cosmos-db-connection-string>" \
    "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)" \
    "JWT_ISSUER=monshy-auth-service" \
    "JWT_AUDIENCE=monshy-services" \
    "PORT=80"
```

### Secrets service

```bash
az containerapp create \
  --name secrets-service \
  --resource-group monshy-rg \
  --environment monshy-env \
  --image monshy.azurecr.io/secrets-service:latest \
  --target-port 80 \
  --ingress internal \
  --registry-server monshy.azurecr.io \
  --env-vars \
    "MONGODB_URL=<cosmos-db-connection-string>" \
    "SECRETS_ENCRYPTION_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/EncryptionKey/)" \
    "INTERNAL_SERVICE_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/InternalServiceKey/)" \
    "AUTH_SERVICE_URL=http://auth-service:80" \
    "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)" \
    "JWT_ISSUER=monshy-auth-service" \
    "JWT_AUDIENCE=monshy-services" \
    "PORT=80"
```

### Execution service

```bash
az containerapp create \
  --name execution-service \
  --resource-group monshy-rg \
  --environment monshy-env \
  --image monshy.azurecr.io/execution-service:latest \
  --target-port 5004 \
  --ingress internal \
  --registry-server monshy.azurecr.io \
  --env-vars \
    "MONGODB_URL=<cosmos-db-connection-string>" \
    "REDIS_URL=<redis-connection-string>" \
    "RABBITMQ_URL=<rabbitmq-url-or-empty>" \
    "SECRETS_SERVICE_URL=http://secrets-service:80" \
    "INTERNAL_SERVICE_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/InternalServiceKey/)" \
    "AGENT_SERVICE_URL=http://api-service:80" \
    "OPENAI_API_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/OpenAIApiKey/)" \
    "PORT=5004" \
    "NODE_ENV=production"
```

### Scheduler service

```bash
az containerapp create \
  --name scheduler-service \
  --resource-group monshy-rg \
  --environment monshy-env \
  --image monshy.azurecr.io/scheduler-service:latest \
  --target-port 80 \
  --ingress internal \
  --registry-server monshy.azurecr.io \
  --env-vars \
    "MONGODB_URL=<cosmos-db-connection-string>" \
    "EXECUTION_SERVICE_URL=http://execution-service:5004" \
    "PORT=80"
```

---

## 🔄 Update existing Container Apps

```bash
# Update single image
az containerapp update \
  --name api-service \
  --resource-group monshy-rg \
  --image monshy.azurecr.io/api-service:latest

# Or update all services
for service in api-service auth-service secrets-service execution-service scheduler-service; do
  az containerapp update \
    --name $service \
    --resource-group monshy-rg \
    --image monshy.azurecr.io/$service:latest
done
```

---

## 📊 Health checks

Each service should expose a `/health` endpoint:

```typescript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'api-service',
    timestamp: new Date().toISOString()
  });
});
```

---

## 🔍 Monitoring

### Show logs

```bash
az containerapp logs show \
  --name api-service \
  --resource-group monshy-rg \
  --follow
```

### Metrics

```bash
az containerapp show \
  --name api-service \
  --resource-group monshy-rg \
  --query "properties.template.scale"
```

---

## ✅ Checklist

- [ ] Docker images built and pushed
- [ ] Container Apps created
- [ ] Environment variables configured
- [ ] Key Vault secrets referenced
- [ ] Health checks working
- [ ] Service discovery working
- [ ] Logs visible
- [ ] Frontend can reach API service

---

## 🐛 Troubleshooting

### Service cannot reach other services

**Problem:** Service discovery is not working

**Solution:**
- Check internal Container App names (they must match exactly)
- Check port (must be 80 in Azure, except `execution-service`: 5004)
- Check ingress (must be `internal` for internal services)
- Check environment variables (service URLs must be correct)

### Database connection error

**Problem:** Cosmos DB connection fails

**Solution:**
- Check connection string format
- Check firewall rules (Cosmos DB must allow Container Apps)
- Check SSL settings (`ssl=true` is required)

### Redis connection error

**Problem:** Redis connection fails

**Solution:**
- Check connection string format
- Check firewall rules
- Check SSL settings (`ssl=True` is required)

---

## 📚 Further resources

- [Azure Container Apps Docs](https://docs.microsoft.com/azure/container-apps/)
- [Service discovery in Container Apps](https://docs.microsoft.com/azure/container-apps/networking)
- [Environment variables](https://docs.microsoft.com/azure/container-apps/environment-variables)

