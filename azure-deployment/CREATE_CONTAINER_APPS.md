# 🚀 Container Apps erstellen - Schritt für Schritt

Anleitung zum Erstellen der Container Apps für MonshyFlow in Azure.

---

## 📋 Voraussetzungen

Bevor du Container Apps erstellst, benötigst du:

- ✅ **Resource Group** erstellt
- ✅ **Container Apps Environment** erstellt
- ✅ **Key Vault** erstellt mit Secrets:
  - `MongoDBConnectionStringFlow`
  - `JwtSecretKey`
  - `EncryptionKey`
- ✅ **Azure Container Registry** (optional, für eigene Images)
- ✅ **Redis Cache** (optional, für Caching)

---

## 🎯 Option 1: Mit PowerShell Script (Empfohlen)

### Schritt 1: Script ausführen

```powershell
cd azure-deployment/scripts
.\create-container-apps-fixed.ps1 -ResourceGroupName "<your-resource-group>" -EnvironmentName "monshy-env" -KeyVaultName "monshy-kv"
```

Das Script erstellt automatisch alle 5 Container Apps:
- `auth-service`
- `secrets-service`
- `api-service`
- `execution-service`
- `scheduler-service`

### Schritt 2: Prüfen

```powershell
# Liste aller Container Apps anzeigen
az containerapp list --resource-group <your-resource-group> --output table

# Status eines Services prüfen
az containerapp show --name api-service --resource-group <your-resource-group> --query "properties.runningStatus"
```

---

## 🎯 Option 2: Manuell über Azure Portal

### Schritt 1: Container App erstellen

1. Gehe zu **Azure Portal** → **Container Apps**
2. Klicke **"+ Create"**
3. Fülle die Basis-Informationen aus:
   - **Subscription:** Produktion
   - **Resource Group:** <your-resource-group>
   - **Container App name:** `auth-service` (oder `api-service`, etc.)
   - **Region:** West Europe
   - **Container Apps Environment:** Wähle `monshy-env` oder erstelle neu

### Schritt 2: Container konfigurieren

1. **Container Settings:**
   - **Image source:** Docker Hub oder Azure Container Registry
   - **Image:** `mcr.microsoft.com/azuredocs/containerapps-helloworld:latest` (Platzhalter)
   - **Target port:** `80` (oder `5004` für execution-service)

2. **Ingress:**
   - **Ingress:** Enabled
   - **Traffic:** 
     - `api-service`: **External** (von außen erreichbar)
     - Andere Services: **Internal** (nur intern)

### Schritt 3: Environment Variables setzen

Klicke auf **"Environment variables"** und füge hinzu:

#### Für `auth-service`:
```
PORT=80
NODE_ENV=production
MONGODB_URL=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/MongoDBConnectionStringFlow/)
JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)
JWT_ISSUER=monshy-auth-service
JWT_AUDIENCE=monshy-services
```

#### Für `api-service`:
```
PORT=80
NODE_ENV=production
MONGODB_URL=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/MongoDBConnectionStringFlow/)
JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)
JWT_ISSUER=monshy-auth-service
JWT_AUDIENCE=monshy-services
AUTH_SERVICE_URL=http://auth-service:80
SECRETS_SERVICE_URL=http://secrets-service:80
EXECUTION_SERVICE_URL=http://execution-service:5004
SCHEDULER_SERVICE_URL=http://scheduler-service:80
```

#### Für `secrets-service`:
```
PORT=80
NODE_ENV=production
MONGODB_URL=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/MongoDBConnectionStringFlow/)
SECRETS_ENCRYPTION_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/EncryptionKey/)
JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)
JWT_ISSUER=monshy-auth-service
JWT_AUDIENCE=monshy-services
AUTH_SERVICE_URL=http://auth-service:80
```

### Schritt 4: Scaling konfigurieren

- **Min replicas:** `0` (spart Kosten, startet bei Bedarf)
- **Max replicas:** `1-2` (je nach Service)

