# Azure Resource Creation Scripts

Diese Scripts erstellen alle notwendigen Azure-Ressourcen für das Monshy-Projekt.

---

## 📋 Scripts Übersicht

1. **01-create-resource-group** - Erstellt Resource Group
2. **02-create-container-registry** - Erstellt Azure Container Registry (ACR)
3. **03-create-container-apps-environment** - Erstellt Container Apps Environment
4. **04-create-cosmos-db** - Erstellt Cosmos DB (MongoDB API)
5. **05-create-redis-cache** - Erstellt Azure Cache for Redis
6. **06-create-key-vault** - Erstellt Azure Key Vault
7. **07-summary** - Zeigt Zusammenfassung aller erstellten Ressourcen

**Hinweis:** RabbitMQ ist **nicht** enthalten (optional, Code hat Fallback zu in-memory queue). Siehe [../RABBITMQ_NOTES.md](../RABBITMQ_NOTES.md) für Details.

---

## 🚀 Verwendung

### Voraussetzungen

1. **Azure CLI installiert**
   ```bash
   # Windows (PowerShell)
   winget install -e --id Microsoft.AzureCLI
   
   # Linux/Mac
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Bei Azure anmelden**
   ```bash
   az login
   ```

3. **Subscription auswählen** (optional)
   ```bash
   az account set --subscription "Your Subscription Name"
   ```

---

### Windows (PowerShell)

```powershell
# Alle Scripts nacheinander ausführen
.\01-create-resource-group.ps1
.\02-create-container-registry.ps1
.\03-create-container-apps-environment.ps1
.\04-create-cosmos-db.ps1
.\05-create-redis-cache.ps1
.\06-create-key-vault.ps1
.\07-summary.ps1
```

### Linux/Mac (Bash)

```bash
# Scripts ausführbar machen
chmod +x *.sh

# Alle Scripts nacheinander ausführen
./01-create-resource-group.sh
./02-create-container-registry.sh
./03-create-container-apps-environment.sh
./04-create-cosmos-db.sh
./05-create-redis-cache.sh
./06-create-key-vault.sh
./07-summary.sh
```

---

## ⚙️ Konfiguration

### Environment Variables

Die Scripts verwenden folgende Environment Variables (mit Defaults):

```bash
# Resource Group
RESOURCE_GROUP_NAME="monshy-rg"
LOCATION="westeurope"

# Container Registry
ACR_NAME="monshyregistry"
ACR_SKU="Basic"

# Container Apps Environment
ENV_NAME="monshy-env"
LOG_ANALYTICS_WORKSPACE="monshy-logs"

# Cosmos DB
COSMOS_ACCOUNT_NAME="monshy-cosmos"
DATABASE_NAME="agentbuilder"
COSMOS_SKU="Serverless"

# Redis
REDIS_NAME="monshy-redis"
REDIS_SKU="Basic"
REDIS_SIZE="C0"

# Key Vault
KEY_VAULT_NAME="monshy-kv"
```

### Custom Configuration

**PowerShell:**
```powershell
$env:RESOURCE_GROUP_NAME = "my-monshy-rg"
$env:LOCATION = "eastus"
$env:ACR_NAME = "myregistry"
.\01-create-resource-group.ps1
```

**Bash:**
```bash
export RESOURCE_GROUP_NAME="my-monshy-rg"
export LOCATION="eastus"
export ACR_NAME="myregistry"
./01-create-resource-group.sh
```

---

## 📝 Wichtige Hinweise

### Globally Unique Names

Folgende Ressourcen benötigen global eindeutige Namen:
- **Container Registry** (ACR): 5-50 alphanumeric chars
- **Cosmos DB**: 3-44 lowercase chars
- **Redis Cache**: 1-63 alphanumeric + hyphens
- **Key Vault**: 3-24 alphanumeric + hyphens

Die Scripts prüfen automatisch, ob Namen verfügbar sind.

### Kosten

Die erstellten Ressourcen verursachen Kosten:
- **Cosmos DB Serverless**: ~$25-50/Monat
- **Redis Basic C0**: ~$15/Monat
- **Container Registry Basic**: ~$5/Monat
- **Container Apps**: Pay-per-use
- **Key Vault**: ~$0.03/10,000 operations

**Gesamt:** ~$75-95/Monat (Development)

### Connection Strings

**WICHTIG:** Alle Scripts geben Connection Strings aus. Speichere diese sicher:
- Cosmos DB Connection String
- Redis Connection String
- ACR Login Server
- Key Vault URI

---

## 🔐 Secrets hinzufügen

Nach dem Erstellen des Key Vaults:

```bash
# JWT Secret Key
az keyvault secret set \
  --vault-name monshy-kv \
  --name JwtSecretKey \
  --value "your-secret-key-min-32-chars"

# Encryption Key
az keyvault secret set \
  --vault-name monshy-kv \
  --name EncryptionKey \
  --value "your-encryption-key-min-32-chars"

# OpenAI API Key
az keyvault secret set \
  --vault-name monshy-kv \
  --name OpenAIApiKey \
  --value "sk-..."
```

---

## ✅ Checkliste

- [ ] Azure CLI installiert
- [ ] Bei Azure angemeldet (`az login`)
- [ ] Subscription ausgewählt
- [ ] Resource Group erstellt
- [ ] Container Registry erstellt
- [ ] Container Apps Environment erstellt
- [ ] Cosmos DB erstellt
- [ ] Redis Cache erstellt
- [ ] Key Vault erstellt
- [ ] Secrets zu Key Vault hinzugefügt
- [ ] Connection Strings gespeichert

---

## 🐛 Troubleshooting

### "Resource Group does not exist"
→ Führe zuerst `01-create-resource-group` aus

### "Name not available"
→ Wähle einen anderen Namen (muss global eindeutig sein)

### "Not logged in"
→ Führe `az login` aus

### "Subscription not found"
→ Prüfe verfügbare Subscriptions: `az account list`

---

## 📚 Nächste Schritte

Nach dem Erstellen aller Ressourcen:

1. **Docker Images bauen und pushen** (später)
2. **Container Apps deployen** (später)
3. **Environment Variables setzen** (später)
4. **Frontend deployen** (später)

Siehe [Deployment Guide](../README.md) für Details.

