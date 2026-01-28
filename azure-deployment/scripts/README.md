# Azure Resource Creation Scripts

These scripts create all necessary Azure resources for the Monshy project.

---

## 📋 Scripts Overview

1. **01-create-resource-group** - Creates Resource Group
2. **02-create-container-registry** - Creates Azure Container Registry (ACR)
3. **03-create-container-apps-environment** - Creates Container Apps Environment
4. **04-create-cosmos-db** - Creates Cosmos DB (MongoDB API)
5. **05-create-redis-cache** - Creates Azure Cache for Redis
6. **06-create-key-vault** - Creates Azure Key Vault
7. **07-summary** - Shows summary of all created resources

**Note:** RabbitMQ is **not** included (optional, code has fallback to in-memory queue). See [../RABBITMQ_NOTES.md](../RABBITMQ_NOTES.md) for details.

---

## 🚀 Usage

### Prerequisites

1. **Azure CLI installed**
   ```bash
   # Windows (PowerShell)
   winget install -e --id Microsoft.AzureCLI
   
   # Linux/Mac
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Log in to Azure**
   ```bash
   az login
   ```

3. **Select Subscription** (optional)
   ```bash
   az account set --subscription "Your Subscription Name"
   ```

---

### Windows (PowerShell)

```powershell
# Execute all scripts sequentially
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
# Make scripts executable
chmod +x *.sh

# Execute all scripts sequentially
./01-create-resource-group.sh
./02-create-container-registry.sh
./03-create-container-apps-environment.sh
./04-create-cosmos-db.sh
./05-create-redis-cache.sh
./06-create-key-vault.sh
./07-summary.sh
```

---

## ⚙️ Configuration

### Environment Variables

The scripts use the following environment variables (with defaults):

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

## 📝 Important Notes

### Globally Unique Names

The following resources require globally unique names:
- **Container Registry** (ACR): 5-50 alphanumeric chars
- **Cosmos DB**: 3-44 lowercase chars
- **Redis Cache**: 1-63 alphanumeric + hyphens
- **Key Vault**: 3-24 alphanumeric + hyphens

The scripts automatically check if names are available.

### Costs

The created resources incur costs:
- **Cosmos DB Serverless**: ~$25-50/Month
- **Redis Basic C0**: ~$15/Month
- **Container Registry Basic**: ~$5/Month
- **Container Apps**: Pay-per-use
- **Key Vault**: ~$0.03/10,000 operations

**Total:** ~$75-95/Month (Development)

### Connection Strings

**IMPORTANT:** All scripts output connection strings. Save these securely:
- Cosmos DB Connection String
- Redis Connection String
- ACR Login Server
- Key Vault URI

---

## 🔐 Add Secrets

After creating the Key Vault:

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

## ✅ Checklist

- [ ] Azure CLI installed
- [ ] Logged in to Azure (`az login`)
- [ ] Subscription selected
- [ ] Resource Group created
- [ ] Container Registry created
- [ ] Container Apps Environment created
- [ ] Cosmos DB created
- [ ] Redis Cache created
- [ ] Key Vault created
- [ ] Secrets added to Key Vault
- [ ] Connection Strings saved

---

## 🐛 Troubleshooting

### "Resource Group does not exist"
→ Run `01-create-resource-group` first

### "Name not available"
→ Choose a different name (must be globally unique)

### "Not logged in"
→ Run `az login`

### "Subscription not found"
→ Check available subscriptions: `az account list`

---

## 📚 Next Steps

After creating all resources:

1. **Build and push Docker images** (later)
2. **Deploy Container Apps** (later)
3. **Set Environment Variables** (later)
4. **Deploy Frontend** (later)

See [Deployment Guide](../README.md) for details.