### Schritt 5: Erstellen

Klicke **"Review + create"** → **"Create"**

---

## 🎯 Option 3: Mit Azure CLI (Manuell)

### Auth Service

```bash
az containerapp create \
  --name auth-service \
  --resource-group <your-resource-group> \
  --environment monshy-env \
  --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
  --target-port 80 \
  --ingress internal \
  --min-replicas 0 \
  --max-replicas 1 \
  --env-vars \
    "PORT=80" \
    "NODE_ENV=production" \
    "MONGODB_URL=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/MongoDBConnectionStringFlow/)" \
    "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)" \
    "JWT_ISSUER=monshy-auth-service" \
    "JWT_AUDIENCE=monshy-services"
```

### API Service

```bash
az containerapp create \
  --name api-service \
  --resource-group <your-resource-group> \
  --environment monshy-env \
  --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
  --target-port 80 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 2 \
  --env-vars \
    "PORT=80" \
    "NODE_ENV=production" \
    "MONGODB_URL=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/MongoDBConnectionStringFlow/)" \
    "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/JwtSecretKey/)" \
    "JWT_ISSUER=monshy-auth-service" \
    "JWT_AUDIENCE=monshy-services" \
    "AUTH_SERVICE_URL=http://auth-service:80" \
    "SECRETS_SERVICE_URL=http://secrets-service:80" \
    "EXECUTION_SERVICE_URL=http://execution-service:5004" \
    "SCHEDULER_SERVICE_URL=http://scheduler-service:80"
```

---

## ⚠️ Wichtig: Key Vault Zugriff gewähren

Die Container Apps müssen Zugriff auf Key Vault haben:

### 1. Managed Identity aktivieren

Für jeden Container App:

```bash
az containerapp identity assign \
  --name <service-name> \
  --resource-group <your-resource-group> \
  --system-assigned
```

### 2. Key Vault Zugriff gewähren

```bash
# Get Principal ID
PRINCIPAL_ID=$(az containerapp show --name <service-name> --resource-group <your-resource-group> --query identity.principalId -o tsv)

# Grant access to Key Vault
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $PRINCIPAL_ID \
  --scope /subscriptions/<subscription-id>/resourceGroups/DeepResearch/providers/Microsoft.KeyVault/vaults/monshy-kv
```

---

## 🔄 Eigene Docker Images verwenden

Nachdem die Container Apps erstellt sind, kannst du deine eigenen Images verwenden:

### 1. Images bauen und pushen

```bash
# Login to ACR
az acr login --name monshyregistry

# Build and push
docker build -t monshyregistry.azurecr.io/api-service:latest -f packages/api-service/Dockerfile .
docker push monshyregistry.azurecr.io/api-service:latest
```

### 2. Container App aktualisieren

```bash
az containerapp update \
  --name api-service \
  --resource-group <your-resource-group> \
  --image monshyregistry.azurecr.io/api-service:latest
```

---

## ✅ Checklist

- [ ] Container Apps Environment erstellt
- [ ] Key Vault Secrets vorhanden
- [ ] Container Apps erstellt (alle 5 Services)
- [ ] Environment Variables gesetzt
- [ ] Key Vault Zugriff gewährt (Managed Identity)
- [ ] Container Apps laufen (Status: Running)
- [ ] API Service URL notiert

---

## 🐛 Troubleshooting

### Container App startet nicht

```bash
# Logs anzeigen
az containerapp logs show --name <service-name> --resource-group <your-resource-group> --follow
```

### Key Vault Zugriff verweigert

- Prüfe Managed Identity
- Prüfe Role Assignment
- Warte 2-3 Minuten (RBAC Propagation)

### Service kann andere Services nicht erreichen

- Prüfe interne Namen (müssen exakt übereinstimmen)
- Prüfe Ports (80 oder 5004)
- Prüfe Ingress (internal für interne Services)

---

**Last Updated:** 2024

