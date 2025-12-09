# 🚀 Azure Deployment - Node.js Services

Deployment-Guide für die neuen Node.js Services in Azure Container Apps.

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

# Build and push Gateway
docker build -t $ACR_NAME.azurecr.io/gateway:latest -f packages/gateway/Dockerfile .
docker push $ACR_NAME.azurecr.io/gateway:latest

# Build and push Workflow Service
docker build -t $ACR_NAME.azurecr.io/workflow-service:latest -f packages/workflow-service/Dockerfile .
docker push $ACR_NAME.azurecr.io/workflow-service:latest

# Build and push Auth Service (wenn fertig)
# docker build -t $ACR_NAME.azurecr.io/auth-service:latest -f packages/auth-service/Dockerfile .
# docker push $ACR_NAME.azurecr.io/auth-service:latest

echo "✅ All images built and pushed"
```

---

## 🚀 Container Apps deployen

### Gateway Service

```bash
az containerapp create \
  --name gateway \
  --resource-group monshy-rg \
  --environment monshy-env \
  --image monshy.azurecr.io/gateway:latest \
  --target-port 80 \
  --ingress external \
  --registry-server monshy.azurecr.io \
  --env-vars \
    "WORKFLOW_SERVICE_URL=http://workflow-service:80" \
    "AUTH_SERVICE_URL=http://auth-service:80" \
    "SECRETS_SERVICE_URL=http://secrets-service:80" \
    "EXECUTION_SERVICE_URL=http://execution-service:80" \
    "SCHEDULER_SERVICE_URL=http://scheduler-service:80" \
    "FRONTEND_URL=https://your-frontend.azurestaticapps.net"
```

### Workflow Service

```bash
az containerapp create \
  --name workflow-service \
  --resource-group monshy-rg \
  --environment monshy-env \
  --image monshy.azurecr.io/workflow-service:latest \
  --target-port 80 \
  --ingress internal \
  --registry-server monshy.azurecr.io \
  --env-vars \
    "MONGODB_URL=<cosmos-db-connection-string>" \
    "REDIS_URL=<redis-connection-string>" \
    "RABBITMQ_URL=<rabbitmq-url-or-empty>" \
    "EXECUTION_SERVICE_URL=http://execution-service:80" \
    "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)" \
    "JWT_ISSUER=monshy-auth-service" \
    "JWT_AUDIENCE=monshy-services" \
    "PORT=80"
```

### Auth Service (wenn fertig)

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

---

## 🔄 Update bestehender Container Apps

```bash
# Image aktualisieren
az containerapp update \
  --name gateway \
  --resource-group monshy-rg \
  --image monshy.azurecr.io/gateway:latest
```

---

## 📊 Health Checks

Jeder Service sollte einen `/health` Endpoint haben:

```typescript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'workflow-service',
    timestamp: new Date().toISOString()
  });
});
```

---

## 🔍 Monitoring

### Logs anzeigen

```bash
az containerapp logs show \
  --name gateway \
  --resource-group monshy-rg \
  --follow
```

### Metrics

```bash
az containerapp show \
  --name gateway \
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
- Prüfe Port (muss 80 sein in Azure)
- Prüfe Ingress (muss `internal` sein für interne Services)

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

