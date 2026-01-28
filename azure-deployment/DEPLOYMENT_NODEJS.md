# 🚀 Azure Deployment - Node.js Services

Deployment-Guide für die Node.js Services in Azure Container Apps.

---

## 📋 Voraussetzungen

1. ✅ Azure Ressourcen erstellt (siehe `README.md`)
2. ✅ Azure Container Registry (ACR) vorhanden
3. ✅ Container Apps Environment erstellt
4. ✅ Cosmos DB & Redis erstellt
5. ✅ Key Vault erstellt

---

## 🐳 Docker Images bauen

### Build-Script erstellen

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

## 🚀 Container Apps deployen

### API Service

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

### Auth Service

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

### Secrets Service

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

### Execution Service

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

### Scheduler Service

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

## 🔄 Update bestehender Container Apps

```bash
# Image aktualisieren
az containerapp update \
  --name api-service \
  --resource-group monshy-rg \
  --image monshy.azurecr.io/api-service:latest

# Oder alle Services aktualisieren
for service in api-service auth-service secrets-service execution-service scheduler-service; do
  az containerapp update \
    --name $service \
    --resource-group monshy-rg \
    --image monshy.azurecr.io/$service:latest
done
```

---

## 📊 Health Checks

Jeder Service sollte einen `/health` Endpoint haben:

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

### Logs anzeigen

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

## ✅ Checkliste

- [ ] Docker Images gebaut und gepusht
- [ ] Container Apps erstellt
- [ ] Environment Variables gesetzt
- [ ] Key Vault Secrets referenziert
- [ ] Health Checks funktionieren
- [ ] Service Discovery funktioniert
- [ ] Logs sichtbar
- [ ] Frontend kann Gateway erreichen

---

## 🐛 Troubleshooting

### Service kann andere Services nicht erreichen

**Problem:** Service Discovery funktioniert nicht

**Lösung:**
- Prüfe interne Container App Namen (müssen exakt übereinstimmen)
- Prüfe Port (muss 80 sein in Azure, außer execution-service: 5004)
- Prüfe Ingress (muss `internal` sein für interne Services)
- Prüfe Environment Variables (Service URLs müssen korrekt sein)

### Database Connection Error

**Problem:** Cosmos DB Connection schlägt fehl

**Lösung:**
- Prüfe Connection String Format
- Prüfe Firewall-Regeln (Cosmos DB muss Container Apps erlauben)
- Prüfe SSL Settings (`ssl=true` ist erforderlich)

### Redis Connection Error

**Problem:** Redis Connection schlägt fehl

**Lösung:**
- Prüfe Connection String Format
- Prüfe Firewall-Regeln
- Prüfe SSL Settings (`ssl=True` ist erforderlich)

---

## 📚 Weitere Ressourcen

- [Azure Container Apps Docs](https://docs.microsoft.com/azure/container-apps/)
- [Service Discovery in Container Apps](https://docs.microsoft.com/azure/container-apps/networking)
- [Environment Variables](https://docs.microsoft.com/azure/container-apps/environment-variables)

